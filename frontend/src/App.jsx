import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import FieldReport from './pages/FieldReport.jsx';
import GateControl from './pages/GateControl.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <nav className="bg-blue-800 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
          <span className="text-xl font-bold tracking-wide">🦺 SafetyOS</span>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-1 rounded transition ${isActive ? 'bg-white text-blue-800 font-semibold' : 'hover:bg-blue-700'}`
            }
          >
            לוח בקרה
          </NavLink>
          <NavLink
            to="/report"
            className={({ isActive }) =>
              `px-3 py-1 rounded transition ${isActive ? 'bg-white text-blue-800 font-semibold' : 'hover:bg-blue-700'}`
            }
          >
            דיווח מפגע
          </NavLink>
          <NavLink
            to="/gate"
            className={({ isActive }) =>
              `px-3 py-1 rounded transition ${isActive ? 'bg-white text-blue-800 font-semibold' : 'hover:bg-blue-700'}`
            }
          >
            בקרת כניסה
          </NavLink>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report" element={<FieldReport />} />
          <Route path="/gate" element={<GateControl />} />
        </Routes>
      </main>
    </div>
  );
}
