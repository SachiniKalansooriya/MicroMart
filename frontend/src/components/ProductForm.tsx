import { useState } from 'react';
import { type CreateProductData } from '../services/productService';

interface ProductFormProps {
  onSubmit: (data: CreateProductData) => Promise<void>;
  onCancel: () => void;
  initialData?: CreateProductData & { productId?: string };
  isEditing?: boolean;
}

export default function ProductForm({ onSubmit, onCancel, initialData, isEditing = false }: ProductFormProps) {
  const [formData, setFormData] = useState<CreateProductData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    category: initialData?.category || '',
    stock: initialData?.stock || 0,
    imageUrl: initialData?.imageUrl || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Electronics',
    'Clothing',
    'Home & Garden',
    'Sports',
    'Books',
    'Toys',
    'Food & Beverage',
    'Health & Beauty',
    'Other',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || formData.price <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h3>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Name */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter product name"
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">
              Price ($) *
            </label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          {/* Stock */}
          <div>
            <label htmlFor="stock" className="block text-sm font-semibold text-gray-700 mb-2">
              Stock Quantity *
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Category */}
          <div className="md:col-span-2">
            <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter product description"
            />
          </div>

          {/* Image URL */}
          <div className="md:col-span-2">
            <label htmlFor="imageUrl" className="block text-sm font-semibold text-gray-700 mb-2">
              Image URL
            </label>
            <input
              id="imageUrl"
              name="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter a direct URL to the product image (S3 upload coming soon)
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </div>
    </form>
  );
}
