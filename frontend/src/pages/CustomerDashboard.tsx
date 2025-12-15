import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import productService, { type Product } from '../services/productService';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Customer Dashboard
            </h2>
            <p className="text-gray-600">
              Welcome, <span className="font-semibold text-indigo-600">{user?.name}</span>!
            </p>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            My Orders
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Account Info</h3>
            <p className="text-sm text-blue-700">
              <strong>Email:</strong> {user?.email}
            </p>
            <p className="text-sm text-blue-700">
              <strong>Phone:</strong> {user?.phone || 'Not provided'}
            </p>
            <p className="text-sm text-blue-700">
              <strong>Role:</strong> <span className="uppercase font-semibold">{user?.role}</span>
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Order Summary</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-sm text-green-700">Total Orders</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Available Products</h3>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {products.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                No products available at the moment.
              </div>
            ) : (
              products.map((product) => (
                <div 
                  key={product.productId} 
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-200 cursor-pointer group"
                  onClick={() => navigate(`/product/${product.productId}`)}
                >
                  <div className="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    ) : (
                      <span className="text-gray-400 text-5xl">📦</span>
                    )}
                    {product.stock > 0 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(`Added ${product.name} to cart!`);
                        }}
                        className="absolute bottom-2 right-2 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                        title="Add to cart"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </button>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem]">{product.name}</h4>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-lg font-bold text-red-600">${product.price.toFixed(2)}</span>
                    </div>
                    {product.colors && product.colors.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {product.colors.slice(0, 4).map((color) => (
                          <div 
                            key={color}
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: color.toLowerCase() }}
                            title={color}
                          />
                        ))}
                        {product.colors.length > 4 && (
                          <span className="text-xs text-gray-500 self-center">+{product.colors.length - 4}</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <span className="text-yellow-500">★★★★☆</span>
                      <span>4.{Math.floor(Math.random() * 9)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">👤 Customer Access</h3>
          <p className="text-blue-800">
            This is your customer dashboard. You can browse products and place orders. 
            Admin features are not available for customer accounts.
          </p>
        </div>
      </div>
    </div>
  );
}
