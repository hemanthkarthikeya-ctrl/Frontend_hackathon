import { createContext, useContext, useState } from 'react';
import {
  getUsers, saveUsers, getSession, setSession, clearSession,
  emptyPortfolio, savePortfolio,
} from '../utils/storage';

const AuthContext = createContext(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSession());

  const signup = ({ name, email, password, confirm }) => {
    email = email.trim().toLowerCase();
    name = name.trim();
    if (password !== confirm) return { ok: false, error: 'Passwords do not match.' };
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

    const users = getUsers();
    if (users.some((u) => u.email === email))
      return { ok: false, error: 'An account with this email already exists.' };

    saveUsers([...users, { name, email, password }]);
    savePortfolio(email, emptyPortfolio(name, email));
    setSession(email);
    setUser(email);
    return { ok: true };
  };

  const login = ({ email, password }) => {
    email = email.trim().toLowerCase();
    const match = getUsers().find((u) => u.email === email && u.password === password);
    if (!match) return { ok: false, error: 'Invalid email or password.' };
    setSession(email);
    setUser(email);
    return { ok: true };
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}