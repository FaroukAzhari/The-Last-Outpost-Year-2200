import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./api";
import { AppShell } from "./components/AppShell";
import { HomePage } from "./pages/HomePage";
import { RulesPage } from "./pages/RulesPage";
import { CrewAccessPage } from "./pages/CrewAccessPage";
import { CrewDashboardPage } from "./pages/CrewDashboardPage";
import { MissionsPage } from "./pages/MissionsPage";
import { MissionDetailPage } from "./pages/MissionDetailPage";
import { LeaderLoginPage } from "./pages/LeaderLoginPage";
import { LeaderDashboardPage } from "./pages/LeaderDashboardPage";
import { EvaluationsPage } from "./pages/EvaluationsPage";
import { ReportsPage } from "./pages/ReportsPage";

function ProtectedLeaderRoute({ children }) {
  const isLeader = localStorage.getItem("havenwood-leader-auth") === "true";
  return isLeader ? children : <Navigate to="/leader-login" replace />;
}

export default function App() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getPublicSettings()
      .then(setSettings)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell settings={settings}>
      {loading ? <div className="panel">Loading transmission...</div> : null}
      {error ? <div className="panel error-panel">{error}</div> : null}
      {!loading && !error ? (
        <Routes>
          <Route path="/" element={<HomePage settings={settings} />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/crew-access" element={<CrewAccessPage />} />
          <Route path="/crew/:crewId" element={<CrewDashboardPage />} />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/missions/:missionId" element={<MissionDetailPage />} />
          <Route path="/leader-login" element={<LeaderLoginPage />} />
          <Route
            path="/leader"
            element={(
              <ProtectedLeaderRoute>
                <LeaderDashboardPage />
              </ProtectedLeaderRoute>
            )}
          />
          <Route
            path="/leader/evaluations"
            element={(
              <ProtectedLeaderRoute>
                <EvaluationsPage />
              </ProtectedLeaderRoute>
            )}
          />
          <Route
            path="/leader/reports"
            element={(
              <ProtectedLeaderRoute>
                <ReportsPage />
              </ProtectedLeaderRoute>
            )}
          />
        </Routes>
      ) : null}
    </AppShell>
  );
}
