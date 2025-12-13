import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import CustomerDashboard from './pages/CustomerDashboard'
import Unauthorized from './pages/Unauthorized'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'
import { authService } from './services/authService'

function App() {
  const { user, logout } = useAuth()

  // Dashboard redirect based on role
  const DashboardRedirect = () => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      return <Navigate to="/login" replace />;
    }
    if (currentUser.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/customer" replace />;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link to="/" className="text-2xl font-bold hover:text-indigo-100 transition-colors">
                🛒 MicroMart
              </Link>
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/" className="hover:text-indigo-100 transition-colors font-medium">
                Home
              </Link>
              {!user && (
                <>
                  <Link to="/login" className="hover:text-indigo-100 transition-colors font-medium">
                    Login
                  </Link>
                  <Link to="/register" className="hover:text-indigo-100 transition-colors font-medium">
                    Register
                  </Link>
                </>
              )}
              {user && (
                <>
                  <Link to="/dashboard" className="hover:text-indigo-100 transition-colors font-medium">
                    Dashboard
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="hover:text-indigo-100 transition-colors font-medium">
                      Admin
                    </Link>
                  )}
                  {user.role === 'customer' && (
                    <Link to="/customer" className="hover:text-indigo-100 transition-colors font-medium">
                      Shop
                    </Link>
                  )}
                  <span className="text-indigo-200 text-sm">
                    ({user.role})
                  </span>
                  <button
                    onClick={logout}
                    className="bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="text-center">
                  <h1 className="text-5xl font-bold text-gray-900 mb-4">
                    Welcome to MicroMart
                  </h1>
                  <p className="text-xl text-gray-600 mb-8">
                    Your microservices e-commerce platform with role-based authentication
                  </p>
                  {!user ? (
                    <div className="flex gap-4 justify-center">
                      <Link
                        to="/login"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        className="bg-white hover:bg-gray-50 text-indigo-600 border-2 border-indigo-600 px-6 py-3 rounded-lg font-semibold transition-colors"
                      >
                        Register
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-lg text-gray-700">
                        Welcome back, <span className="font-semibold text-indigo-600">{user.name}</span>!
                      </p>
                      <Link
                        to="/dashboard"
                        className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                      >
                        Go to Dashboard
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Dashboard redirect based on role */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />
          
          {/* Admin-only route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Customer-only route */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute requireCustomer>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
