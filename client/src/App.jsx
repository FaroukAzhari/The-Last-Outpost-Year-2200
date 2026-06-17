import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./api";
import { AppShell } from "./components/AppShell";
import { isLeaderSession, isRoverSession } from "./session";
import { HomePage } from "./pages/HomePage";
import { RulesPage } from "./pages/RulesPage";
import { BriefingPage } from "./pages/BriefingPage";
import { EvaluationSystemPage } from "./pages/EvaluationSystemPage";
import { RoverSignupPage } from "./pages/RoverSignupPage";
import { RoverLoginPage } from "./pages/RoverLoginPage";
import { RoverDashboardPage } from "./pages/RoverDashboardPage";
import { ScoreboardPage } from "./pages/ScoreboardPage";
import { MissionsPage } from "./pages/MissionsPage";
import { MissionDetailPage } from "./pages/MissionDetailPage";
import { LeaderLoginPage } from "./pages/LeaderLoginPage";
import { LeaderDashboardPage } from "./pages/LeaderDashboardPage";
import { ManageRoversPage } from "./pages/ManageRoversPage";
import { LeaderEvaluationPage } from "./pages/LeaderEvaluationPage";
import { LeaderIndividualEvaluationPage } from "./pages/LeaderIndividualEvaluationPage";
import { EvaluationHistoryPage } from "./pages/EvaluationHistoryPage";
import { IndividualEvaluationHistoryPage } from "./pages/IndividualEvaluationHistoryPage";
import { ReportsPage } from "./pages/ReportsPage";
import { OutpostBlueprintPage } from "./pages/OutpostBlueprintPage";

function LeaderRoute({ children }) {
  return isLeaderSession() ? children : <Navigate to="/leader-login" replace />;
}

function RoverRoute({ children }) {
  return isRoverSession() ? children : <Navigate to="/rover-login" replace />;
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
      {loading ? <div className="notice">Loading A.R.K. feed...</div> : null}
      {error ? <div className="notice error-panel">{error}</div> : null}
      {!loading && !error ? (
        <Routes>
          <Route path="/" element={<HomePage settings={settings} />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/briefing" element={<BriefingPage />} />
          <Route path="/evaluation-system" element={<EvaluationSystemPage />} />
          <Route path="/signup" element={<RoverSignupPage />} />
          <Route path="/rover-login" element={<RoverLoginPage />} />
          <Route path="/leader-login" element={<LeaderLoginPage />} />
          <Route path="/scoreboard" element={<ScoreboardPage />} />
          <Route
            path="/evaluation-history"
            element={(
              isLeaderSession() || isRoverSession()
                ? <EvaluationHistoryPage />
                : <Navigate to="/rover-login" replace />
            )}
          />
          <Route
            path="/individual-evaluation-history"
            element={(
              isLeaderSession() || isRoverSession()
                ? <IndividualEvaluationHistoryPage />
                : <Navigate to="/rover-login" replace />
            )}
          />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/missions/:missionId" element={<MissionDetailPage />} />
          <Route
            path="/outpost-blueprint"
            element={(
              isLeaderSession() || isRoverSession()
                ? <OutpostBlueprintPage />
                : <Navigate to="/rover-login" replace />
            )}
          />
          <Route path="/rover" element={<RoverRoute><RoverDashboardPage /></RoverRoute>} />
          <Route path="/leader" element={<LeaderRoute><LeaderDashboardPage /></LeaderRoute>} />
          <Route path="/leader/rovers" element={<LeaderRoute><ManageRoversPage /></LeaderRoute>} />
          <Route path="/leader/blueprint" element={<LeaderRoute><OutpostBlueprintPage mode="leader" /></LeaderRoute>} />
          <Route path="/leader/evaluations" element={<LeaderRoute><LeaderEvaluationPage /></LeaderRoute>} />
          <Route path="/leader/individual-evaluations" element={<LeaderRoute><LeaderIndividualEvaluationPage /></LeaderRoute>} />
          <Route path="/leader/reports" element={<LeaderRoute><ReportsPage /></LeaderRoute>} />
        </Routes>
      ) : null}
    </AppShell>
  );
}
