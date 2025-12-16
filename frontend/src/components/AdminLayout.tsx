import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();  
  const menuItems = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/products', label: 'Products' },
    { path: '/admin/orders', label: 'Orders' },
    { path: '/admin/customers', label: 'Customers' },
  
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar - Fixed below navbar */}
      <aside className="w-64 bg-white shadow-lg fixed left-0 top-16 h-[calc(100vh-4rem)] z-10">
        <div className="flex flex-col h-full">
          {/* Admin Profile */}
          <div className="p-6 text-white bg-gray-800">
            <h2 className="mb-1 text-xl font-bold">Admin Panel</h2>
            <p className="text-sm text-indigo-200">{user?.name}</p>
            <p className="text-xs text-indigo-300">{user?.email}</p>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
               
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          

          {/* Logout Button */}
          <div className="p-4 border-t">
            <Link
              to="/"
              className="flex items-center px-4 py-3 space-x-3 text-white transition-colors bg-red-700 rounded-lg "
            >
            
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content - With left margin to account for fixed sidebar */}
      <main className="flex-1 h-screen ml-64 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
