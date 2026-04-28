import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Plus, Minus, Trash2, Send } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

export default function Cart() {
  const { cart, cartTotal, cartQuantity, updateQuantity, removeFromCart, isCartOpen, setIsCartOpen, clearCart, isStoreOpen } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [formError, setFormError] = useState('');

  const whatsappNumber = '5562991778064';

  const handleCheckout = async () => {
    if (!isStoreOpen) {
      setFormError('A loja está fechada no momento. Não é possível fazer pedidos.');
      return;
    }
    if (!customerName.trim()) {
      setFormError('Por favor, preencha seu nome para confirmar o pedido.');
      const nameInput = document.getElementById('customerNameInput');
      if (nameInput) {
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameInput.focus();
      }
      return;
    }
    
    setFormError('');

    let message = `*🍔 NOVO PEDIDO ONLINE*\n---------------------------\n\n`;
    
    cart.forEach(item => {
      const itemPrice = item.selectedOption ? item.selectedOption.price : item.price;
      const variationName = item.selectedOption ? ` (${item.selectedOption.name})` : '';
      message += `${item.quantity}x ${item.name}${variationName} -- R$ ${(itemPrice * item.quantity).toFixed(2)}\n`;
    });

    message += `\n*Total da Sacola:* R$ ${cartTotal.toFixed(2)}\n\n`;
    message += `*Cliente:* ${customerName}\n`;
    message += `*Forma de Pagamento:* ${paymentMethod}\n`;
    message += `*Endereço:* (Prezado cliente, queira por favor, enviar sua localização ou endereço abaixo)\n`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    // Abre o WhatsApp imediatamente, antes de qualquer operação assíncrona
    window.open(whatsappUrl, '_blank');

    const orderData = {
      customerName,
      paymentMethod,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.selectedOption ? item.selectedOption.price : item.price,
        variation: item.selectedOption ? item.selectedOption.name : null,
      })),
      total: cartTotal,
      status: 'pendente', // pendente, preparando, concluido
      createdAt: new Date().toISOString(),
    };

    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      await addDoc(collection(db, 'orders'), orderData);
    } catch (e) {
      console.error("Erro ao salvar pedido no DB:", e);
    }
    
    clearCart();
    setIsCartOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity"
            />
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-zinc-950 border-l border-white/10 z-[60] flex flex-col shadow-2xl"
            >
              <div className="p-6 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="bg-red-600 p-2 rounded-full">
                    <ShoppingBag size={20} className="text-white" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-widest text-white">Sua Sacola</h2>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 pb-32 scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-zinc-900">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                    <ShoppingBag size={64} className="mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-center text-sm">Sua sacola está vazia</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="mt-6 text-red-600 font-bold hover:text-red-500 transition-colors uppercase tracking-widest text-xs border-b border-red-600/30 pb-1"
                    >
                      Ver Cardápio
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {cart.map(item => (
                        <div key={item.cartItemId} className="flex gap-4 bg-zinc-900 p-4 rounded-2xl border border-white/5 relative group">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl shrink-0" />
                          ) : (
                            <div className="w-20 h-20 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0 border border-white/5">
                              <Plus size={24} className="text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-white font-bold text-sm uppercase leading-tight line-clamp-1">{item.name}</h4>
                                {item.selectedOption && (
                                  <span className="bg-red-600/20 text-red-500 text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                                    {item.selectedOption.name}
                                  </span>
                                )}
                              </div>
                              <p className="text-red-500 font-black mt-1">
                                R$ {((item.selectedOption ? item.selectedOption.price : item.price) * item.quantity).toFixed(2)}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-3 bg-black rounded-lg p-1 border border-white/10">
                                <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="text-gray-400 hover:text-white p-1"><Minus size={14} /></button>
                                <span className="text-white font-bold text-xs w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="text-gray-400 hover:text-white p-1"><Plus size={14} /></button>
                              </div>
                              <button onClick={() => removeFromCart(item.cartItemId)} className="text-gray-500 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-white/10 space-y-4">
                      <h3 className="text-white font-black uppercase tracking-widest text-sm bg-zinc-900 p-3 rounded-lg text-center border border-white/5">Detalhes da Entrega</h3>
                      
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">Seu Nome</label>
                        <input 
                          id="customerNameInput"
                          type="text" 
                          value={customerName}
                          onChange={e => { setCustomerName(e.target.value); setFormError(''); }}
                          placeholder="Digite seu nome"
                          className={`w-full bg-black border ${formError ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600 transition-colors`}
                        />
                        {formError && (
                          <p className="text-red-500 text-[11px] mt-2 font-bold tracking-wide flex items-center gap-1">
                            <span className="text-sm">⚠️</span> {formError}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">Forma de Pagamento</label>
                        <select 
                          value={paymentMethod}
                          onChange={e => setPaymentMethod(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600 transition-colors appearance-none"
                        >
                          <option value="PIX">PIX</option>
                          <option value="Cartão de Crédito">Cartão de Crédito (na entrega)</option>
                          <option value="Cartão de Débito">Cartão de Débito (na entrega)</option>
                          <option value="Dinheiro">Dinheiro (na entrega)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-black border-t border-white/10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Total do Pedido</span>
                    <span className="text-2xl font-black text-white">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {isStoreOpen ? (
                      <button 
                        onClick={handleCheckout}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-black tracking-widest uppercase py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(22,163,74,0.3)] flex items-center justify-center gap-3 active:scale-95 border border-green-500/50"
                      >
                        Confirmar Pedido <Send size={18} />
                      </button>
                    ) : (
                      <button 
                        disabled
                        className="w-full bg-zinc-800 text-zinc-500 font-black tracking-widest uppercase py-4 rounded-xl flex items-center justify-center gap-3 border border-zinc-700 cursor-not-allowed"
                      >
                        Loja Fechada
                      </button>
                    )}

                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="w-full bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-bold tracking-widest uppercase py-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 text-[11px]"
                    >
                      Voltar ao Cardápio
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isCartOpen && cartQuantity > 0 && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-[88px] right-4 md:bottom-8 md:right-8 z-[60] bg-red-600 text-white p-4 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:scale-110 active:scale-95 transition-transform flex items-center justify-center"
          >
            <div className="relative">
              <ShoppingBag size={24} />
              <span className="absolute -top-3 -right-3 bg-black text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-red-600">
                {cartQuantity}
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
