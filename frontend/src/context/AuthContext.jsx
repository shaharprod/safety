import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as apiLogin } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('safetyos_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getMe().then(u => {
        setUser(u);
        setLoading(false);
      }).catch(() => {
        localStorage.removeItem('safetyos_token');
        setToken(null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [token]);

  async function login(username, password) {
    const data = await apiLogin(username, password);
    localStorage.setItem('safetyos_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem('safetyos_token');
    setToken(null);
    setUser(null);
  }

  function isRole(role) {
    return user?.role === role;
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
