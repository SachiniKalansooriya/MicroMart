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
import CustomersPage from './pages/CustomersPage'
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
     <div className="flex flex-col min-h-screen bg-[#e2f3ff]" >
      <nav className="fixed top-0 left-0 right-0 z-50 text-white shadow-lg" style={{ backgroundColor: '#0A1931' }}>
        <div className="max-w-full px-4 mx-auto sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="text-2xl font-bold transition-colors hover:text-indigo-100">
                 MicroMart
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
                        className="relative p-2 transition-colors bg-gray-900 rounded-md"
                        title="My Cart"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </Link>
                      <Link 
                        to="/orders"
                        className="p-2 transition-colors bg-gray-900 rounded-md"
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
                    className="flex items-center gap-2 px-3 py-2 font-medium transition-colors rounded-md "
                  >
                    <div className="flex items-center justify-center w-10 h-10 overflow-hidden text-sm font-bold text-white border-2 border-white rounded-full shadow-lg bg-gradient-to-br from-blue-900 to-blue-900">
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

      <main className="flex-1 pt-16">
        <Routes>
          <Route
            path="/"
            element={
              <div 
                className="min-h-[90vh] flex items-center justify-center px-4 py-12 bg-fixed bg-cover bg-center bg-no-repeat relative"
                style={{ backgroundImage: "url('/background.jpg')" }}
              >
                {/* Subtle overlay for better readability */}
                <div className="absolute inset-0 bg-white/30 backdrop-blur-sm"></div>
                
                <div className="relative z-10 grid items-center w-full grid-cols-1 gap-12 px-4 max-w-7xl lg:gap-16 lg:grid-cols-2">
                  {/* Left side - Bags Image */}
                  <div className="items-center justify-center hidden lg:flex">
                    <div className="relative group">
                      <div className="absolute transition duration-1000 rounded-lg opacity-25 -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 blur group-hover:opacity-40"></div>
                      <img 
                        src="/bags.jpg" 
                        alt="Shopping bags" 
                        className="relative object-contain w-full h-auto max-w-md transition duration-500 transform rounded-lg shadow-2xl hover:scale-105"
                      />
                    </div>
                  </div>

                  {/* Right side - Content */}
                  <div className="p-8 space-y-6 text-center shadow-2xl lg:text-left bg-white/80 backdrop-blur-md lg:p-10 rounded-2xl">
                    <div className="space-y-4">
                      <h1 className="text-5xl font-extrabold leading-tight lg:text-6xl bg-clip-text text-[#1A3D63]">
                        Welcome to MicroMart
                      </h1>
                      <div className="w-24 h-1 mx-auto rounded-full "></div>
                    </div>
                    
                    <p className="text-lg leading-relaxed text-gray-700 lg:text-xl">
                   Where Great Deals Meet Trusted Quality.
                    </p>
                    
                    {!user ? (
                      <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row lg:justify-start">
                        <Link
                          to="/login"
                          className="px-8 py-4 font-semibold text-black transition-all duration-300 transform bg-gradient-to-r bg-[#B3CFE5]  rounded-xl hover:shadow-lg hover:scale-105"
                        >
                          Login
                        </Link>
                        <Link
                          to="/register"
                          className="px-8 py-4 font-semibold text-[#1A3D63] transition-all duration-300 transform bg-white border-2 border-[#1A3D63] rounded-xl  hover:shadow-lg hover:scale-105"
                        >
                          Register
                        </Link>
                      </div>
                    ) : (
                      <div className="pt-4 space-y-6">
                        <p className="text-xl text-gray-700">
                          Welcome back, <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{user.name}</span>!
                        </p>
                        <Link
                          to="/dashboard"
                          className="inline-block px-8 py-4 font-semibold text-white transition-all duration-300 transform bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:shadow-lg hover:scale-105"
                        >
                          Go to Dashboard
                        </Link>
                      </div>
                    )}
                  </div>
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
          
          {/* Admin Customers route */}
          <Route
            path="/admin/customers"
            element={
              <ProtectedRoute requireAdmin>
                <CustomersPage />
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
