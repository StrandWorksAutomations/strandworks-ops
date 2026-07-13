import Link from "next/link";

const TABS = [
  { href: "/", label: "Overview" },
  { href: "/projects", label: "Projects" },
  { href: "/registers", label: "Registers" },
  { href: "/decisions", label: "Decide" },
  { href: "/status", label: "Status" },
  { href: "/reports", label: "Reports" },
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
  return (
    <div className="shell">
      <div className="topbar">
        <div>
          <h1>{title}</h1>
          {sub ? <div className="sub">{sub}</div> : null}
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="badge" style={{ background: "none", cursor: "pointer" }}>
            lock
          </button>
        </form>
      </div>
      {children}
      <nav className="nav">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={t.href === active ? "active" : ""}>
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
