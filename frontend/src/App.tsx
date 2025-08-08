import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
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

// Component to handle home page blocking
function HomePageHandler() {
  const isTestEnvironment = import.meta.env.VITE_NODE_ENV === 'test';
  
  if (isTestEnvironment) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-lg shadow-md">
          <div className="text-6xl text-gray-400 mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Not Available
          </h1>
          <p className="text-gray-600">
            This interface is currently running in test mode and is not available for direct access.
          </p>
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              If you need to access the application, please use the production environment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // In non-test environments, redirect to login
  return <Navigate to="/login" replace />;
}

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
        element: <HomePageHandler />,
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
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;