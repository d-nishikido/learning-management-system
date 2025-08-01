import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/' },
    { name: 'Courses', href: '/courses' },
    { name: 'Q&A', href: '/qa' },
    { name: 'Profile', href: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-primary-600">
                LMS System
              </Link>
              <div className="ml-10 flex items-baseline space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === item.href
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="btn-outline">Sign In</button>
              <button className="btn-primary">Sign Up</button>
            </div>
          </div>
        </div>
      </nav>
      <main className="container py-8">
        <Outlet />
      </main>
      <footer className="bg-white border-t mt-auto">
        <div className="container py-6">
          <p className="text-center text-sm text-gray-600">
            © 2025 LMS System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}