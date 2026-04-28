import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ShoppingCart, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../contexts/CartContext';

const navLinks = [
  { name: 'Home', path: '#home' },
  { name: 'Cardápio', path: '#cardapio' },
  { name: 'Sobre', path: '#sobre' },
  { name: 'Contato', path: '#contato' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { setIsCartOpen, isStoreOpen } = useCart();

  const handleShare = async () => {
    const shareData = {
      title: 'Tri Burgers | O Melhor Hambúrguer de Goiânia',
      text: 'Bateu a fome? 🍔 Pede na Tri Burgers agora! Hambúrguer artesanal e entrega rápida.',
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        const textToShare = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (err) {
      console.log('Compartilhamento cancelado ou falhou', err);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <a href="#home" className="flex items-center space-x-2">
              <span className="text-2xl font-black tracking-tighter text-white">
                TRI<span className="text-red-600">BURGERS</span>
              </span>
            </a>
            
            {/* Status Loja */}
            {isStoreOpen ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-green-500 text-[10px] font-bold uppercase tracking-widest mt-[1px]">Aberto</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-[1px]">Fechado</span>
              </div>
            )}
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.path}
                href={link.path}
                className={`text-sm font-medium uppercase tracking-widest transition-colors hover:text-red-500 text-gray-300`}
              >
                {link.name}
              </a>
            ))}
            <div className="flex justify-center items-center gap-2">
              <button 
                onClick={handleShare}
                className="text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all"
                title="Compartilhe nosso cardápio"
              >
                <Share2 size={18} />
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                className="text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all"
                title="Ver minha sacola"
              >
                <ShoppingCart size={18} />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => setIsCartOpen(true)}
              className="text-gray-300 p-2 hover:bg-white/5 rounded-full"
            >
              <ShoppingCart size={24} />
            </button>
            <button 
              onClick={handleShare}
              className="text-gray-300 p-2 hover:bg-white/5 rounded-full"
            >
              <Share2 size={24} />
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white p-2"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-zinc-900 border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-4 text-base font-bold uppercase tracking-widest text-white`}
                >
                  {link.name}
                </a>
              ))}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsCartOpen(true);
                }}
                className="block w-full text-center bg-red-600 text-white py-4 rounded-xl font-black uppercase tracking-widest mt-4"
              >
                VER MINHA SACOLA
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
