import { Navigation } from "./Navigation";
import { AppHeader } from "./AppHeader";

// The shared page frame. Operate uses AppHeader with its three-column content.
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
    <div className="sw-root">
      <AppHeader title={title} sub={sub} active={active} />
      <div className="sw-shell">
        <Navigation active={active} />
        <main className="shell" id="main-content" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
