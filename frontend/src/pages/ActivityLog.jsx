import React, { useEffect, useState } from 'react';
import { getActivityLog } from '../lib/api.js';

const ACTION_ICONS = {
  hazard_reported:  { icon: '⚠️', color: 'bg-orange-100 border-orange-300' },
  gate_check:       { icon: '🔑', color: 'bg-blue-100 border-blue-300' },
  audit_started:    { icon: '📋', color: 'bg-purple-100 border-purple-300' },
  audit_closed:     { icon: '✅', color: 'bg-green-100 border-green-300' },
  incident_reported:{ icon: '🔍', color: 'bg-red-100 border-red-300' },
  default:          { icon: '📝', color: 'bg-gray-100 border-gray-300' }
};

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivityLog().then(setLogs).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📅 יומן פעילות</h1>

      {loading && <p className="text-center text-gray-400 py-10">טוען...</p>}
      {!loading && logs.length === 0 && (
        <p className="text-center text-gray-400 py-10">אין פעולות עדיין — התחל לעבוד עם המערכת</p>
      )}

      <div className="relative">
        {/* Timeline line */}
        {logs.length > 0 && <div className="absolute right-[22px] top-0 bottom-0 w-0.5 bg-gray-200" />}

        <div className="space-y-3">
          {logs.map(log => {
            const { icon, color } = ACTION_ICONS[log.action_type] || ACTION_ICONS.default;
            return (
              <div key={log.id} className="flex items-start gap-3 relative">
                <div className={`flex-shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center text-lg z-10 ${color}`}>
                  {icon}
                </div>
                <div className="flex-1 bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
                  <p className="text-gray-800 text-sm font-medium">{log.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {log.user_name && <span className="text-xs text-gray-400">{log.user_name}</span>}
                    <span className="text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
