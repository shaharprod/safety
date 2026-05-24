import React, { useState } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
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

const NAV = [
  { to: '/',         label: 'בקרה',     icon: '🏠', end: true },
  { to: '/audits',   label: 'בקרות',    icon: '📋'            },
  { to: '/report',   label: 'מפגע',     icon: '⚠️'            },
  { to: '/incident', label: 'אירוע',    icon: '🔍'            },
  { to: '/gate',     label: 'כניסה',    icon: '🔑'            },
  { to: '/tools',    label: 'כלים',     icon: '🔧'            },
  { to: '/projects', label: 'פרוייקטים',icon: '🏗️'            },
  { to: '/reports',  label: 'דוחות',    icon: '📊'            },
  { to: '/admin',    label: 'אדמין',    icon: '⚙️'            },
];

function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 right-0 left-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
      <div className="grid grid-cols-9">
        {NAV.map(({ to, label, icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 text-[9px] font-medium transition ${
                isActive ? 'text-blue-700' : 'text-gray-500'
              }`
            }>
            {({ isActive }) => (
              <>
                <span className={`text-xl leading-none mb-0.5 ${isActive ? 'scale-110' : ''} transition-transform`}>
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

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Top nav — desktop only */}
      <nav className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-bold tracking-wide">🦺 SafetyOS</span>

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

          {/* Mobile: title only (nav is bottom bar) */}
          <span className="md:hidden text-sm text-blue-200">מערכת ניהול בטיחות</span>
        </div>
      </nav>

      {/* Page content — extra bottom padding on mobile for bottom nav */}
      <main className="max-w-6xl mx-auto px-4 py-5 pb-24 md:pb-6">
        <Routes>
          <Route path="/"                element={<Dashboard />} />
          <Route path="/dashboard"       element={<Dashboard />} />
          <Route path="/report"          element={<FieldReport />} />
          <Route path="/gate"            element={<GateControl />} />
          <Route path="/audits"          element={<AuditsList />} />
          <Route path="/audit/new/:type" element={<AuditNew />} />
          <Route path="/audit/:id"       element={<AuditSession />} />
          <Route path="/incident"        element={<IncidentReport />} />
          <Route path="/activity"        element={<ActivityLog />} />
          <Route path="/reports"                  element={<ReportsViewer />} />
          <Route path="/tools"                   element={<ToolInspections />} />
          <Route path="/tool-inspection/:id"     element={<ToolInspectionSession />} />
          <Route path="/projects"                element={<Projects />} />
          <Route path="/admin"                   element={<AdminWorkers />} />
        </Routes>
      </main>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  );
}
