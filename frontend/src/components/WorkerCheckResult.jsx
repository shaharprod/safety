import React from 'react';

export default function WorkerCheckResult({ result }) {
  const { worker, access_status, days_since_training } = result;
  const allowed = access_status === 'Allowed';

  return (
    <div className={`rounded-xl border-2 p-5 mt-4 ${allowed ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl">{allowed ? '✅' : '🚫'}</span>
        <div>
          <p className="text-lg font-bold text-gray-800">{worker.first_name} {worker.last_name}</p>
          <p className="text-sm text-gray-500">ת.ז: {worker.id_number}</p>
        </div>
      </div>
      <p className={`text-xl font-bold ${allowed ? 'text-green-700' : 'text-red-700'}`}>
        {allowed ? 'כניסה מאושרת' : 'כניסה נדחתה - הדרכה פגה'}
      </p>
      {days_since_training != null && (
        <p className="text-sm text-gray-600 mt-1">
          {allowed
            ? `ימים מאז הדרכה אחרונה: ${days_since_training}`
            : `הדרכה פגה לפני ${days_since_training - 365} ימים`}
        </p>
      )}
      {!worker.last_training_date && (
        <p className="text-sm text-red-600 mt-1">אין רישום הדרכה במערכת</p>
      )}
    </div>
  );
}
