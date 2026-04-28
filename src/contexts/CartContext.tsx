import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { MenuItem } from '../types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface CartItem extends MenuItem {
  cartItemId: string;
  quantity: number;
  selectedOption?: { name: string; price: number };
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: MenuItem, selectedOption?: { name: string; price: number }) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  cartTotal: number;
  cartQuantity: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  clearCart: () => void;
  isStoreOpen: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'store'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.isStoreOpen !== undefined) {
          setIsStoreOpen(data.isStoreOpen);
        }
      }
    });

    return () => unsub();
  }, []);

  const addToCart = (item: MenuItem, selectedOption?: { name: string; price: number }) => {
    setCart(prev => {
      // Create a unique ID based on the item ID AND the selected option's name.
      // This ensures "Simples (Frango)" is tracked entirely separately from "Simples (Mignon)".
      // But adding another "Simples (Frango)" will correctly increment its quantity.
      const cartItemId = item.id + (selectedOption ? `-opt-${selectedOption.name}` : '');
      const existing = prev.find(i => i.cartItemId === cartItemId);
      if (existing) {
        return prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, cartItemId, quantity: 1, selectedOption }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev => prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity } : i));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => {
    const itemPrice = item.selectedOption ? item.selectedOption.price : item.price;
    return sum + (itemPrice * item.quantity);
  }, 0);
  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      cartTotal,
      cartQuantity,
      isCartOpen,
      setIsCartOpen,
      clearCart,
      isStoreOpen,
    }}>
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
