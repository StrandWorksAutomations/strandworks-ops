import { Navigation } from "./Navigation";
import { TextSize } from "./TextSize";

// Shared frame for every page except Operate, styled to match it: the
// STRANDWORKS // PAGE bar, the section rail, then the page.
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
    <div className="sw-root">
      <header className="topbar">
        <div className="sw-brand">
          <div className="sw-wordmark">
            STRANDWORKS <span>// </span>
            <h1>{title}</h1>
          </div>
          {sub ? <div className="sub">{sub}</div> : null}
        </div>
        <div className="topbar-right">
          <span className="today">{today}</span>
          <TextSize />
          <form action="/api/auth/logout" method="post">
            <button className="lock-btn">Lock</button>
          </form>
        </div>
      </header>
      <div className="sw-shell">
        <Navigation active={active} />
        <main className="shell">{children}</main>
      </div>
    </div>
  );
}
