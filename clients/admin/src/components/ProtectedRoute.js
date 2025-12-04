import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  const adminUser = localStorage.getItem('admin_user');

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  if (adminUser) {
    try {
      const user = JSON.parse(adminUser);
      if (user.role !== 'admin') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('admin_user');
        return <Navigate to="/admin/login" replace />;
      }
    } catch (e) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('admin_user');
      return <Navigate to="/admin/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
