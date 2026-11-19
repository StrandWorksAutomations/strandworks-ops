"use client";

import { useEffect } from "react";

// A tap anywhere on a card opens it. The card's own link wins (a link marked
// data-primary, else a heading link, else its first link); a card with no
// link but a collapsed section expands it instead. Taps on controls, text
// selections and modified clicks keep their normal behaviour.
const CONTROLS = "a, button, summary, input, textarea, select, label, [role=button], [data-no-cardtap]";
const CARDS = ".card, article, .op-event-row, .op-event-card";

export function primaryTarget(card: Element): HTMLElement | null {
  const scope = card.classList.contains("op-event-card") && card.previousElementSibling
    ? card.previousElementSibling : card;
  const link = scope.querySelector<HTMLAnchorElement>("a[data-primary][href]")
    ?? scope.querySelector<HTMLAnchorElement>("h1 a[href], h2 a[href], h3 a[href]")
    ?? scope.querySelector<HTMLAnchorElement>("a[href]");
  if (link) return link;
  return card.querySelector<HTMLElement>("details:not([open]) > summary");
}

export function CardTap() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as Element | null;
      if (!target || target.closest(CONTROLS)) return;
      if (window.getSelection()?.toString()) return;
      const card = target.closest(CARDS);
      if (!card) return;
      primaryTarget(card)?.click();
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
