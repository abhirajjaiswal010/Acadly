import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';          // ← ADD THIS
import { LoginPage, RegisterPage } from './pages/AuthPages';
import Dashboard from './pages/Dashboard';
import ClassForm from './pages/ClassForm';
import ClassRoom from './pages/ClassRoom';

const App = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <Router>
      <div className="app-layout">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1E1E2E',
              color: '#F2F2FF',
              border: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        />

        {isAuthenticated && <Navbar />}

        <Routes>
          {/* ── Landing Page (public) ── */}
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />}
          />

          {/* ── Auth Routes (public) ── */}
          <Route
            path="/login"
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/register"
            element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />}
          />

          {/* ── Protected Routes ── */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/classes/create"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <ClassForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/classes/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <ClassForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/classroom/:sessionId"
            element={
              <ProtectedRoute>
                <ClassRoom />
              </ProtectedRoute>
            }
          />

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;