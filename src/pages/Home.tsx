import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Clock, MapPin, Star, ChevronRight, Truck, MessageCircle, QrCode, Flame, Award, Zap, Bell, X } from 'lucide-react';
import { MENU_ITEMS, TRADITIONAL_BURGERS, HEADLINES, BUTTON_TEXTS, SLOGANS, CATEGORIES } from '../constants';
import SocialProof from '../components/SocialProof';
import WhatsAppSpecial from '../components/WhatsAppSpecial';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useMemo, useState, useEffect } from 'react';
import { MenuItem, Category } from '../types';

import { useCart } from '../contexts/CartContext';

export default function Home() {
  const [snapshot, loading] = useCollectionData(collection(db, 'menu'));
  const { addToCart } = useCart();

  useEffect(() => {
    // Lógica para Deep Linking (rola até o cardápio se houver produto na URL)
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('p');
    
    if (productId) {
      setTimeout(() => {
        const menuSection = document.getElementById('cardapio');
        if (menuSection) {
          menuSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 1000);
    }
  }, []);

  const summaryMenu = useMemo(() => {
    if (!loading && snapshot && snapshot.length > 0) {
      return (snapshot as MenuItem[])
        .filter(item => item.highlight)
        .slice(0, 4);
    }
    return [...MENU_ITEMS, ...TRADITIONAL_BURGERS].filter(it => it.highlight).slice(0, 4);
  }, [snapshot, loading]);

  return (
    <main className="bg-black text-white overflow-hidden font-sans">
      
      {/* 
        HERO SECTION: 
        Optimized for first impression and AIO (AI Overviews). 
        Contains core business value and keywords.
      */}
      <section className="relative min-h-screen flex items-center justify-center pt-20" aria-label="Introdução Tri Burgers">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=1920"
            alt="Hambúrguer Gourmet Artesanal Tri Burgers"
            className="w-full h-full object-cover opacity-80 scale-105 animate-pulse-slow"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-600/30 text-red-500 text-[10px] md:text-xs font-black px-6 py-2 rounded-full tracking-[0.3em] mb-8 uppercase backdrop-blur-sm">
              <Flame size={14} className="animate-bounce" /> {SLOGANS[3]}
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.85] mb-8 uppercase italic">
              O MELHOR <br /> <span className="text-red-500 not-italic">BURGER</span> <br /> DE GOIÂNIA
            </h1>
            <p className="text-lg md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
              Esqueça tudo o que você sabe sobre lanches. Na <span className="text-white font-bold">Tri Burgers</span>, cada mordida é um confronto direto com a perfeição. Blend artesanal, pão nuvem e o segredo que nos mantém como a <strong className="text-white">referência em Pit Dog no Setor Leste Vila Nova</strong> desde 2012.
            </p>
            
            <div className="flex items-center justify-center w-full max-w-md mx-auto relative group">
              <div className="absolute inset-0 bg-red-600 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse shadow-[0_0_80px_rgba(220,38,38,0.8)]" />
              <a
                href="#cardapio"
                className="relative w-full bg-red-600 hover:bg-red-700 text-white py-5 md:py-6 px-8 rounded-xl md:rounded-2xl text-lg md:text-2xl font-black tracking-widest transition-all flex items-center justify-center gap-4 group-hover:-translate-y-1 active:scale-95 text-center leading-tight overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] animate-shimmer" />
                <ShoppingCart size={24} />
                VER CARDÁPIO
              </a>
            </div>

            <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-gray-500">
              <span className="flex items-center gap-2 md:border-r border-white/10 md:pr-8"><Zap size={16} className="text-yellow-500" /> Entrega Ultra-Rápida</span>
              <span className="flex items-center gap-2 md:border-r border-white/10 md:pr-8"><Award size={16} className="text-red-600" /> Qualidade Certificada</span>
              <span className="flex items-center gap-2"><Flame size={16} className="text-orange-500" /> Ingredientes Frescos</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Secret Section - High Impact Visual */}
      <section className="py-16 md:py-32 bg-black relative overflow-hidden border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-600/20 blur-[80px] rounded-full" />
              <motion.div 
                initial={{ skewY: 3 }}
                whileInView={{ skewY: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl group"
              >
                <img 
                  src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1000" 
                  alt="Making of" 
                  className="w-full h-full object-cover origin-center opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-1000"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <div className="absolute -bottom-6 -right-6 bg-red-600 p-8 rounded-3xl shadow-2xl z-20 rotate-6">
                <p className="text-4xl font-black leading-none">100%</p>
                <p className="text-xs font-bold uppercase tracking-widest">Artesanal</p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="text-red-600 font-black tracking-[0.3em] uppercase text-sm mb-4 block">O Segredo Tri Burgers</span>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-8 leading-none">
                A CIÊNCIA DA <br /><span className="text-red-600">SUCULÊNCIA.</span>
              </h2>
              <p className="text-xl text-gray-400 mb-10 leading-relaxed">
                Não é sorte, é técnica. Nossos blends são moídos diariamente, nunca congelados. O pão é selado na manteiga de garrafa para criar uma barreira de sabor que mantém tudo suculento até a última mordida.
              </p>
              <div className="space-y-6">
                {[
                  { t: "Blend Exclusivo", d: "Proporção perfeita de gordura e carne para o máximo sabor." },
                  { t: "Pão Nuvem", d: "Receita própria, leve como o ar e resistente ao molho." },
                  { t: "Molho Tri-Sauce", d: "A receita guardada a sete chaves que você só encontra aqui." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 items-start">
                    <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-red-600 shrink-0 border border-white/5">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h4 className="font-black uppercase tracking-tight text-white">{item.t}</h4>
                      <p className="text-gray-500 text-sm">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Menu - Bento Grid Style */}
      <section className="py-16 md:py-32 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <span className="text-red-600 font-black tracking-[0.3em] uppercase text-sm mb-4 block">Seleção de Elite</span>
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none">
              OS MAIS <br /><span className="text-red-600">DESEJADOS.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryMenu.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-red-600/40 transition-all aspect-square md:aspect-[4/5]"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2">{item.name}</h3>
                  <p className="text-gray-300 text-sm md:text-base font-medium mb-4 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-red-600">{item.priceText || `R$ ${item.price.toFixed(2)}`}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(item);
                      }}
                      className="bg-white text-black p-4 rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-90"
                    >
                      <ShoppingCart size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-16 text-center flex flex-col items-center">
            <button 
              onClick={() => {
                document.getElementById('cardapio')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-4 text-white font-black uppercase tracking-[0.3em] text-sm border-b-2 border-red-600 pb-2 hover:text-red-600 transition-colors group"
            >
              Ver Cardápio Completo <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </button>

            {/* Transição Criativa para preencher o espaço */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-24 flex flex-col items-center"
            >
              <div className="w-px h-24 bg-gradient-to-b from-red-600 to-transparent mb-8" />
              
              <div className="relative group cursor-pointer flex items-center justify-center">
                {/* Camadas de Brilho (Fogueira) */}
                <motion.div 
                  animate={{ 
                    scale: [1, 1.4, 1],
                    opacity: [0.3, 0.6, 0.3] 
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-40 h-40 bg-red-600 rounded-full blur-[50px] group-hover:bg-red-500 group-hover:blur-[80px] group-hover:scale-150 transition-all duration-700" 
                />
                <motion.div 
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.2, 0.4, 0.2] 
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute w-56 h-56 bg-orange-600 rounded-full blur-[60px] group-hover:bg-orange-400 group-hover:blur-[100px] group-hover:scale-150 transition-all duration-700" 
                />
                <motion.div 
                  animate={{ 
                    scale: [1, 1.6, 1],
                    opacity: [0, 0.3, 0] 
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute w-72 h-72 bg-yellow-500 rounded-full blur-[80px] group-hover:opacity-40 group-hover:blur-[120px] group-hover:scale-150 transition-all duration-700" 
                />

                {/* Container do Ícone */}
                <div className="relative border border-white/10 p-8 rounded-full bg-zinc-950 z-10 overflow-hidden group-hover:border-red-600/50 transition-colors">
                  <Flame size={40} className="text-red-600 group-hover:text-orange-500 transition-colors relative z-10" />
                  
                  {/* Reflexo interno ao passar o mouse */}
                  <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <p className="mt-8 text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600 group-hover:text-red-600 transition-colors">
                A Jornada do Sabor Continua
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="bg-black py-4">
        <div className="max-w-7xl mx-auto px-4 overflow-hidden whitespace-nowrap">
          <div className="flex animate-marquee-fast text-red-600/20 font-black text-6xl uppercase tracking-tighter select-none">
            <span className="mx-4">SABOR BRUTAL • SUCO AO TOPO • REAL BURGER • ARTESANAL •</span>
            <span className="mx-4">SABOR BRUTAL • SUCO AO TOPO • REAL BURGER • ARTESANAL •</span>
          </div>
        </div>
      </div>

      <SocialProof />
      <WhatsAppSpecial />

      {/* Espaço Físico & Kids */}
      <section className="py-8 md:py-16 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-zinc-900 rounded-[4rem] p-8 md:p-16 border border-white/5 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
            
            <div className="flex-1 relative z-10 w-full order-2 lg:order-1 mt-10 lg:mt-0">
              <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3] md:aspect-[16/9] lg:aspect-square group shadow-2xl border border-white/10">
                <img 
                  src="https://i.postimg.cc/65W5WKYb/tri-burges.webp" 
                  alt="Espaço físico do Tri Burgers com pula-pula" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="bg-red-600 inline-block px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-3">
                    Novo Espaço
                  </div>
                  <p className="text-white font-bold text-xl leading-snug">Vem curtir com toda a família!</p>
                </div>
              </div>
            </div>

            <div className="flex-1 relative z-10 order-1 lg:order-2 text-center lg:text-left">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase mb-6 leading-[0.9]">
                DIVERSÃO <br /><span className="text-red-600">GARANTIDA.</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-400 mb-8 leading-relaxed font-medium">
                Sua experiência ficou ainda mais completa! Venha conhecer nosso espaço físico. Agora temos um <strong className="text-white">Pula-Pula exclusivo</strong> para a criançada gastar energia enquanto você saboreia o melhor burger de Goiás com tranquilidade.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-10">
                {['Espaço Kids', 'Ambiente Familiar', 'Pula-Pula'].map((tag, i) => (
                  <span key={i} className="bg-black/50 border border-white/10 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest text-gray-300">
                    {tag}
                  </span>
                ))}
              </div>
              <a 
                href="https://maps.app.goo.gl/ZPHVxRKsVDSVYb7P7"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-4 bg-red-600 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors mx-auto lg:mx-0 w-full sm:w-auto"
              >
                <MapPin size={18} />
                Como Chegar
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Aggressive */}
      <section className="py-8 md:py-16 bg-red-600 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-6xl md:text-9xl font-black tracking-tighter uppercase mb-10 leading-none italic">
            VAI FICAR SÓ <br />OLHANDO?
          </h2>
          <p className="text-xl md:text-3xl font-bold mb-12 opacity-90 px-4">
            Sua fome não espera. O melhor burger de Goiás está a um clique de distância.
          </p>
          <a
            href="#cardapio"
            className="flex items-center justify-center gap-3 bg-black text-white px-6 py-6 md:px-16 md:py-8 rounded-full sm:rounded-[2rem] text-[15px] sm:text-xl md:text-2xl font-black tracking-widest hover:scale-105 transition-all shadow-2xl active:scale-95 mx-auto max-w-2xl"
          >
            IR PARA O CARDÁPIO
          </a>
        </div>
      </section>
    </main>
  );
}
