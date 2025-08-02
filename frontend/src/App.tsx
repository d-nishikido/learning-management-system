import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/common/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import { Profile } from './pages/Profile';
import { Users } from './pages/Users';
import { UserDetail } from './pages/UserDetail';

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
        element: <div className="text-center py-12">Courses Page (Coming Soon)</div>,
      },
      {
        path: 'qa',
        element: <div className="text-center py-12">Q&A Page (Coming Soon)</div>,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'users',
        element: <Users />,
      },
      {
        path: 'users/:id',
        element: <UserDetail />,
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