/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import Home from './pages/Home';
import Menu from './pages/Menu';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminPanel from './pages/AdminPanel'; // New admin page
import MasterAdmin from './pages/MasterAdmin'; // Agency Admin page
import Cart from './components/Cart';
import { CartProvider } from './contexts/CartContext';
import { AlertTriangle, Phone } from 'lucide-react';
import { MENU_ITEMS, WHATSAPP_CONFIG } from './constants';
import { Toaster } from 'sonner';

function SuspendedPage() {
  const supportUrl = `${WHATSAPP_CONFIG.baseUrl}?phone=${WHATSAPP_CONFIG.number}&text=${encodeURIComponent('Olá suporte, minha loja encontra-se suspensa e gostaria de regularizar meu acesso para voltar a receber pedidos no meu cardápio.')}`;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-orange-500/10 rounded-full">
            <AlertTriangle className="w-12 h-12 text-orange-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Loja Temporariamente Indisponível</h1>
        <p className="text-zinc-400 mb-8">
          Prezado lojista, o acesso ao seu cardápio digital está temporariamente suspenso por pendências administrativas.
        </p>
        <div className="bg-zinc-800/50 rounded-xl p-4 mb-8 border border-zinc-700/50">
          <p className="text-sm text-zinc-300">
            Para reativar sua loja imediatamente, regularize sua situação com o departamento financeiro ou suporte técnico.
          </p>
        </div>
        <a 
          href={supportUrl}
          target="_blank"
          className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-6 rounded-lg transition"
        >
          <Phone className="w-5 h-5" />
          Falar com o Suporte
        </a>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div id="home"><Home /></div>
        <div id="cardapio"><Menu /></div>
        <div id="sobre"><About /></div>
        <div id="contato"><Contact /></div>
      </main>
      <Footer />
      <WhatsAppButton />
      <Cart />
    </div>
  );
}

export default function App() {
  const [isActive, setIsActive] = useState<boolean | null>(null);

  useEffect(() => {
    // Monitora o status da loja em tempo real
    const unsubscribe = onSnapshot(doc(db, 'settings', 'status'), (doc) => {
      if (doc.exists()) {
        setIsActive(doc.data().isActive !== false); // Default true se não existir a propriedade, só bloqueia se for explicitamente false
      } else {
        setIsActive(true); // Se o documento não existe, a loja tá liberada!
      }
    });
    
    // Auto-update missing attributes (Migração em background para exibir para o usuário as bebidas novas)
    const runMigration = async () => {
      const itemsToUpdate = ['d1', 'd2', 'd3', 's3'];
      for (const id of itemsToUpdate) {
        const docRef = doc(db, 'menu', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && !docSnap.data().meatOptions) {
           const localItem = MENU_ITEMS.find(m => m.id === id);
           if (localItem && localItem.meatOptions) {
              await setDoc(docRef, { ...docSnap.data(), ...localItem, meatOptions: localItem.meatOptions }, { merge: true });
           }
        }
      }
      
      // Force update the image for Agua Mineral 
      const waterRef = doc(db, 'menu', 'd3');
      const waterSnap = await getDoc(waterRef);
      if (waterSnap.exists() && waterSnap.data().image !== 'https://i.postimg.cc/QdyWyty4/agua-mineral.webp') {
         await setDoc(waterRef, { image: 'https://i.postimg.cc/QdyWyty4/agua-mineral.webp' }, { merge: true });
      }
    };
    runMigration();

    return () => unsubscribe();
  }, []);

  if (isActive === null) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando...</div>;
  }

  return (
    <CartProvider>
      <Router>
        <Toaster theme="dark" position="top-center" />
        <Routes>
          <Route path="/" element={isActive === false ? <SuspendedPage /> : <LandingPage />} />
          <Route path="/admin/*" element={<AdminPanel />} />
          <Route path="/agency" element={<MasterAdmin />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}
