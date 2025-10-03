import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();

  // Show loading only for protected routes when user is not authenticated
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
