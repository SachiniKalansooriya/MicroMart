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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Customer Dashboard
          </h2>
          <p className="text-gray-600">
            Welcome, <span className="font-semibold text-indigo-600">{user?.name}</span>!
          </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                No products available at the moment.
              </div>
            ) : (
              products.map((product) => (
                <div 
                  key={product.productId} 
                  className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/product/${product.productId}`)}
                >
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-4xl">📦</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h4>
                    <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-indigo-600">${product.price.toFixed(2)}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                    {product.colors && product.colors.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {product.colors.slice(0, 3).map((color) => (
                          <span key={color} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {color}
                          </span>
                        ))}
                        {product.colors.length > 3 && (
                          <span className="text-xs text-gray-500">+{product.colors.length - 3} more</span>
                        )}
                      </div>
                    )}
                    <button 
                      disabled={product.stock === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/product/${product.productId}`);
                      }}
                      className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition-colors"
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'View Details'}
                    </button>
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
