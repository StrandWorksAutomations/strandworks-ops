import { Navigation } from "./Navigation";

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
      <Navigation active={active} />
    </div>
  );
}
