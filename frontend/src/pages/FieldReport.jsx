import React, { useState } from 'react';
import HazardForm from '../components/HazardForm.jsx';

export default function FieldReport() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-700 mb-2">הדיווח נשלח בהצלחה</h2>
        <p className="text-gray-600 mb-6">הממונה קיבל התראה במייל</p>
        <button
          onClick={() => setSubmitted(false)}
          className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg"
        >
          דיווח נוסף
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">דיווח מפגע בטיחות</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <HazardForm onSuccess={() => setSubmitted(true)} />
      </div>
    </div>
  );
}
