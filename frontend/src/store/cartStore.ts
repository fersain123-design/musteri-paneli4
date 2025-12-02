import { create } from 'zustand';
import api from '../services/api';

interface CartItem {
  product_id: string;
  quantity: number;
  price: number;
}

interface Cart {
  _id?: string;
  user_id?: string;
  items: CartItem[];
  total: number;
}

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateCartItem: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/cart');
      set({ cart: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      set({ isLoading: false });
    }
  },

  addToCart: async (productId: string, quantity: number = 1) => {
    try {
      const response = await api.post('/cart/add', {
        product_id: productId,
        quantity,
      });
      set({ cart: response.data });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to add to cart');
    }
  },

  updateCartItem: async (productId: string, quantity: number) => {
    try {
      const response = await api.put('/cart/update', {
        product_id: productId,
        quantity,
      });
      set({ cart: response.data });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to update cart');
    }
  },

  removeFromCart: async (productId: string) => {
    try {
      const response = await api.post('/cart/remove', {
        product_id: productId,
      });
      set({ cart: response.data });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to remove from cart');
    }
  },

  clearCart: async () => {
    try {
      await api.delete('/cart/clear');
      set({ cart: { items: [], total: 0 } });
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  },
}));
