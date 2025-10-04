import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './Contexts/AuthContext';
import { ThemeProvider } from './Contexts/ThemeContext';
import Login from './components/Login';
import Signup from './components/Signup';
import OAuthCallback from './components/OAuthCallback';
import PrivateRoute from './components/PrivateRoute';

// Lazy load heavy components
const Dashboard = lazy(() => import('./components/Dashboard'));
const FacebookContent = lazy(() => import('./components/FacebookContent'));
const FacebookAdGenerator = lazy(() => import('./components/FacebookAdGenerator'));
const CredentialVault = lazy(() => import('./components/CredentialVault'));
const AuthDebugger = lazy(() => import('./components/AuthDebugger'));

// Loading component for lazy-loaded routes
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-gray-700 font-medium">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <Dashboard />
                </Suspense>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/facebook-content" 
            element={
              <PrivateRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <FacebookContent platform="facebook" />
                </Suspense>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/facebook-ads" 
            element={
              <PrivateRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <FacebookAdGenerator />
                </Suspense>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/instagram-content" 
            element={
              <PrivateRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <FacebookContent platform="instagram" />
                </Suspense>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/linkedin-content" 
            element={
              <PrivateRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <FacebookContent platform="linkedin" />
                </Suspense>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/credential-vault" 
            element={
              <PrivateRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <CredentialVault />
                </Suspense>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/oauth/:platform/callback" 
            element={<OAuthCallback />}
          />
          <Route 
            path="/auth-debug" 
            element={
              <PrivateRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <AuthDebugger />
                </Suspense>
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;