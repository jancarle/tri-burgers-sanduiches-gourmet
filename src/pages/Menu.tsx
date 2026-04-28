import { motion } from 'motion/react';
import { ShoppingCart, Flame, Plus } from 'lucide-react';
import { MENU_ITEMS, TRADITIONAL_BURGERS, CATEGORIES } from '../constants';
import { MenuItem, Category } from '../types';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useMemo, useEffect, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { WHATSAPP_CONFIG } from '../constants';

export default function Menu() {
  const [snapshot, loading] = useCollectionData(collection(db, 'menu'));
  const { addToCart } = useCart();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Use Firebase data if it exists, otherwise use local constants
  const allItems = useMemo(() => {
    if (!loading && snapshot && snapshot.length > 0) {
      return (snapshot as MenuItem[]).sort((a, b) => CATEGORIES.indexOf(a.category as Category) - CATEGORIES.indexOf(b.category as Category));
    }
    return [...TRADITIONAL_BURGERS, ...MENU_ITEMS];
  }, [snapshot, loading]);

  // Efeito para tratar o parâmetro de compartilhamento ?p=ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('p');
    
    if (productId && allItems.length > 0) {
      // Pequeno delay para garantir que a renderização aconteceu
      const timer = setTimeout(() => {
        const element = document.getElementById(`product-${productId}`);
        if (element) {
          // Calcula a posição com offset para não ficar atrás do navbar
          const yOffset = -120; 
          const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
          
          window.scrollTo({ top: y, behavior: 'smooth' });
          setHighlightedId(productId);
          
          // Remove o destaque após alguns segundos para não poluir
          setTimeout(() => setHighlightedId(null), 5000);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [allItems]);

  const categories = Array.from(new Set(allItems.map((item) => item.category))) as Category[];

  const handleOrder = (itemName: string) => {
    const message = encodeURIComponent(`Olá! Gostaria de pedir o item: ${itemName}`);
    window.open(`${WHATSAPP_CONFIG.baseUrl}?phone=${WHATSAPP_CONFIG.number}&text=${message}`, '_blank');
  };

  const scrollToCategory = (cat: string) => {
    const id = `cat-${cat.replace(/\s+/g, '-').toLowerCase()}`;
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-black text-white font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8 md:mb-16">
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-600 font-black tracking-[0.4em] uppercase text-[10px] md:text-sm mb-4 block"
          >
            Experiência Gastronômica
          </motion.span>
          <h1 className="text-5xl sm:text-6xl md:text-[9rem] font-black tracking-tighter uppercase mb-4 md:mb-8 leading-[0.85] italic">
            CARDÁPIO <br /><span className="text-red-600 not-italic">SUPREMO.</span>
          </h1>
          
          {/* Subheadline */}
          <h2 className="text-lg sm:text-2xl md:text-3xl text-gray-400 font-bold max-w-2xl mx-auto italic px-4">
            O que você deseja devorar hoje?
          </h2>
        </div>

        {/* Categories (Sticky Navbar wrapper) */}
        <div className="sticky top-[70px] z-30 bg-black/90 backdrop-blur-xl py-4 mb-12 border-b border-white/5 mx-[-1rem] px-4 md:mx-0 md:px-0 md:rounded-[2rem] md:border md:border-white/10 shadow-2xl">
            <div className="flex flex-wrap justify-center gap-2 md:gap-4 items-center pb-2 md:pb-0 px-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => scrollToCategory(cat)}
                  className="px-4 py-2 md:px-6 md:py-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all bg-zinc-900 text-gray-400 border border-white/5 hover:border-red-600/50 hover:text-white"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4">
        {categories.map((cat) => {
          const catId = `cat-${cat.replace(/\s+/g, '-').toLowerCase()}`;
          const categoryItems = allItems.filter(item => item.category === cat);

          if (categoryItems.length === 0) return null;

          return (
            <div key={cat} id={catId} className="scroll-mt-36 mb-24">
              <div className="flex items-center gap-4 mb-10">
                <Flame className="text-red-600 shrink-0" size={32} />
                <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">{cat}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categoryItems.map((item, idx) => (
                  <motion.div 
                    key={item.id}
                    id={`product-${item.id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: (idx % 3) * 0.1 }}
                    className={`bg-zinc-900/40 border rounded-[3rem] overflow-hidden transition-all duration-500 group flex flex-col shadow-2xl relative ${
                      highlightedId === item.id 
                        ? 'border-red-600 shadow-[0_0_40px_rgba(220,38,38,0.6)] scale-[1.03] ring-4 ring-red-600/20 animate-pulse-slow' 
                        : 'border-white/5 hover:border-red-600/30 hover:shadow-[0_20px_50px_rgba(220,38,38,0.15)]'
                    }`}
                  >
                    {item.image && (
                      <div className="aspect-[4/3] overflow-hidden relative">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                        <div className="absolute top-4 right-4 md:top-6 md:right-6 bg-black/80 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl border border-white/10">
                          <span className="text-red-500 font-black tracking-widest text-sm md:text-base">{item.priceText || `R$ ${item.price.toFixed(2)}`}</span>
                        </div>
                        {item.highlight && item.available !== false && (
                          <div className="absolute top-4 left-4 md:top-6 md:left-6 bg-red-600 text-white text-[10px] md:text-[10px] uppercase font-black tracking-[0.2em] px-3 py-1 rounded-full">
                            Pop
                          </div>
                        )}
                        {item.available === false && (
                          <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                            <span className="bg-black text-red-600 text-lg font-black uppercase tracking-[0.4em] px-6 py-3 rounded-2xl border-2 border-red-600 rotate-[-15deg]">
                              Esgotado
                            </span>
                          </div>
                        )}
                        <h3 className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 text-2xl font-black uppercase tracking-tight text-white leading-tight z-20">{item.name}</h3>
                      </div>
                    )}
                    <div className="p-6 md:p-8 flex-1 flex flex-col bg-zinc-950/80">
                      {!item.image && (
                         <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-white group-hover:text-red-600 transition-colors">{item.name}</h3>
                      )}
                      <div className="flex-1 mb-8">
                        <p className="text-gray-300 text-base md:text-lg leading-relaxed font-medium">
                          {item.description}
                        </p>
                        {!item.image && (
                          <div className="mt-4">
                            <span className="text-red-500 font-black tracking-widest text-lg">{item.priceText || `R$ ${item.price.toFixed(2)}`}</span>
                          </div>
                        )}
                        {item.meatOptions && (
                          <div className="space-y-2 mt-6 border-t border-white/10 pt-6">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Selecione a Carne e Adicione:</p>
                            {item.meatOptions.map((opt, i) => (
                              <button
                                key={i}
                                onClick={() => addToCart(item, opt)}
                                disabled={item.available === false}
                                className={`w-full flex justify-between items-center text-left text-xs bg-zinc-900/50 p-3 rounded-xl border border-white/5 transition-colors group/opt ${
                                  item.available === false ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-800'
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span className="font-bold text-gray-300 group-hover/opt:text-white transition-colors">{opt.name}</span>
                                  <span className="text-red-500 font-black">R$ {opt.price.toFixed(2)}</span>
                                </div>
                                <span className="bg-white/5 group-hover/opt:bg-red-600 text-gray-400 group-hover/opt:text-white px-3 py-2 rounded-lg font-bold transition-colors flex items-center gap-1">
                                  <Plus size={14} /> Add
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                        {item.category === 'Sanduíches Tradicionais' && (
                          <p className="mt-4 text-[11px] font-bold text-yellow-500/90 leading-snug">
                            * OPCIONAIS GRÁTIS: Abacaxi e Cebola
                          </p>
                        )}
                      </div>
                      {!item.meatOptions && (
                        <button
                          onClick={() => addToCart(item)}
                          disabled={item.available === false}
                          className={`w-full py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                            item.available === false 
                              ? 'bg-zinc-800 text-gray-500 cursor-not-allowed' 
                              : 'bg-white text-black hover:bg-red-600 hover:text-white group-hover:scale-[1.02]'
                          }`}
                        >
                          <ShoppingCart size={18} />
                          {item.available === false ? 'ESGOTADO' : 'ADICIONAR'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
