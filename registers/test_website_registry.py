"""Behavioral tests: invalid inventory and routing must fail before export."""
import copy
from html.parser import HTMLParser
import json
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import website_registry as registry


class WebsiteRegisterTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads(registry.DEFAULT_REGISTER.read_text())

    def assert_invalid(self, text):
        self.assertTrue(any(text in error for error in registry.validate(self.data)), registry.validate(self.data))

    def test_current_register_validates(self):
        self.assertEqual(registry.validate(self.data), [])

    def test_missing_operator_field_is_schema_error(self):
        del self.data["sites"][0]["legal_operator"]
        self.assert_invalid("missing legal_operator")

    def test_unknown_field_is_schema_error(self):
        self.data["sites"][0]["password"] = "should never be a register field"
        self.assert_invalid("unknown field password")

    def test_duplicate_domain_owner_fails(self):
        self.data["sites"][1]["aliases"].append("strandworks.org")
        self.assert_invalid("duplicate domain owner")

    def test_missing_critical_policy_path_fails(self):
        self.data["sites"][1]["critical_paths"].remove("/tenetrix/privacy")
        self.assert_invalid("missing critical policy path")

    def test_unknown_redirect_target_fails(self):
        self.data["redirect_rules"][0]["target_url"] = "https://missing.example.org/"
        self.assert_invalid("unknown internal target")

    def test_unknown_link_target_fails(self):
        self.data["links"][0]["target_site"] = "missing"
        self.assert_invalid("unknown internal link")

    def test_wildcard_redirect_cycle_fails(self):
        rule = copy.deepcopy(self.data["redirect_rules"][-1])
        rule.update(id="reverse", source_hosts=["tenetrix.org"], target_url="https://www.tenetrix.org/:path*")
        self.data["redirect_rules"].append(rule)
        self.assert_invalid("redirect cycle")

    def test_path_growing_nonterminating_redirect_fails(self):
        rule = copy.deepcopy(self.data["redirect_rules"][-1])
        rule.update(id="growth", source_hosts=["tenetrix.org"], source_path="/loop/:path*", target_url="https://tenetrix.org/loop/more/:path*")
        self.data["redirect_rules"].append(rule)
        self.assert_invalid("nonterminating redirect")

    def test_exact_redirect_cycle_fails(self):
        rule = copy.deepcopy(self.data["redirect_rules"][0])
        rule.update(id="self", source_hosts=["tenetrix.org"], source_path="/privacy", target_url="https://tenetrix.org/privacy")
        self.data["redirect_rules"].append(rule)
        self.assert_invalid("redirect cycle")

    def test_exact_routes_precede_wildcard_and_preserve_query_and_fragment(self):
        rules = list(reversed(self.data["redirect_rules"]))
        self.data["redirect_rules"] = rules
        for path in ("/about", "/about/"):
            rule, target = registry.resolve_redirect(self.data, "https://strandautomationworks.com" + path + "?ref=x")
            self.assertEqual(rule["id"], "legacy-about")
            self.assertEqual(target, "https://strandworks.org/?ref=x#about")
        self.assertEqual(registry.resolve_redirect(self.data, "https://www.strandautomationworks.com/tenetrix/privacy?ref=x")[1], "https://tenetrix.org/tenetrix/privacy?ref=x")

    def test_same_domain_can_end_at_a_different_path_without_false_cycle(self):
        rule = copy.deepcopy(self.data["redirect_rules"][0])
        rule.update(id="one-hop", source_hosts=["tenetrix.org"], source_path="/old", target_url="https://tenetrix.org/about")
        self.data["redirect_rules"].append(rule)
        self.assertEqual(registry.validate(self.data), [])

    def test_unknown_dev_and_preview_hosts_do_not_redirect(self):
        for host in ["localhost:3000", "example-preview.vercel.app"]:
            self.assertIsNone(registry.resolve_redirect(self.data, "https://" + host + "/privacy"))

    def test_export_requires_corporate_exact_root_about_and_contact(self):
        self.data["redirect_rules"] = [r for r in self.data["redirect_rules"] if r["id"] != "legacy-root"]
        self.assert_invalid("legacy exact route /")

    def test_export_rejects_query_or_status_divergence(self):
        self.data["redirect_rules"][0]["preserve_query"] = False
        self.assert_invalid("exported digital routing requires 308")

    def test_export_is_derived_from_register(self):
        output = registry.routing_export(self.data)
        self.assertEqual(output["canonicalHost"], "tenetrix.org")
        self.assertEqual(output["canonicalAliases"], ["www.tenetrix.org"])
        self.assertEqual(output["legacyExactRoutes"]["/about"], "https://strandworks.org/#about")
        self.assertEqual(output["legacyExactRoutes"]["/about/trender"], "https://tenetrix.org/about")

    def test_private_investor_link_rejected(self):
        self.data["links"][0]["target_site"] = "sag-investor"
        self.assert_invalid("public link to private/conditional")

    def test_unverified_cannot_be_labeled_live_verified(self):
        self.data["sites"][0]["observed"]["status"] = "live_verified"
        self.data["sites"][0]["last_verification"] = {"at": None, "method": "not_checked", "result": "unverified", "evidence": []}
        self.assert_invalid("live_verified requires dated HTTP or browser evidence")

    def test_live_budget_and_private_exclusion_without_network(self):
        calls = []
        private = self.data["sites"][-1]
        private.update(canonical_url="https://private.example.org", critical_paths=["/"])
        def fake(url, timeout):
            calls.append((url, timeout))
            return {"status": 503, "location": None, "error": None}
        result = registry.live_check(self.data, max_requests=3, timeout=.5, fetch=fake)
        self.assertEqual(len(calls), 3)
        self.assertEqual(result["drift_count"], 3)
        self.assertEqual(result["coverage"], "partial")
        self.assertTrue(result["pending_urls"])
        self.assertFalse(any("private.example.org" in url for url, _ in calls))
        self.assertFalse(any("private.example.org" in url for url in result["pending_urls"]))
        with self.assertRaises(ValueError):
            registry.live_check(self.data, max_requests=41, fetch=fake)

    def test_owner_paused_domains_are_not_probed(self):
        calls = []
        def fake(url, timeout):
            calls.append(url)
            return {"status": 200, "location": None, "error": None}
        report = registry.live_check(self.data, max_requests=40, fetch=fake)
        self.assertFalse(any("strandworks.net" in url for url in calls))
        self.assertIn("corporate-aliases", [r["id"] for r in report["skipped_rules"]])

    def test_render_is_parseable_and_does_not_link_private_brief(self):
        html = registry.render_html(self.data)
        HTMLParser().feed(html)
        self.assertIn("Not live verified", html)
        self.assertIn("Strandworks Medical Resources LLC", html)
        self.assertNotIn('href="https://sag', html)
        self.assertIn("strandautomationworks.com", html)


if __name__ == "__main__":
    unittest.main()
