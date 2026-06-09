import { Link, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/rules", label: "Rules" },
  { to: "/crew-access", label: "Crew Access" },
  { to: "/missions", label: "Missions" },
  { to: "/leader", label: "Leader" }
];

export function AppShell({ children, settings }) {
  const location = useLocation();

  return (
    <div className="app-shell">
      <div className="ambient-grid" aria-hidden="true" />
      <div className="ambient-sun" aria-hidden="true" />
      <header className="topbar">
        <div className="topbar-brand">
          <p className="eyebrow">Camp Signal //</p>
          <h1>{settings?.subtitle || "Havenwood Mission Control"}</h1>
          <p className="topbar-status">
            Gate Status: <span>{settings?.overallGateStatus || "Awaiting signal"}</span>
          </p>
          <div className="scanline-strip">
            <span>SAFE ZONE ONLINE</span>
            <span>ROVER CHANNEL OPEN</span>
            <span>OTHER SIDE ACTIVITY TRACKED</span>
          </div>
        </div>
        <nav className="topnav">
          {navItems.map((item) => (
            <Link
              key={item.to}
              className={location.pathname === item.to ? "nav-link active" : "nav-link"}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="page-wrap">{children}</main>
    </div>
  );
}
