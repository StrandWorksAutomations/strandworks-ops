"use client";
import { useEffect } from "react";
import { humanizeDates } from "@/lib/when";

const RAW = /\d{4}-\d{2}-\d{2}/;
const SKIP = "PRE,CODE,SCRIPT,STYLE,TEXTAREA,INPUT";

function rewrite(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue ?? "";
    if (!RAW.test(text) || node.parentElement?.closest(SKIP)) continue;
    const next = humanizeDates(text);
    if (next !== text) node.nodeValue = next;
  }
}

// Registers and agent notes hold raw dates that no page formats. This catches
// whatever a page did not. Recorded receipts in <pre> stay exactly as filed.
export function HumanDates() {
  useEffect(() => {
    rewrite(document.body);
    const observer = new MutationObserver((changes) => {
      for (const change of changes) {
        if (change.type === "characterData") rewrite(change.target.parentNode ?? change.target);
        change.addedNodes.forEach(rewrite);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
