import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/common/Layout';
import Home from './pages/Home';
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
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'dashboard',
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
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;