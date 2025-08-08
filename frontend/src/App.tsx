import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import { AccessControl } from './components/common/AccessControl';
import Dashboard from './pages/Dashboard';
import Progress from './pages/Progress';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import { Profile } from './pages/Profile';
import { Users } from './pages/Users';
import { UserDetail } from './pages/UserDetail';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { LessonDetail } from './pages/LessonDetail';
import { Search } from './pages/Search';
import { ResourceLibrary } from './pages/ResourceLibrary';
import { ResourceDetail } from './pages/ResourceDetail';
import { CourseManagement } from './pages/admin/CourseManagement';
import { CourseForm } from './pages/admin/CourseForm';
import { LessonManagement } from './pages/admin/LessonManagement';
import { LessonForm } from './pages/admin/LessonForm';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import './i18n';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/app',
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'courses',
        element: <Courses />,
      },
      {
        path: 'courses/:id',
        element: <CourseDetail />,
      },
      {
        path: 'courses/:courseId/lessons/:id',
        element: <LessonDetail />,
      },
      {
        path: 'search',
        element: <Search />,
      },
      {
        path: 'resources',
        element: <ResourceLibrary />,
      },
      {
        path: 'resources/:id',
        element: <ResourceDetail />,
      },
      {
        path: 'qa',
        element: <div className="text-center py-12">Q&A Page (Coming Soon)</div>,
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute requiredRole="ADMIN">
            <Users />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users/:id',
        element: (
          <ProtectedRoute>
            <UserDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: 'progress',
        element: (
          <ProtectedRoute>
            <Progress />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: <div className="text-center py-12">Admin Page (Coming Soon)</div>,
      },
      {
        path: 'admin/courses',
        element: (
          <ProtectedRoute requiredRole="ADMIN">
            <CourseManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/courses/new',
        element: (
          <ProtectedRoute requiredRole="ADMIN">
            <CourseForm />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/courses/:id/edit',
        element: (
          <ProtectedRoute requiredRole="ADMIN">
            <CourseForm />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/courses/:courseId/lessons',
        element: (
          <ProtectedRoute requiredRole="ADMIN">
            <LessonManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/courses/:courseId/lessons/new',
        element: (
          <ProtectedRoute requiredRole="ADMIN">
            <LessonForm />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/courses/:courseId/lessons/:id/edit',
        element: (
          <ProtectedRoute requiredRole="ADMIN">
            <LessonForm />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

function App() {
  return (
    <AccessControl>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </AccessControl>
  );
}

export default App;