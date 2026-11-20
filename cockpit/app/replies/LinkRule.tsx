import { LINK_POLICY_LABEL, type LinkPolicy } from "@/lib/kc-replies";

// Green: the group's rules allow links. Red: they ban links or promotion. Yellow: not known.
// The words carry the meaning; the dot is only the quick visual cue.
export function LinkRule({ policy, note, checked }: { policy: LinkPolicy; note?: string; checked?: string }) {
  const detail = [note, checked ? `Rules read ${checked}.` : ""].filter(Boolean).join(" ");
  return (
    <span className={`link-rule ${policy}`} title={detail || undefined}>
      <span className="link-dot" aria-hidden="true" />{LINK_POLICY_LABEL[policy]}
    </span>
  );
}
