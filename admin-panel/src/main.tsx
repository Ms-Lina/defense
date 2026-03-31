import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { getAdminKey, getApiBase, setBackendUnavailable } from "./lib/api";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Lessons from "./pages/Lessons";
import Users from "./pages/Users";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import AIMonitoring from "./pages/AIMonitoring";
import Reports from "./pages/Reports";
import "./index.css";

function Protected({ children }: { children: React.ReactNode }) {
  if (!getAdminKey()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const router = createBrowserRouter(
  [
    { path: "/login", element: <Login /> },
    {
      path: "/",
      element: (
        <Protected>
          <Layout />
        </Protected>
      ),
      children: [
        { index: true, element: <Dashboard /> },
        { path: "lessons", element: <Lessons /> },
        { path: "users", element: <Users /> },
        { path: "progress", element: <Progress /> },
        { path: "analytics", element: <Analytics /> },
        { path: "ai-monitoring", element: <AIMonitoring /> },
        { path: "reports", element: <Reports /> },
        { path: "settings", element: <Settings /> },
      ],
    },
    { path: "*", element: <Navigate to="/" replace /> },
  ],
  { basename: import.meta.env.BASE_URL }
);

function AppBoot() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const base = getApiBase();
    if (!base) {
      setReady(true);
      return;
    }
    fetch(`${base}/health`)
      .then((r) => r.json())
      .then((d: { firebase?: boolean }) => {
        setBackendUnavailable(!d.firebase);
        setReady(true);
      })
      .catch(() => {
        setBackendUnavailable(true);
        setReady(true);
      });
  }, []);
  if (!ready) {
    return (
      <div style={{ padding: 24, textAlign: "center", fontFamily: "system-ui" }}>
        Loading…
      </div>
    );
  }
  return <RouterProvider router={router} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppBoot />
  </StrictMode>
);
