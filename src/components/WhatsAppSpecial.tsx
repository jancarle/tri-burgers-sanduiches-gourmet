import { motion } from 'motion/react';
import { MessageCircle, ShoppingCart, Clock, ShieldCheck } from 'lucide-react';
import { WHATSAPP_CONFIG } from '../constants';
import { useCart } from '../contexts/CartContext';

export default function WhatsAppSpecial() {
  const { isStoreOpen, siteImages } = useCart();
  const url = `${WHATSAPP_CONFIG.baseUrl}?phone=${WHATSAPP_CONFIG.number}&text=${encodeURIComponent('Olá! Vi o site e quero fazer um pedido agora.')}`;

  return (
    <section className="py-8 md:py-12 bg-zinc-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#dc2626_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="bg-black border border-red-600/20 rounded-[3rem] p-8 md:p-16 shadow-[0_0_50px_rgba(220,38,38,0.1)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* PRODUCTION_PARITY_STORE_BADGE_2026_08_03 */}
              {isStoreOpen ? (
                <span className="inline-flex items-center gap-2 bg-green-500/10 text-green-500 text-xs font-black px-4 py-1 rounded-full tracking-widest uppercase mb-6">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  ATENDIMENTO ONLINE AGORA
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black px-4 py-1 rounded-full tracking-widest uppercase mb-6 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  LOJA FECHADA — ENVIE SUA MENSAGEM
                </span>
              )}
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 uppercase leading-none">
                CARDÁPIO <br /><span className="text-red-600">INTELIGENTE.</span>
              </h2>
              <p className="text-xl text-gray-400 mb-10 leading-relaxed">
                Monte seu pedido completo, escolha os adicionais e finalize direto no WhatsApp. Praticidade total com nossa sacola inteligente.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-zinc-900 rounded-xl text-red-600"><Clock size={20} /></div>
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-300">Entrega em 40 min</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-zinc-900 rounded-xl text-red-600"><ShieldCheck size={20} /></div>
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-300">Pedido Seguro</span>
                </div>
              </div>

              <button
                onClick={() => {
                  document.getElementById('cardapio')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-4 bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-full text-lg font-black tracking-widest transition-all hover:scale-105 shadow-[0_0_30px_rgba(220,38,38,0.3)]"
              >
                <ShoppingCart size={24} />
                VER CARDÁPIO & PEDIR AGORA
              </button>
              <p className="mt-4 text-xs text-gray-500 uppercase tracking-widest font-bold">
                * Resposta média em menos de 2 minutos
              </p>
            </div>
            
            <div className="relative mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-red-600/20 blur-[100px] rounded-full" />
              <img
                src={siteImages.menuCardImage}
                alt="Burger Close"
                className="relative z-10 w-full h-auto rounded-[2rem] shadow-2xl border border-white/10 rotate-1 lg:rotate-3"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
