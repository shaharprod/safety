import React, { useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import FieldReport from './pages/FieldReport.jsx';
import GateControl from './pages/GateControl.jsx';
import AuditsList from './pages/AuditsList.jsx';
import AuditNew from './pages/AuditNew.jsx';
import AuditSession from './pages/AuditSession.jsx';
import IncidentReport from './pages/IncidentReport.jsx';
import ActivityLog from './pages/ActivityLog.jsx';
import ReportsViewer from './pages/ReportsViewer.jsx';

const NAV = [
  { to: '/',          label: 'לוח בקרה',       end: true },
  { to: '/audits',    label: 'בקרות בטיחות'             },
  { to: '/report',    label: 'דיווח מפגע'               },
  { to: '/incident',  label: 'בירור אירוע'              },
  { to: '/gate',      label: 'בקרת כניסה'               },
  { to: '/reports',   label: 'דוחות'                     },
  { to: '/activity',  label: 'יומן פעילות'              }
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <nav className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-bold tracking-wide">🦺 SafetyOS</span>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition ${isActive ? 'bg-white text-blue-900' : 'hover:bg-blue-800'}`
                }>
                {label}
              </NavLink>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(o => !o)}>
            <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-blue-800 px-4 pb-3 grid grid-cols-2 gap-1">
            {NAV.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm text-center font-medium transition ${isActive ? 'bg-white text-blue-900' : 'hover:bg-blue-700'}`
                }>
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/report"       element={<FieldReport />} />
          <Route path="/gate"         element={<GateControl />} />
          <Route path="/audits"       element={<AuditsList />} />
          <Route path="/audit/new/:type" element={<AuditNew />} />
          <Route path="/audit/:id"    element={<AuditSession />} />
          <Route path="/incident"     element={<IncidentReport />} />
          <Route path="/activity"     element={<ActivityLog />} />
          <Route path="/reports"      element={<ReportsViewer />} />
        </Routes>
      </main>
    </div>
  );
}
