// ADDONS_CART_MODEL_2026_08_04
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { MenuItem, SelectedAddon } from '../types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateCartItemId, getItemLineTotal } from '../lib/addonUtils';

export interface CartItem extends MenuItem {
  cartItemId: string;
  quantity: number;
  selectedOption?: { name: string; price: number };
  selectedAddons?: SelectedAddon[];
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
  addToCart: (
    item: MenuItem,
    selectedOption?: { name: string; price: number },
    selectedAddons?: SelectedAddon[],
    quantityToAdd?: number
  ) => void;
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

const LOCAL_STORAGE_CART_KEY = 'tri_burgers_cart_v2';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CART_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading cart from localStorage:', e);
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [siteImages, setSiteImages] = useState<SiteImages>(DEFAULT_SITE_IMAGES);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart to localStorage:', e);
    }
  }, [cart]);

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

  const addToCart = (
    item: MenuItem,
    selectedOption?: { name: string; price: number },
    selectedAddons?: SelectedAddon[],
    quantityToAdd: number = 1
  ) => {
    const activeAddons = selectedAddons ? selectedAddons.filter(a => a.quantity > 0) : undefined;
    const cartItemId = generateCartItemId(item.id, selectedOption, activeAddons);

    setCart(prev => {
      const existing = prev.find(i => i.cartItemId === cartItemId);
      if (existing) {
        return prev.map(i =>
          i.cartItemId === cartItemId
            ? { ...i, quantity: i.quantity + quantityToAdd }
            : i
        );
      }
      return [
        ...prev,
        {
          ...item,
          cartItemId,
          quantity: Math.max(1, quantityToAdd),
          selectedOption,
          selectedAddons: activeAddons && activeAddons.length > 0 ? activeAddons : undefined,
        }
      ];
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

  const cartTotal = cart.reduce((sum, item) => sum + getItemLineTotal(item), 0);
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
