import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '../services/productService';

interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, color?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('micromart_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('micromart_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity = 1, color?: string) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => item.productId === product.productId && item.selectedColor === color
      );

      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += quantity;
        return updatedCart;
      }

      return [...prevCart, { ...product, quantity, selectedColor: color }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('micromart_cart');
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
