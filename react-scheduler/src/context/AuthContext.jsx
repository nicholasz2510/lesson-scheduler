import PropTypes from "prop-types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  fetchCurrentTeacher,
  loginTeacher,
  logoutTeacher,
  registerTeacher,
} from "../api";

const AuthContext = createContext();

const TOKEN_STORAGE_KEY = "jwt_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [teacher, setTeacher] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!token) {
        setTeacher(null);
        setIsInitializing(false);
        return;
      }

      try {
        const profile = await fetchCurrentTeacher(token);
        if (isMounted) {
          setTeacher(profile);
          setError(null);
        }
      } catch (err) {
        console.error("Failed to load teacher profile", err);
        if (isMounted) {
          setTeacher(null);
          setToken(null);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleLogin = async (credentials) => {
    const response = await loginTeacher(credentials);
    const newToken = response?.token;
    if (!newToken) {
      throw new Error("Authentication token missing in response");
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);
    setTeacher(response.teacher ?? null);
    return response;
  };

  const handleRegister = async (payload) => {
    await registerTeacher(payload);
    return handleLogin({ email: payload.email, password: payload.password });
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await logoutTeacher(token);
      } catch (err) {
        console.warn("Failed to revoke token", err);
      }
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setTeacher(null);
  };

  const value = useMemo(
    () => ({
      token,
      teacher,
      isInitializing,
      error,
      isAuthenticated: Boolean(token && teacher),
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
    }),
    [token, teacher, isInitializing, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
