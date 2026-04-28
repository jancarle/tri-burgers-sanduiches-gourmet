import { MessageCircle } from 'lucide-react';
import { motion, useScroll, useMotionValueEvent } from 'motion/react';
import { useState, useRef, useEffect } from 'react';
import { WHATSAPP_CONFIG } from '../constants';

export default function WhatsAppButton() {
  const message = encodeURIComponent('Olá! Gostaria de falar com o atendimento.');
  const url = `${WHATSAPP_CONFIG.baseUrl}?phone=${WHATSAPP_CONFIG.number}&text=${message}`;

  const [isVisible, setIsVisible] = useState(true);
  const { scrollY } = useScroll();
  const scrollTimeoutRef = useRef<number | null>(null);

  // Anima a barra mobile para descer assim que rolar e voltar 1 segundo depois de parar
  useMotionValueEvent(scrollY, "change", () => {
    // Esconder a barra assim que o scroll começa
    setIsVisible(false);

    // Limpar o timeout anterior, garantindo que só contará o tempo a partir da última mexida
    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    // Setar o novo intervalo de 1 seg (1000 milissegundos) para aparecer a barra
    scrollTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, 1000);
  });

  // Limpeza de memória
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const scrollToMenu = () => {
    document.getElementById('cardapio')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* --- DESKTOP: Bolinhas flutuantes na esquerda (escondido no mobile) --- */}
      <div className="hidden sm:flex fixed bottom-8 left-8 z-[50] flex-col items-start gap-4 pointer-events-none">
        
        {/* Botão Cardápio Desktop */}
        <motion.button
          onClick={scrollToMenu}
          className="group relative flex items-center justify-center bg-zinc-900 border border-white/10 text-white w-16 h-16 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:bg-red-600 hover:border-red-600 transition-colors pointer-events-auto"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute left-full ml-4 whitespace-nowrap bg-zinc-800 border border-white/5 text-white text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none cursor-pointer">
            Cardápio
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-zinc-800" />
          </div>
          <span className="text-2xl leading-none">🍔</span>
        </motion.button>

        {/* Botão WhatsApp Desktop */}
        <motion.a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-center bg-green-500 text-white w-16 h-16 rounded-full shadow-[0_0_40px_rgba(34,197,94,0.4)] pointer-events-auto"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute left-full ml-4 whitespace-nowrap bg-green-600 text-white text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            WhatsApp
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-green-600" />
          </div>
          <MessageCircle size={32} />
        </motion.a>
      </div>

      {/* --- MOBILE: Barra Inferior Dinâmica --- */}
      <motion.div 
        className="sm:hidden fixed bottom-4 left-4 right-4 z-[50] flex items-center gap-3"
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : 150 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <button
          onClick={scrollToMenu}
          className="flex-[1.2] bg-zinc-900 border border-white/20 text-white font-bold text-[11px] uppercase tracking-widest h-14 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,0,0,0.8)] active:scale-95 transition-transform drop-shadow-2xl"
        >
          <span>Cardápio</span>
          <span className="text-xl leading-none">🍔</span>
        </button>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-green-600 border border-white/20 text-white font-bold text-[11px] uppercase tracking-widest h-14 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(34,197,94,0.4)] active:scale-95 transition-transform"
        >
          <MessageCircle size={18} />
          <span>Chamar</span>
        </a>
      </motion.div>
    </>
  );
}
