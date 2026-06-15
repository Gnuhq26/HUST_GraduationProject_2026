import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import NoStore from '../pages/NoStore';
import CreateStore from '../pages/CreateStore';
import SelectStore from '../pages/SelectStore';
import Forbidden from '../pages/Forbidden';
import Profile from '../pages/Profile';
import AuthCallback from '../pages/AuthCallback';
import MainLayout from '../layouts/MainLayout';
import PermissionRoute from '../components/PermissionRoute';
import { protectedRoutes } from './protectedRoutes';
import type { RouteConfig } from './protectedRoutes';
import useAuthStore from '../store/authStore';

/**
 * Compute the "home" path for an authenticated user.
 * If a tenantIdentifier is known, go to /:tenant/; otherwise go to /select-store.
 */
function useHomePath(): string {
  const tenantIdentifier = useAuthStore((s) => s.tenantIdentifier);
  return tenantIdentifier ? `/${tenantIdentifier}` : '/select-store';
}

export default function AppRoutes() {
  const { isAuthenticated } = useAuthStore();
  const homePath = useHomePath();

  const renderProtectedElement = (route: RouteConfig) => {
    const Component = route.component;
    const element = <Component />;

    if (!route.permission) {
      return element;
    }

    return (
      <PermissionRoute
        action={route.permission.action}
        subject={route.permission.subject}
      >
        {element}
      </PermissionRoute>
    );
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to={homePath} replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={homePath} replace /> : <Register />} />

      {/* OAuth callback — always public, never redirect to login */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Multi-store Management (Auth Required, no tenant context) */}
      <Route path="/no-store" element={isAuthenticated ? <NoStore /> : <Navigate to="/login" replace />} />
      <Route path="/create-store" element={isAuthenticated ? <CreateStore /> : <Navigate to="/login" replace />} />
      <Route path="/select-store" element={isAuthenticated ? <SelectStore /> : <Navigate to="/login" replace />} />
      <Route path="/forbidden" element={isAuthenticated ? <Forbidden /> : <Navigate to="/login" replace />} />

      {/* Protected Routes with Tenant prefix + Layout */}
      <Route path="/:tenant" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />}>
        <Route path="profile" element={<Profile />} />
        {protectedRoutes.map((route) => (
          <Route
            key={route.path}
            index={route.path === '/'}
            path={route.path === '/' ? undefined : route.path.replace(/^\//, '')}
            element={renderProtectedElement(route)}
          />
        ))}
      </Route>

      {/* Root redirect — send to tenant home or login */}
      <Route path="/" element={<Navigate to={isAuthenticated ? homePath : '/login'} replace />} />

      {/* Catch all — redirect to tenant home or login */}
      <Route path="*" element={<Navigate to={isAuthenticated ? homePath : '/login'} replace />} />
    </Routes>
  );
}
