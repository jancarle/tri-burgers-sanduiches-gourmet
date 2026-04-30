import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { Shield, Lock, Check, Search, Smartphone, DollarSign, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MasterAdmin() {
  const [user, loading] = useAuthState(auth);
  const [isPremium, setIsPremium] = useState(false);
  const [isActive, setIsActive] = useState(true); // Controla tela vermelha de suspensão
  const [dueDate, setDueDate] = useState(''); // Data de vencimento

  useEffect(() => {
    // Escuta settings de Push
    const unsubStore = onSnapshot(doc(db, 'settings', 'store'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.isPremium !== undefined) setIsPremium(data.isPremium);
        if (data.dueDate !== undefined) setDueDate(data.dueDate);
      }
    });

    // Escuta status da Loja (Suspensa/Ativa)
    const unsubStatus = onSnapshot(doc(db, 'settings', 'status'), (doc) => {
      if (doc.exists() && doc.data().isActive !== undefined) {
        setIsActive(doc.data().isActive);
      }
    });

    return () => {
      unsubStore();
      unsubStatus();
    };
  }, []);

  const togglePremium = async () => {
    const newValue = !isPremium;
    setIsPremium(newValue);
    try {
      await setDoc(doc(db, 'settings', 'store'), { isPremium: newValue }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleStatus = async () => {
    const newValue = !isActive;
    setIsActive(newValue);
    try {
      await setDoc(doc(db, 'settings', 'status'), { isActive: newValue }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDueDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDueDate(newDate);
    try {
      await setDoc(doc(db, 'settings', 'store'), { dueDate: newDate }, { merge: true });
    } catch (e) {
      console.error('Erro ao atualizar data de vencimento', e);
    }
  };

  // Se não for o admin master, exibe erro
  if (!loading && user?.email !== 'marketingjan@gmail.com') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <Shield size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold">Acesso Negado</h1>
        <p className="text-zinc-500 mt-2">Esta é uma área exclusiva da Agência Administradora.</p>
        <Link to="/admin" className="mt-6 text-red-500 underline">Voltar para o Painel da Loja</Link>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando Master...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="bg-black border-b border-zinc-800 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-500" />
            <div>
              <h1 className="text-xl font-bold uppercase tracking-widest text-white">Master Admin / Agência</h1>
              <p className="text-xs text-blue-500 font-bold">Operações & Gestão de Clientes</p>
            </div>
          </div>
          <Link to="/admin" className="text-sm bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg hover:bg-zinc-800 transition">
            Ir para Painel da Loja
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 py-8">
        
        {/* Visão Geral */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 text-zinc-400 mb-2">
                    <Activity size={18} />
                    <span className="text-sm font-bold uppercase tracking-widest">Lojas Ativas</span>
                </div>
                <p className="text-3xl font-black text-white">{isActive ? '1' : '0'}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 text-zinc-400 mb-2">
                    <Smartphone size={18} />
                    <span className="text-sm font-bold uppercase tracking-widest">Marketing Viral Ativo</span>
                </div>
                <p className="text-3xl font-black text-white">{isPremium ? '1' : '0'}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 text-emerald-500 mb-2">
                    <DollarSign size={18} />
                    <span className="text-sm font-bold uppercase tracking-widest text-emerald-500">Faturamento Est.</span>
                </div>
                <p className="text-3xl font-black text-emerald-400">R$ {isPremium ? '244' : '97'}<span className="text-sm text-emerald-600">/mês</span></p>
            </div>
        </div>

        {/* Gerenciamento do Cliente Único/Demonstração */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <h2 className="text-lg font-bold">Lojas / Cardápios Digitais</h2>
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type="text" placeholder="Buscar loja..." disabled className="bg-black border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none w-64 opacity-50" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/50 text-xs uppercase tracking-widest text-zinc-500">
                  <th className="p-4 font-bold border-b border-zinc-800">Cliente (Loja)</th>
                  <th className="p-4 font-bold border-b border-zinc-800">Domínio / Link</th>
                  <th className="p-4 font-bold border-b border-zinc-800 text-center">Vencimento</th>
                  <th className="p-4 font-bold border-b border-zinc-800 text-center">Status Acesso</th>
                  <th className="p-4 font-bold border-b border-zinc-800 text-center">Marketing Viral</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
                            T
                        </div>
                        <div>
                            <p className="font-bold text-white leading-none mb-1">Tri Burgers</p>
                            <p className="text-xs text-zinc-500 leading-none">ID: tb-001</p>
                        </div>
                    </div>
                  </td>
                  <td className="p-4 border-b border-zinc-800">
                    <a href="/" target="_blank" className="text-blue-500 hover:underline text-sm flex items-center gap-1">Ver Loja</a>
                  </td>
                  <td className="p-4 border-b border-zinc-800 text-center">
                    <input 
                      type="date" 
                      value={dueDate}
                      onChange={handleDueDateChange}
                      className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                    />
                  </td>
                  <td className="p-4 border-b border-zinc-800 text-center">
                    <button 
                        onClick={toggleStatus}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all inline-flex items-center gap-1 ${
                            isActive 
                            ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' 
                            : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                        }`}
                    >
                        {isActive ? <><Check size={12}/> Liberado</> : <><Lock size={12}/> Inadimplente</>}
                    </button>
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest cursor-pointer hover:text-white" onClick={toggleStatus}>
                        {isActive ? 'Clique p/ suspender' : 'Clique p/ liberar'}
                    </p>
                  </td>
                  <td className="p-4 border-b border-zinc-800 text-center">
                    <button 
                        onClick={togglePremium}
                        className={`flex items-center gap-2 px-4 py-2 mx-auto rounded-lg text-xs font-bold transition-colors border ${
                            isPremium 
                            ? 'bg-orange-600 text-white border-orange-500 hover:bg-orange-700 shadow-lg shadow-orange-900/50' 
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-500'
                        }`}
                    >
                        {isPremium ? <Check size={14} /> : <Lock size={14} />}
                        {isPremium ? 'Viral Ativado' : 'Ativar Viral'}
                    </button>
                    <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest hidden md:block">
                        {isPremium ? 'Recurso Liberado' : 'Recurso Bloqueado'}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
