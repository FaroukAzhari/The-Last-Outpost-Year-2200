import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearSession, getSession } from "../session";

const publicNav = [
  { to: "/", label: "Outpost" },
  { to: "/rules", label: "Survival Laws" },
  { to: "/briefing", label: "A.R.K. Briefing" },
  { to: "/evaluation-system", label: "Human Override Index" }
];

export function AppShell({ children, settings }) {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();

  function handleLogout() {
    clearSession();
    navigate("/");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand-mark" to="/">
          <span>A.R.K.</span>
          <strong>{settings?.campTitle || "The Last Outpost: Year 2200"}</strong>
        </Link>
        <nav className="topnav" aria-label="Primary navigation">
          {publicNav.map((item) => (
            <Link
              key={item.to}
              className={location.pathname === item.to ? "nav-link active" : "nav-link"}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
          {session?.role === "rover" ? <Link className="nav-link" to="/rover">Rover Board</Link> : null}
          {session?.role === "rover" ? <Link className="nav-link" to="/outpost-blueprint">Outpost Blueprint</Link> : null}
          {session?.role === "leader" ? <Link className="nav-link" to="/leader">Leader Board</Link> : null}
          {session?.role === "leader" ? <Link className="nav-link" to="/leader/blueprint">Blueprint Command</Link> : null}
          {session ? (
            <button className="nav-link nav-button" onClick={handleLogout} type="button">Logout</button>
          ) : null}
        </nav>
      </header>
      <main className="page-wrap">{children}</main>
    </div>
  );
}
