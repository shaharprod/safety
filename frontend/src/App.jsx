import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Dashboard from './pages/Dashboard.jsx';
import FieldReport from './pages/FieldReport.jsx';
import GateControl from './pages/GateControl.jsx';
import AuditsList from './pages/AuditsList.jsx';
import AuditNew from './pages/AuditNew.jsx';
import AuditSession from './pages/AuditSession.jsx';
import IncidentReport from './pages/IncidentReport.jsx';
import ActivityLog from './pages/ActivityLog.jsx';
import ReportsViewer from './pages/ReportsViewer.jsx';
import AdminWorkers from './pages/AdminWorkers.jsx';
import ToolInspections from './pages/ToolInspections.jsx';
import ToolInspectionSession from './pages/ToolInspectionSession.jsx';
import Projects from './pages/Projects.jsx';
import WorkerCertifications from './pages/WorkerCertifications.jsx';
import Procedures from './pages/Procedures.jsx';
import Login from './pages/Login.jsx';
import PublicGate from './pages/PublicGate.jsx';
import WorkerPortal from './pages/WorkerPortal.jsx';
import ChangePasswordModal from './components/ChangePasswordModal.jsx';
import Alerts from './pages/Alerts.jsx';
import Permits from './pages/Permits.jsx';

const NAV = [
  { to: '/dashboard', label: 'בקרה',     icon: '🏠', end: true },
  { to: '/alerts',    label: 'התראות',   icon: '🔔'            },
  { to: '/audits',    label: 'בקרות',    icon: '📋'            },
  { to: '/report',    label: 'מפגע',     icon: '⚠️'            },
  { to: '/incident',  label: 'אירוע',    icon: '🔍'            },
  { to: '/gate',      label: 'כניסה',    icon: '🔑'            },
  { to: '/tools',     label: 'כלים',     icon: '🔧'            },
  { to: '/projects',  label: 'פרוייקטים',icon: '🏗️'            },
  { to: '/certs',       label: 'הסמכות',   icon: '🎓'            },
  { to: '/procedures', label: 'נהלים',    icon: '📄'            },
  { to: '/permits',    label: 'היתרים',   icon: '📜'            },
  { to: '/reports',    label: 'דוחות',    icon: '📊'            },
  { to: '/admin',     label: 'אדמין',    icon: '⚙️'            },
];

const ROLE_LABELS = {
  admin:          'אדמין',
  safety_officer: 'ממונה בטיחות',
  foreman:        'מנהל עבודה',
};

function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 right-0 left-0 bg-white border-t border-gray-200 z-50 pb-safe">
      <div className="flex overflow-x-auto scrollbar-none">
        {NAV.map(({ to, label, icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2.5 px-1 text-[10px] font-medium transition shrink-0 flex-1 min-w-[52px] min-h-[52px] ${
                isActive ? 'text-blue-700' : 'text-gray-500'
              }`
            }>
            {({ isActive }) => (
              <>
                <span className={`text-[22px] leading-none mb-0.5 ${isActive ? 'scale-110' : ''} transition-transform`}>
                  {icon}
                </span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showChangePw, setShowChangePw] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Top nav */}
      <nav className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-bold tracking-wide">
            🦺 SafetyOS <span className="text-xs font-normal text-blue-300 ml-1">v3.8</span>
          </span>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label, icon, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                    isActive ? 'bg-white text-blue-900' : 'hover:bg-blue-800'
                  }`
                }>
                <span>{icon}</span> {label}
              </NavLink>
            ))}
          </div>

          {/* User info + actions */}
          <div className="flex items-center gap-2">
            {user && (
              <div className="hidden md:flex items-center gap-2 text-sm">
                <span className="text-blue-200">{user.full_name}</span>
                <span className="bg-blue-700 text-blue-100 text-xs px-2 py-0.5 rounded-full">
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </div>
            )}
            <button
              onClick={() => setShowChangePw(true)}
              className="hidden md:block text-blue-200 hover:text-white transition text-sm px-2 py-1 rounded hover:bg-blue-800"
              title="שנה סיסמה"
            >
              🔐
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
              title="התנתק"
            >
              <span className="hidden md:inline">יציאה</span>
              <span>🚪</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-5 pb-36 md:pb-6">
        <Routes>
          <Route path="/"                element={<Dashboard />} />
          <Route path="/dashboard"       element={<Dashboard />} />
          <Route path="/alerts"          element={<Alerts />} />
          <Route path="/report"          element={<FieldReport />} />
          <Route path="/gate"            element={<GateControl />} />
          <Route path="/audits"          element={<AuditsList />} />
          <Route path="/audit/new/:type" element={<AuditNew />} />
          <Route path="/audit/:id"       element={<AuditSession />} />
          <Route path="/incident"        element={<IncidentReport />} />
          <Route path="/activity"        element={<ActivityLog />} />
          <Route path="/reports"         element={<ReportsViewer />} />
          <Route path="/tools"           element={<ToolInspections />} />
          <Route path="/tool-inspection/:id" element={<ToolInspectionSession />} />
          <Route path="/projects"        element={<Projects />} />
          <Route path="/certs"           element={<WorkerCertifications />} />
          <Route path="/procedures"      element={<Procedures />} />
          <Route path="/permits"         element={<Permits />} />
          <Route path="/admin"           element={<AdminWorkers />} />
        </Routes>
      </main>

      <BottomNav />

      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/"               element={<PublicGate />} />
      <Route path="/worker-portal"  element={<WorkerPortal />} />
      <Route path="/login"          element={<Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
