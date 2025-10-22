import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import CustomerAnalysisNew from '@/pages/CustomerAnalysisNew';
import BrandAnalysisNew from '@/pages/BrandAnalysisNew';
import CategoryAnalysisNew from '@/pages/CategoryAnalysisNew';
import Reports from '@/pages/Reports';
import CockpitNew from '@/pages/CockpitNew';
import Projects from '@/pages/Projects';
import SalesAnalysis from '@/pages/SalesAnalysis';
import RootCauseAnalysis from '@/pages/RootCauseAnalysis';
import ChartInsight from '@/pages/ChartInsight';
import { Toaster } from '@/components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
export const AuthContext = React.createContext(null);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(localStorage.getItem('user'));

  const login = (newToken, email) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', email);
    setToken(newToken);
    setUser(email);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <CockpitNew />
              </PrivateRoute>
            }
          />
          <Route
            path="/compass"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <PrivateRoute>
                <CustomerAnalysisNew />
              </PrivateRoute>
            }
          />
          <Route
            path="/brands"
            element={
              <PrivateRoute>
                <BrandAnalysisNew />
              </PrivateRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <PrivateRoute>
                <CategoryAnalysisNew />
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute>
                <Reports />
              </PrivateRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <PrivateRoute>
                <Projects />
              </PrivateRoute>
            }
          />
          <Route
            path="/sales-analysis"
            element={
              <PrivateRoute>
                <SalesAnalysis />
              </PrivateRoute>
            }
          />
          <Route
            path="/root-cause-analysis"
            element={
              <PrivateRoute>
                <RootCauseAnalysis />
              </PrivateRoute>
            }
          />
          <Route
            path="/chart-insight"
            element={
              <PrivateRoute>
                <ChartInsight />
              </PrivateRoute>
            }
          />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;