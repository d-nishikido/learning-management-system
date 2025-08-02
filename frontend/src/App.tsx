import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/common/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import { Profile } from './pages/Profile';
import { Users } from './pages/Users';
import { UserDetail } from './pages/UserDetail';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { LessonDetail } from './pages/LessonDetail';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

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
        element: <div className="text-center py-12">Dashboard (Coming Soon)</div>,
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
        element: <div className="text-center py-12">Progress Page (Coming Soon)</div>,
      },
      {
        path: 'admin',
        element: <div className="text-center py-12">Admin Page (Coming Soon)</div>,
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
    <RouterProvider router={router} />
  );
}

export default App;