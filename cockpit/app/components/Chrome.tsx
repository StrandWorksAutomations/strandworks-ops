import Link from "next/link";

const TABS = [
  { href: "/operate", label: "Operate" },
  { href: "/", label: "Today" },
  { href: "/money", label: "Money" },
  { href: "/projects", label: "Projects" },
  { href: "/decisions", label: "Decide" },
  { href: "/ops", label: "Ops" },
];

export function Chrome({
  title,
  sub,
  active,
  children,
}: {
  title: string;
  sub?: string;
  active: string;
  children: React.ReactNode;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">Strandworks ops</div>
          <h1>{title}</h1>
          {sub ? <div className="sub">{sub}</div> : null}
        </div>
        <div className="topbar-right">
          <span className="today">{today}</span>
          <form action="/api/auth/logout" method="post">
            <button className="lock-btn">Lock</button>
          </form>
        </div>
      </header>
      {children}
      <nav className="nav" aria-label="Cockpit sections">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={t.href === active ? "active" : ""}>
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
