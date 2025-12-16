import { authService } from './authService';

// TODO: Replace with your actual Payment API Gateway URL
const API_BASE_URL = 'https://kpk440vdkf.execute-api.eu-north-1.amazonaws.com/prod';

interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

interface CheckoutItem {
  productId: string;
  quantity: number;
}

interface Order {
  orderId: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
}

interface OrdersResponse {
  orders: Order[];
}

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

const authFetch = async <T = any>(url: string, options: FetchOptions = {}): Promise<T> => {
  const token = authService.getToken();
  const origin = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : 'http://localhost:5173';

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Origin': origin,
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({} as T));
  if (!response.ok) {
    const message = (data as any)?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return data as T;
};

export const paymentService = {
  async createCheckoutSession(productId: string, quantity: number = 1): Promise<CheckoutSessionResponse> {
    try {
      const result = await authFetch<CheckoutSessionResponse>(`${API_BASE_URL}/payment/create-checkout`, {
        method: 'POST',
        body: JSON.stringify({ productId, quantity })
      });
      return result;
    } catch (error) {
      console.error('Checkout error:', error);
      throw error instanceof Error ? error : new Error('Failed to create checkout session');
    }
  },

  async createMultiItemCheckout(items: CheckoutItem[]): Promise<CheckoutSessionResponse> {
    try {
      const result = await authFetch<CheckoutSessionResponse>(`${API_BASE_URL}/payment/create-checkout`, {
        method: 'POST',
        body: JSON.stringify({ items })
      });
      return result;
    } catch (error) {
      console.error('Multi-item checkout error:', error);
      throw error instanceof Error ? error : new Error('Failed to create multi-item checkout session');
    }
  },

  async getOrders(): Promise<Order[]> {
    try {
      const result = await authFetch<OrdersResponse>(`${API_BASE_URL}/orders`);
      return result.orders;
    } catch (error) {
      console.error('Get orders error:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch orders');
    }
  },

  async getAllOrders(): Promise<Order[]> {
    try {
      const result = await authFetch<OrdersResponse>(`${API_BASE_URL}/admin/orders`);
      return result.orders;
    } catch (error) {
      console.error('Get all orders error:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch all orders');
    }
  },

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      console.log(`🔄 Updating order ${orderId} to ${status}`);
      const response = await authFetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      console.log('✅ Update response:', response);
    } catch (error) {
      console.error('❌ Update order status error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update order status');
    }
  }
};