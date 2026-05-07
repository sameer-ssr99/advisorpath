import { createContext, useContext, useState, useEffect } from 'react';
import api, { setUnauthorizedHandler } from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, []);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      role: user?.role,
      loading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
