"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const sync = () => setTheme(document.documentElement.dataset.theme || "dark");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "light" ? "#f2f5fa" : "#05070f");
    try { localStorage.setItem("cockpit-theme", next); } catch {}
    document.cookie = `cockpit-theme=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setTheme(next);
  }

  return <button type="button" className="header-button theme-toggle" onClick={toggle}>
    <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
    {theme === "dark" ? "Light mode" : "Dark mode"}
  </button>;
}
