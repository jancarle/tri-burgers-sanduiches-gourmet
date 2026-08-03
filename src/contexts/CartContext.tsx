import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { MenuItem } from '../types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface CartItem extends MenuItem {
  cartItemId: string;
  quantity: number;
  selectedOption?: { name: string; price: number };
}

export interface SiteImages {
  heroImage: string;
  craftImage: string;
  menuCardImage: string;
  physicalStoreImage: string;
  aboutImage: string;
}

export const DEFAULT_SITE_IMAGES: SiteImages = {
  heroImage: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=1920',
  craftImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1000',
  menuCardImage: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=800',
  physicalStoreImage: 'https://i.postimg.cc/65W5WKYb/tri-burges.webp',
  aboutImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1000',
};

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
  siteImages: SiteImages;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [siteImages, setSiteImages] = useState<SiteImages>(DEFAULT_SITE_IMAGES);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'store'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.isStoreOpen !== undefined) {
          setIsStoreOpen(data.isStoreOpen);
        }
        setSiteImages({
          heroImage: data.heroImage || DEFAULT_SITE_IMAGES.heroImage,
          craftImage: data.craftImage || DEFAULT_SITE_IMAGES.craftImage,
          menuCardImage: data.menuCardImage || DEFAULT_SITE_IMAGES.menuCardImage,
          physicalStoreImage: data.physicalStoreImage || DEFAULT_SITE_IMAGES.physicalStoreImage,
          aboutImage: data.aboutImage || DEFAULT_SITE_IMAGES.aboutImage,
        });
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
      siteImages,
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
