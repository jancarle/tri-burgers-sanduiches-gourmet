// ADDONS_PRODUCT_MODAL_2026_08_04
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, ShoppingCart, Sparkles, ChefHat } from 'lucide-react';
import { MenuItem, Addon, SelectedAddon } from '../types';
import { useCart } from '../contexts/CartContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface ProductCustomizationModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  initialOption?: { name: string; price: number };
}

export default function ProductCustomizationModal({
  item,
  isOpen,
  onClose,
  initialOption
}: ProductCustomizationModalProps) {
  const { addToCart, isStoreOpen } = useCart();
  const [firestoreAddons, setFirestoreAddons] = useState<Addon[]>([]);
  const [isLoadingAddons, setIsLoadingAddons] = useState<boolean>(true);

  const [selectedOption, setSelectedOption] = useState<{ name: string; price: number } | undefined>(undefined);
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({});
  const [mainQuantity, setMainQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [addonsLoadFailed, setAddonsLoadFailed] = useState<boolean>(false);
  const submitLockRef = useRef(false);

  // Load real-time addons from Firestore collection 'addons'
  useEffect(() => {
    if (!isOpen) return;

    setIsLoadingAddons(true);
    setAddonsLoadFailed(false);
    setFirestoreAddons([]);

    const q = query(collection(db, 'addons'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: Addon[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.available === true) {
            loaded.push({
              id: docSnap.id,
              name: data.name || '',
              price: Number(data.price) || 0,
              available: true,
              order: Number(data.order) || 0,
            });
          }
        });
        loaded.sort((a, b) => a.order - b.order);
        setFirestoreAddons(loaded);
        setAddonsLoadFailed(false);
        setIsLoadingAddons(false);
      },
      (error) => {
        console.error('Error fetching addons for modal:', error);
        setFirestoreAddons([]);
        setAddonsLoadFailed(true);
        setIsLoadingAddons(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  // Reset state whenever a new item is opened
  useEffect(() => {
    if (isOpen && item) {
      setMainQuantity(1);
      setAddonQuantities({});
      setIsSubmitting(false);
      submitLockRef.current = false;

      if (item.meatOptions && item.meatOptions.length > 0) {
        const matchedInitialOption = initialOption
          ? item.meatOptions.find(option => option.name === initialOption.name)
          : undefined;

        setSelectedOption(matchedInitialOption ?? item.meatOptions[0]);
      } else {
        setSelectedOption(undefined);
      }
    }
  }, [isOpen, item, initialOption]);

  if (!isOpen || !item) return null;

  const basePrice = selectedOption ? selectedOption.price : item.price;
  
  const addonsUnitTotal = firestoreAddons.reduce((sum, addon) => {
    const qty = addonQuantities[addon.id] || 0;
    return sum + (addon.price * qty);
  }, 0);

  const configuredUnitPrice = basePrice + addonsUnitTotal;
  const grandTotal = configuredUnitPrice * mainQuantity;

  const handleIncrementAddon = (addonId: string) => {
    setAddonQuantities(prev => {
      const current = prev[addonId] || 0;
      if (current >= 10) return prev;
      return { ...prev, [addonId]: current + 1 };
    });
  };

  const handleDecrementAddon = (addonId: string) => {
    setAddonQuantities(prev => {
      const current = prev[addonId] || 0;
      if (current <= 0) return prev;
      const next = current - 1;
      if (next === 0) {
        const copy = { ...prev };
        delete copy[addonId];
        return copy;
      }
      return { ...prev, [addonId]: next };
    });
  };

  const handleAddToCartSubmit = () => {
    const requiresOption = Boolean(item.meatOptions && item.meatOptions.length > 0);

    if ((requiresOption && !selectedOption) || submitLockRef.current || isSubmitting) {
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    const selectedAddonsList: SelectedAddon[] = firestoreAddons
      .filter(a => (addonQuantities[a.id] || 0) > 0)
      .map(a => ({
        id: a.id,
        name: a.name,
        price: a.price,
        quantity: addonQuantities[a.id]
      }));

    addToCart(item, selectedOption, selectedAddonsList, mainQuantity);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col z-10"
          >
            {/* Header with Close button */}
            <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/80 sticky top-0 z-20 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <ChefHat className="text-red-500" size={20} />
                <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wide truncate max-w-[240px] sm:max-w-xs">
                  {item.name}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 rounded-full transition"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-zinc-900">
              {/* Product Info Header */}
              <div className="flex gap-4">
                {item.image && (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-zinc-800">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">{item.name}</h4>
                    <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2">{item.description}</p>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Preço Base</span>
                    <span className="text-lg font-black text-red-500">
                      R$ {basePrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meat / Variation Selection (If applicable) */}
              {item.meatOptions && item.meatOptions.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
                      <span>Escolha a Opção *</span>
                    </label>
                    <span className="text-[10px] bg-red-950 text-red-400 px-2 py-0.5 rounded font-bold border border-red-800/40">
                      Obrigatório
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {item.meatOptions.map((opt, idx) => {
                      const isSelected = selectedOption?.name === opt.name;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedOption(opt)}
                          className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-red-600/15 border-red-500 text-white shadow-md'
                              : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-red-500 bg-red-600' : 'border-zinc-600'}`}>
                              {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                            <span className="font-bold text-sm">{opt.name}</span>
                          </div>
                          <span className="text-sm font-black text-red-400">
                            R$ {opt.price.toFixed(2).replace('.', ',')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Addons Section */}
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={16} className="text-red-500" />
                      Adicionais
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Turbine seu pedido com adicionais extras.
                    </p>
                  </div>
                </div>

                {isLoadingAddons ? (
                  <div className="py-6 text-center text-xs text-zinc-500">
                    Carregando adicionais disponíveis...
                  </div>
                ) : addonsLoadFailed ? (
                  <div className="py-4 px-3 text-center text-xs text-zinc-500 bg-zinc-900/40 rounded-xl border border-zinc-800">
                    Adicionais indisponíveis no momento. Você ainda pode pedir o produto sem extras.
                  </div>
                ) : firestoreAddons.length === 0 ? (
                  <div className="py-4 text-center text-xs text-zinc-500 bg-zinc-900/40 rounded-xl border border-zinc-800">
                    Nenhum adicional disponível no momento.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {firestoreAddons.map((addon) => {
                      const qty = addonQuantities[addon.id] || 0;
                      return (
                        <div
                          key={addon.id}
                          className={`p-3 rounded-xl border transition flex items-center justify-between ${
                            qty > 0
                              ? 'bg-zinc-900 border-red-500/50 text-white'
                              : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-sm text-white">{addon.name}</div>
                            <div className="text-xs text-red-400 font-bold mt-0.5">
                              + R$ {addon.price.toFixed(2).replace('.', ',')}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {qty > 0 && (
                              <button
                                type="button"
                                onClick={() => handleDecrementAddon(addon.id)}
                                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center transition active:scale-95"
                                aria-label={`Remover ${addon.name}`}
                              >
                                <Minus size={14} />
                              </button>
                            )}

                            {qty > 0 ? (
                              <span className="w-6 text-center text-sm font-black text-red-500">
                                {qty}
                              </span>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleIncrementAddon(addon.id)}
                              className={`h-8 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1 active:scale-95 ${
                                qty > 0
                                  ? 'bg-red-600 hover:bg-red-500 text-white'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                              }`}
                            >
                              <Plus size={14} />
                              {qty === 0 ? 'Adicionar' : ''}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer / Controls */}
            <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900/95 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-0 z-20 backdrop-blur-md">
              {/* Main Product Quantity Selector */}
              <div className="flex items-center justify-between w-full sm:w-auto gap-3 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
                <span className="text-xs font-bold text-zinc-400 px-2 uppercase">Qtd:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMainQuantity(q => Math.max(1, q - 1))}
                    disabled={mainQuantity <= 1}
                    className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-black text-white text-base">
                    {mainQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMainQuantity(q => q + 1)}
                    className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Add To Cart Button */}
              <button
                type="button"
                onClick={handleAddToCartSubmit}
                disabled={!isStoreOpen || isSubmitting || Boolean(item.meatOptions?.length && !selectedOption)}
                className={`w-full sm:flex-1 py-3.5 px-5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2.5 active:scale-95 ${
                  !isStoreOpen || isSubmitting || Boolean(item.meatOptions?.length && !selectedOption)
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30'
                }`}
              >
                <ShoppingCart size={18} />
                {!isStoreOpen ? (
                  'Loja Fechada'
                ) : (
                  <>
                    <span>Adicionar à sacola —</span>
                    <span className="text-yellow-300 font-extrabold">
                      R$ {grandTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
