import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../services/types/api.types';

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * Admin Route Component
 * Redirects to home if user is not admin
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (user?.role !== UserRole.ADMIN) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h2>Access Denied</h2>
        <p style={{ color: '#666', marginTop: '1rem' }}>
          You don't have permission to access this page.
        </p>
        <a href="/" style={{ marginTop: '1rem', color: '#0066cc' }}>Go to Home</a>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;

