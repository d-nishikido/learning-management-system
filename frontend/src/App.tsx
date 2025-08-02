import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/common/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

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
        element: <div className="text-center py-12">Profile Page (Coming Soon)</div>,
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