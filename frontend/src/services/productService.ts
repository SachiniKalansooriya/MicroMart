// frontend/src/services/productService.ts
import { authService } from './authService';
import { config } from '../config/env';

const API_BASE_URL = config.apiBaseUrl;

export interface Product {
  productId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  colors?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  colors?: string[];
}
export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  stock?: number;
  imageUrl?: string;
  colors?: string[];
}

export interface ProductResponse {
  message: string;
  product?: Product;
  products?: Product[];
}

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

const authFetch = async <T = any>(url: string, options: FetchOptions = {}): Promise<T> => {
  const token = authService.getToken();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });

  if (response.status === 401 || response.status === 403) {
    authService.logout();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

export const productService = {
  async getProducts(): Promise<Product[]> {
    const response = await authFetch<ProductResponse>(`${API_BASE_URL}/products`);
    return response.products || [];
  },

  async getProduct(id: string): Promise<Product> {
    const response = await authFetch<ProductResponse>(`${API_BASE_URL}/products/${id}`);
    return response.product!;
  },

  async createProduct(product: CreateProductData): Promise<Product> {
    const response = await authFetch<ProductResponse>(`${API_BASE_URL}/products`, {
      method: 'POST',
      body: JSON.stringify(product)
    });
    return response.product!;
  },

  async updateProduct(id: string, product: UpdateProductData): Promise<Product> {
    const response = await authFetch<ProductResponse>(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    });
    return response.product!;
  },

  async deleteProduct(id: string): Promise<void> {
    await authFetch<ProductResponse>(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE'
    });
  }
};

export default productService;