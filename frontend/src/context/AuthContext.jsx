import { createContext, useContext, useEffect, useState } from 'react';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('auth_token');
    if (t) setToken(t);
  }, []);

  const login = (t) => {
    setToken(t);
    localStorage.setItem('auth_token', t);
  };
  const logout = () => {
    setToken('');
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthCtx.Provider value={{ token, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}


