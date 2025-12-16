import React, { useState } from 'react';
import { paymentService } from '../services/paymentService';
import { authService } from '../services/authService';

interface Product {
  productId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  colors?: string[];
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(false);

  const handleBuyNow = async () => {
    // Check if user is logged in
    if (!authService.isAuthenticated()) {
      alert('Please login to purchase');
      window.location.href = '/login';
      return;
    }

    try {
      setLoading(true);
      
      // Create Stripe checkout session
      const result = await paymentService.createCheckoutSession(
        product.productId, 
        1 // quantity
      );

      if (result.url) {
        // Redirect to Stripe checkout page
        window.location.href = result.url;
      } else {
        alert('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Buy now error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p className="price">${product.price}</p>
      <p className="description">{product.description}</p>
      <p className="stock">Stock: {product.stock}</p>
      
      <button 
        onClick={handleBuyNow}
        disabled={loading || product.stock === 0}
        className="buy-now-btn"
      >
        {loading ? 'Processing...' : 'Buy Now'}
      </button>
    </div>
  );
}