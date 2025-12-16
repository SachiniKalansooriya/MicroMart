import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import CustomerDashboard from './pages/CustomerDashboard'
import ProductDetail from './pages/ProductDetail'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentCancel from './pages/PaymentCancel'
import Orders from './pages/Orders'
import AdminOrders from './pages/AdminOrders'
import Unauthorized from './pages/Unauthorized'
import ProductsPage from './pages/ProductsPage'
import Profile from './pages/Profile'
import Cart from './pages/Cart'
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <nav className="text-white bg-indigo-600 shadow-lg">
        <div className="max-w-full px-4 mx-auto sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="text-2xl font-bold transition-colors hover:text-indigo-100">
                🛒 MicroMart
              </Link>
            </div>

            {/* Right side - Navigation */}
            <div className="flex items-center space-x-4">
              {!user && (
                <>
                  <Link to="/" className="font-medium transition-colors hover:text-indigo-100">
                    Home
                  </Link>
                  <Link to="/login" className="font-medium transition-colors hover:text-indigo-100">
                    Login
                  </Link>
                  <Link to="/register" className="font-medium transition-colors hover:text-indigo-100">
                    Register
                  </Link>
                </>
              )}
              {user && (
                <>
                  {user.role === 'admin' && (
                    <>
                      <Link to="/dashboard" className="font-medium transition-colors hover:text-indigo-100">
                        Dashboard
                      </Link>
                      <Link to="/admin" className="font-medium transition-colors hover:text-indigo-100">
                        Admin
                      </Link>
                    </>
                  )}
                  {user.role === 'customer' && (
                    <>
                      <Link to="/customer" className="font-medium transition-colors hover:text-indigo-100">
                        Shop
                      </Link>
                      <Link 
                        to="/cart"
                        className="relative p-2 transition-colors rounded-md hover:bg-indigo-700"
                        title="My Cart"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </Link>
                      <Link 
                        to="/orders"
                        className="p-2 transition-colors rounded-md hover:bg-indigo-700"
                        title="My Orders"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </Link>
                    </>
                  )}
                  <Link 
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 font-medium transition-colors rounded-md hover:bg-indigo-700"
                  >
                    <div className="flex items-center justify-center w-10 h-10 overflow-hidden text-sm font-bold text-white border-2 border-white rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </Link>
                  <button
                    onClick={logout}
                    className="px-4 py-2 font-medium transition-colors bg-red-700 rounded-md hover:bg-red-800"
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
                  <h1 className="mb-4 text-5xl font-bold text-gray-900">
                    Welcome to MicroMart
                  </h1>
                  <p className="mb-8 text-xl text-gray-600">
                    Your microservices e-commerce platform with role-based authentication
                  </p>
                  {!user ? (
                    <div className="flex justify-center gap-4">
                      <Link
                        to="/login"
                        className="px-6 py-3 font-semibold text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        className="px-6 py-3 font-semibold text-indigo-600 transition-colors bg-white border-2 border-indigo-600 rounded-lg hover:bg-gray-50"
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
                        className="inline-block px-6 py-3 font-semibold text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700"
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
          
          {/* Admin Products route */}
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute requireAdmin>
                <ProductsPage />
              </ProtectedRoute>
            }
          />
          
          {/* Admin Orders route */}
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute requireAdmin>
                <AdminOrders />
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
          
          {/* Product Detail route */}
          <Route
            path="/product/:id"
            element={
              <ProtectedRoute requireCustomer>
                <ProductDetail />
              </ProtectedRoute>
            }
          />
          
          {/* Orders route */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          
          {/* Profile route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          
          {/* Cart route */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute requireCustomer>
                <Cart />
              </ProtectedRoute>
            }
          />
          
          {/* Payment Success route */}
          <Route
            path="/payment/success"
            element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />

          {/* Payment Cancel route */}
          <Route
            path="/payment/cancel"
            element={
              <ProtectedRoute>
                <PaymentCancel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
