import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import ProductForm from '../components/ProductForm';
import productService, { type Product, type CreateProductData } from '../services/productService';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

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

  const handleAddProduct = async (data: CreateProductData) => {
    await productService.createProduct(data);
    await loadProducts();
    setShowForm(false);
  };

  const handleEditProduct = async (data: CreateProductData) => {
    if (editingProduct) {
      await productService.updateProduct(editingProduct.productId, data);
      await loadProducts();
      setEditingProduct(null);
      setShowForm(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(productId);
        await loadProducts();
      } catch (err: any) {
        setError(err.message || 'Failed to delete product');
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <AdminLayout>
      <div className="p-8">
        {!showForm ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
                  <p className="mt-1 text-gray-600">Manage your store's products</p>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center px-6 py-3 space-x-2 font-semibold text-white transition-colors bg-blue-800 rounded-lg "
                >
                  <span className="text-xl">+</span>
                  <span>Add Product</span>
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
                <div className="p-4 bg-white rounded-lg shadow">
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-indigo-600">{products.length}</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                  <p className="text-sm text-gray-600">In Stock</p>
                  <p className="text-2xl font-bold text-green-600">
                    {products.filter((p) => p.stock > 0).length}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                  <p className="text-sm text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">
                    {products.filter((p) => p.stock === 0).length}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow">
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow md:flex-row">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="w-full md:w-64">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 mb-6 text-red-700 border border-red-200 rounded-lg bg-red-50">
                {error}
              </div>
            )}

            {/* Products Table */}
            {loading ? (
              <div className="p-8 text-center bg-white rounded-lg shadow">
                <div className="inline-block w-8 h-8 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
                <p className="mt-2 text-gray-600">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-lg shadow">
                <div className="mb-4 text-6xl">📦</div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">No products found</h3>
                <p className="mb-4 text-gray-600">
                  {searchTerm || filterCategory
                    ? 'Try adjusting your filters'
                    : 'Start by adding your first product'}
                </p>
                {!searchTerm && !filterCategory && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-2 font-medium text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700"
                  >
                    Add Product
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-hidden bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Product
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Category
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Price
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.productId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-gray-200 rounded-lg">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="object-cover w-10 h-10 rounded-lg"
                                />
                              ) : (
                                <span className="text-gray-400">📦</span>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="max-w-xs text-sm text-gray-500 truncate">
                                {product.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 text-xs font-semibold leading-5 text-blue-800 bg-blue-100 rounded-full">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">${product.price.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.stock} units</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.stock > 10
                                ? 'bg-blue-100 text-blue-700'
                                : product.stock > 0
                                ? 'bg-blue-300 text-blue-900'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(product)}
                            className="mr-4 text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.productId)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <ProductForm
            onSubmit={editingProduct ? handleEditProduct : handleAddProduct}
            onCancel={handleCancelForm}
            initialData={editingProduct || undefined}
            isEditing={!!editingProduct}
          />
        )}
      </div>
    </AdminLayout>
  );
}
