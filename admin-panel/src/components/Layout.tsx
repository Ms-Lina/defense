import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  TrendingUp,
  BarChart3,
  MessageCircle,
  FileText,
  Settings,
  LogOut,
  AlertCircle,
} from "lucide-react";
import { clearAdminKey, getBackendUnavailable } from "../lib/api";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/lessons", label: "Lessons", icon: BookOpen },
  { to: "/users", label: "Users", icon: Users },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/ai-monitoring", label: "AI Monitoring", icon: MessageCircle },
  { to: "/reports", label: "Report", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Layout() {
  const navigate = useNavigate();
  const [backendUnavailable, setBackendUnavailable] = useState(getBackendUnavailable);
  useEffect(() => {
    setBackendUnavailable(getBackendUnavailable());
  }, []);

  const logout = () => {
    clearAdminKey();
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-layout">
      {backendUnavailable && (
        <div
          className="admin-banner-unavailable"
          style={{
            background: "#fef3c7",
            color: "#92400e",
            padding: "8px 16px",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={18} />
          Backend database not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON in backend/.env and restart the backend (port 4000).
        </div>
      )}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">MenyAI Admin</div>
        <nav>
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                "admin-sidebar-nav-link" + (isActive ? " active" : "")
              }
            >
              <Icon size={18} strokeWidth={2} className="admin-nav-icon-svg" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button
            type="button"
            onClick={logout}
            className="admin-btn admin-btn-secondary admin-btn-logout"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-main-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
