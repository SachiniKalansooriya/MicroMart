import { useState } from 'react';
import { type CreateProductData } from '../services/productService';
import s3Service from '../services/s3Service';

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
    colors: initialData?.colors || [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.imageUrl || '');
  const [newColor, setNewColor] = useState('');

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setError('');
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData({ ...formData, imageUrl: '' });
  };

  const handleAddColor = () => {
    if (newColor.trim()) {
      // Split by comma and trim each color
      const colorsToAdd = newColor
        .split(',')
        .map(color => color.trim())
        .filter(color => color.length > 0);
      
      // Add only new colors that aren't already in the list
      const uniqueNewColors = colorsToAdd.filter(
        color => !formData.colors?.includes(color)
      );
      
      if (uniqueNewColors.length > 0) {
        setFormData({
          ...formData,
          colors: [...(formData.colors || []), ...uniqueNewColors],
        });
        setNewColor('');
        setError('');
      } else {
        setError('All colors have already been added');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleRemoveColor = (colorToRemove: string) => {
    setFormData({
      ...formData,
      colors: formData.colors?.filter((c) => c !== colorToRemove) || [],
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddColor();
    }
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
      
      let imageUrl = formData.imageUrl;
      
      // Upload image to S3 if a file is selected
      if (imageFile) {
        try {
          imageUrl = await s3Service.uploadImage(imageFile);
        } catch (uploadError) {
          setError('Failed to upload image. Please try again.');
          setLoading(false);
          return;
        }
      }
      
      const dataToSubmit = {
        ...formData,
        imageUrl
      };
      
      await onSubmit(dataToSubmit);
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h3 className="mb-6 text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h3>

        {error && (
          <div className="px-4 py-3 mb-4 text-red-700 border border-red-200 rounded-lg bg-red-50">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Product Name */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block mb-2 text-sm font-semibold text-gray-700">
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
            <label htmlFor="price" className="block mb-2 text-sm font-semibold text-gray-700">
              Price ($) *
            </label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.1"
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
            <label htmlFor="stock" className="block mb-2 text-sm font-semibold text-gray-700">
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
            <label htmlFor="category" className="block mb-2 text-sm font-semibold text-gray-700">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
            <label htmlFor="description" className="block mb-2 text-sm font-semibold text-gray-700">
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

          {/* Available Colors */}
          <div className="md:col-span-2">
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Available Colors (Customers will choose one)
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter color(s) separated by commas (e.g., Red, Blue, Black)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="px-4 py-2 font-medium text-white transition-colors rounded-lg bg-[#1A3D63] hover:bg-[#2a5a8e]"
                >
                  Add Color
                </button>
              </div>
              
              {formData.colors && formData.colors.length > 0 && (
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="mb-2 text-xs font-semibold text-gray-600">Available Colors:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.colors.map((color) => (
                      <span
                        key={color}
                        className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-indigo-800 bg-indigo-100 rounded-full"
                      >
                        {color}
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(color)}
                          className="hover:text-indigo-600"
                          aria-label={`Remove ${color}`}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                💡 <strong>Tip:</strong> Add multiple colors at once by separating them with commas. Customers will select one color when purchasing.
              </p>
            </div>
          </div>

          {/* Image Upload */}
          <div className="md:col-span-2">
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Product Image
            </label>
            
            <div className="space-y-4">
              {/* File Input */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center justify-center flex-1 px-4 py-3 transition-colors border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-indigo-500">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-1 text-sm text-gray-600">
                      <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="object-cover w-40 h-40 border-2 border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute p-1 text-white transition-colors bg-red-600 rounded-full -top-2 -right-2 hover:bg-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

             
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end pt-6 mt-8 space-x-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 font-medium text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 font-medium text-white transition-colors rounded-lg bg-[#1A3D63]  disabled:bg-[#376ca4]"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </div>
    </form>
  );
}
