import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc, getDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MENU_ITEMS, TRADITIONAL_BURGERS, CATEGORIES } from '../constants';
import { MenuItem } from '../types';
import { LogOut, Plus, Edit2, Save, Trash2, Check, X, RefreshCw, QrCode, Download, Star, Bell, Lock, Send, Smartphone, Flame, Shield, ChefHat, Sparkles, Copy, MessageCircle, AlertCircle, Info, Share2, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateMarketingPost } from '../services/geminiService';

// Helper to normalize image URLs for WhatsApp compatibility
const normalizeImageUrl = (url: string): string => {
  if (!url) return "";
  let normalized = url.trim();

  // 1. Force HTTPS
  if (normalized.startsWith("http://")) {
    normalized = normalized.replace("http://", "https://");
  }

  // 2. Resolve relative paths to absolute
  if (normalized.startsWith("/")) {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    normalized = `${baseUrl}${normalized}`;
  }

  return normalized;
};

export default function AdminPanel() {
  const [user, loading, error] = useAuthState(auth);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'marketing' | 'orders'>('orders');
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  
  // Marketing AI State
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [generatedPost, setGeneratedPost] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [isPremium, setIsPremium] = useState(false); 

  const isAgencyOwner = user?.email === 'marketingjan@gmail.com';

  const fetchItems = async () => {
    setIsLoadingItems(true);
    try {
      const snapshot = await getDocs(collection(db, 'menu'));
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      setItems(fetched.sort((a, b) => a.category.localeCompare(b.category)));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'store'));
      if (snap.exists()) {
        const data = snap.data();
        if (data.isPremium !== undefined) {
          setIsPremium(data.isPremium);
        }
        if (data.isStoreOpen !== undefined) {
          setIsStoreOpen(data.isStoreOpen);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStoreOpen = async () => {
    const newValue = !isStoreOpen;
    setIsStoreOpen(newValue);
    try {
      await setDoc(doc(db, 'settings', 'store'), { isStoreOpen: newValue }, { merge: true });
    } catch (e) {
      console.error("Erro ao atualizar status da loja", e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchItems();
      fetchSettings();
      
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        const fetchedOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setOrders(fetchedOrders);
      });
      
      return () => unsub();
    }
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    }
  };

  const syncInitialData = async () => {
    try {
      const allItems = [...MENU_ITEMS, ...TRADITIONAL_BURGERS];
      for (const item of allItems) {
        await setDoc(doc(collection(db, 'menu'), item.id), item);
      }
      alert('Sincronização concluída!');
      fetchItems();
    } catch (e) {
      console.error(e);
      alert('Erro ao sincronizar, você tem permissão de Admin?');
    }
  };

  const handleUpdate = async (item: MenuItem) => {
    try {
      await updateDoc(doc(db, 'menu', item.id), { ...item });
      alert('Salvo!');
      // Atualiza o estado local imediatamente para refletir na tela
      setItems(prev => prev.map(i => i.id === item.id ? item : i));
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar');
    }
  };

  const handleCreate = async () => {
    const id = 'new_item_' + Date.now();
    const newItem: MenuItem = {
      id,
      name: 'Novo Item',
      description: '',
      price: 0,
      category: CATEGORIES[0],
      image: '',
      available: false, // Cria como indisponível para o cliente não ver
    };
    try {
      await setDoc(doc(db, 'menu', id), newItem);
      // Ao invés de buscar tudo e embaralhar, joga no topo da tela!
      setItems(prev => [newItem, ...prev]);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Sobe a tela suavemente
      alert('Produto criado! Veja no topo da lista e clique em Editar.');
    } catch (e) {
      console.error(e);
      alert('Erro ao criar produto. Sua sessão pode ter expirado.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este item?')) return;
    try {
      await deleteDoc(doc(db, 'menu', id));
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-800 p-8 rounded-xl text-center shadow-xl">
          <h2 className="text-2xl font-bold text-orange-500 mb-6">Acesso Restrito</h2>
          <p className="text-zinc-400 mb-8">Faça login com sua conta do Google para acessar o painel de administração.</p>
          <button 
            onClick={handleLogin}
            className="w-full bg-white text-black font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-3 hover:bg-zinc-200 transition-colors"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <header className="bg-zinc-950 p-4 sticky top-0 z-50 shadow-lg border-b border-zinc-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold text-orange-500">Painel do Delivery</h1>
              <p className="text-sm text-zinc-400">{user.email}</p>
            </div>
            
            {/* Chave de Status Aberto/Fechado */}
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 py-2 px-4 rounded-xl">
              <span className={`text-sm font-bold uppercase tracking-widest ${isStoreOpen ? 'text-green-500' : 'text-red-500'}`}>
                {isStoreOpen ? 'Loja Aberta' : 'Loja Fechada'}
              </span>
              <button 
                onClick={handleToggleStoreOpen}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isStoreOpen ? 'bg-green-500' : 'bg-zinc-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isStoreOpen ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-red-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Cozinha <ChefHat size={16} />
            </button>
            <button 
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'menu' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Cardápio
            </button>
            <button 
              onClick={() => setActiveTab('marketing')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'marketing' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Marketing IA <Sparkles size={14} className="text-orange-500" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {isAgencyOwner && (
                <Link 
                  to="/agency"
                  title="Painel Master da Agência"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" /> [AGÊNCIA] Master
                </Link>
            )}
            <button 
              onClick={syncInitialData}
              title="Importar produtos do código para o banco de dados (Apenas na 1a vez)"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Importar
            </button>
            <button 
              onClick={() => signOut(auth)}
              className="px-4 py-2 hover:bg-red-500/10 text-red-500 rounded-lg text-sm flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 py-8">
        
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><ChefHat className="text-orange-500" /> Cozinha (Pedidos em Tempo Real)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.length === 0 ? (
                <div className="col-span-full text-center py-20 text-zinc-500 font-medium">Nenhum pedido recebido ainda.</div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-white">#{order.id.slice(0, 6).toUpperCase()}</h3>
                        <p className="text-sm text-zinc-400 font-medium">{new Date(order.createdAt).toLocaleTimeString()} - Cliente: <span className="text-white font-bold">{order.customerName}</span></p>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${order.status === 'pendente' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/20' : order.status === 'preparando' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/20' : 'bg-green-500/20 text-green-500 border border-green-500/20'}`}>
                        {order.status}
                      </span>
                    </div>
                    
                    <div className="flex-1 bg-zinc-900 rounded-xl p-4 mb-4 border border-zinc-700/50">
                      <ul className="space-y-3">
                        {order.items?.map((item: any, idx: number) => (
                          <li key={idx} className="flex justify-between items-start border-b border-zinc-800/50 pb-2 last:border-0 last:pb-0">
                            <div>
                              <span className="font-black text-red-500 mr-2">{item.quantity}x</span>
                              <span className="text-sm text-white font-bold">{item.name}</span>
                              {item.variation && <div className="text-[11px] text-zinc-500 ml-6 uppercase">{item.variation}</div>}
                            </div>
                            <span className="text-xs font-bold text-zinc-400">R$ {(item.price * item.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Forma Pgto</p>
                        <p className="text-sm font-bold text-white">{order.paymentMethod}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Total</p>
                        <p className="text-lg font-black text-green-500">R$ {order.total?.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    {order.status === 'pendente' && (
                      <button 
                        onClick={() => updateDoc(doc(db, 'orders', order.id), { status: 'preparando' })}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 active:scale-95 transition-all"
                      >
                        <ChefHat size={18} /> Mudar para 'Preparando'
                      </button>
                    )}
                    {order.status === 'preparando' && (
                      <button 
                        onClick={() => updateDoc(doc(db, 'orders', order.id), { status: 'concluido' })}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 active:scale-95 transition-all"
                      >
                        <Check size={18} /> Marcar como 'Pronto'
                      </button>
                    )}
                    {order.status === 'concluido' && (
                      <button 
                        onClick={() => deleteDoc(doc(db, 'orders', order.id))}
                        className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 active:scale-95 transition-all outline-dashed outline-2 outline-offset-2 outline-zinc-600"
                      >
                        <Trash2 size={18} /> Arquivar Pedido
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold">Gestão do Cardápio</h2>
              <button 
                onClick={handleCreate}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> Novo Produto
              </button>
            </div>

            {isLoadingItems ? (
              <div className="text-center py-20 text-zinc-400">Carregando cardápio...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
                {items.map(item => (
                  <ProductCard key={item.id} item={item} onUpdate={handleUpdate} onDelete={() => handleDelete(item.id)} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'marketing' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="mb-0 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  Criador Viral IA 
                  <span className="bg-orange-500/20 text-orange-500 text-[10px] px-2 py-0.5 rounded-full border border-orange-500/30 uppercase font-black tracking-widest">Experimental Beta</span>
                </h2>
                <p className="text-zinc-400 mt-1">Gere posts irresistíveis com Inteligência Artificial.</p>
              </div>
              <div className="hidden md:block text-right">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter block">Status do Recurso</span>
                <span className="text-xs text-green-500 font-black">BÔNUS GRATUITO ATIVO</span>
              </div>
            </div>

            {/* Legal Disclaimer / Protection Block */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-[11px] text-zinc-500 leading-relaxed">
              <p className="font-bold text-zinc-400 mb-1 uppercase tracking-tight flex items-center gap-1.5">
                <Info size={14} className="text-orange-500" /> 
                Termos de Uso do Gerador de Conteúdo
              </p>
              Este é um recurso robusto integrado via servidor que utiliza Inteligência Artificial. 
              As chaves de API estão protegidas e a segurança é garantida.
              O sucesso do "Preview de Imagem" depende do processamento de links pelo WhatsApp (Open Graph), ferramenta esta externa ao nosso sistema.
            </div>

            {/* AI Config Section */}
            <div className="bg-zinc-800 border border-zinc-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl pointer-events-none" />
               <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                       <Lock size={18} className="text-orange-500" /> 
                       IA de Marketing Ativa
                    </h3>
                    <p className="text-sm text-zinc-400">
                      O gerador de posts virais está configurado e protegido via servidor. 
                      Você não precisa mais colar sua chave aqui. Basta escolher um produto e gerar! 🚀
                    </p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Product Selection */}
              <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 shadow-xl">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <ChefHat size={18} className="text-zinc-400" /> 
                  1. Escolha o Produto
                </h3>
                <div className="space-y-4">
                  <select 
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="">Selecione um item do cardápio...</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name} - R$ {item.price}</option>
                    ))}
                  </select>

                  {selectedProductId && (
                    <div className="p-3 bg-zinc-950 border border-zinc-700 rounded-xl">
                      <p className="text-[10px] text-zinc-500 font-black uppercase mb-1 flex items-center gap-2">
                        <Share2 size={10} /> Link do Produto (Pronto para Uso)
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-orange-500 flex-1 truncate">{window.location.origin}/share/{selectedProductId}</code>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/share/${selectedProductId}`);
                            alert('Link do produto copiado!');
                          }}
                          className="bg-zinc-800 p-2 rounded-lg hover:bg-zinc-700 text-zinc-300 transition-colors"
                          title="Copiar Link"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={async () => {
                      const product = items.find(i => i.id === selectedProductId);
                      if (!product) {
                        alert('Selecione um produto primeiro!');
                        return;
                      }
                      setIsGenerating(true);
                      try {
                        const post = await generateMarketingPost({
                          id: product.id,
                          name: product.name,
                          description: product.description,
                          price: product.priceText || `R$ ${product.price.toFixed(2)}`,
                          category: product.category
                        });
                        setGeneratedPost(post || '');
                      } catch (err: any) {
                        console.error('IA Error:', err);
                        alert(`Erro: ${err.message || err}`);
                      } finally {
                        setIsGenerating(false);
                      }
                    }}
                    disabled={!selectedProductId || isGenerating}
                    className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw size={20} className="animate-spin" /> Gerando Magia...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} /> Gerar Post Viral
                      </>
                    )}
                  </button>
                  
                  <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                    <p className="text-xs text-orange-400 leading-relaxed font-medium">
                      <AlertCircle size={14} className="inline mr-1 mb-0.5" />
                      A IA lerá os ingredientes e o preço do produto para criar um texto altamente persuasivo focado em vendas rápidas no WhatsApp.
                    </p>
                  </div>
                </div>
              </div>

              {/* Generated Content */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative min-h-[300px] flex flex-col">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800">
                  <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-500">Preview do Post</h3>
                  <div className="flex gap-2">
                    {generatedPost && (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(generatedPost);
                          alert('Texto copiado! Agora é só colar no WhatsApp.');
                        }}
                        className="text-xs flex items-center gap-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 px-3 py-1.5 rounded-lg transition-colors border border-green-500/20"
                      >
                        <Copy size={14} /> Copiar
                      </button>
                    )}
                  </div>
                </div>

                {/* Image Mockup for Marketing */}
                {(generatedPost || selectedProductId) && (
                  <div className="mb-4 relative rounded-xl overflow-hidden aspect-video group border border-zinc-800 shadow-2xl bg-zinc-900">
                     <img 
                       src={items.find(i => i.id === selectedProductId)?.image || "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=1000"}
                       alt="Marketing Mockup"
                       className="w-full h-full object-cover brightness-90 group-hover:scale-105 transition-transform duration-700"
                       referrerPolicy="no-referrer"
                       onError={(e) => {
                         (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1000";
                       }}
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-5">
                        <div className="bg-orange-600 w-fit px-2 py-0.5 rounded text-[10px] font-black mb-1 uppercase tracking-tighter shadow-lg">PREVIEW SUGESTÃO</div>
                        <h4 className="text-white font-black text-xl leading-tight uppercase italic drop-shadow-md">
                          {items.find(i => i.id === selectedProductId)?.name || 'Delícia do Dia'}
                        </h4>
                        <p className="text-zinc-300 text-[10px] font-bold">Dica: O link abaixo ativará a prévia automática no WhatsApp!</p>
                     </div>
                  </div>
                )}

                <div className={`flex-1 whitespace-pre-wrap text-sm font-medium leading-relaxed font-sans p-5 rounded-xl border shadow-inner ${generatedPost.startsWith('⚠️') ? 'bg-red-500/5 border-red-500/20 text-red-200' : 'bg-zinc-950 border-zinc-800 text-zinc-200'}`}>
                  {generatedPost || (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 italic">
                      <MessageCircle size={40} className="mb-4 opacity-20" />
                      {selectedProductId ? "O link de compartilhamento já está pronto! Clique em 'Gerar Post Viral' para criar um texto incrível." : "O post gerado aparecerá aqui..."}
                    </div>
                  )}
                </div>

                {selectedProductId && (
                  <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => {
                          const product = items.find(i => i.id === selectedProductId);
                          const isError = generatedPost.startsWith('⚠️');
                          const textToCopy = isError || !generatedPost 
                            ? `🍔 *${product?.name || 'Delícia do Dia'}*\n\nConfira nosso cardápio e faça seu pedido pelo link:\n\n${window.location.origin}/share/${selectedProductId}`
                            : generatedPost;
                            
                          navigator.clipboard.writeText(textToCopy);
                          alert('Texto copiado!');
                        }}
                        className="bg-zinc-100 hover:bg-white text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 px-2"
                      >
                        <Copy size={20} /> Copiar Texto
                      </button>

                      <button 
                        onClick={() => {
                          const product = items.find(i => i.id === selectedProductId);
                          const isError = generatedPost.startsWith('⚠️');
                          const textToShare = isError || !generatedPost 
                            ? `🍔 *${product?.name || 'Delícia do Dia'}*\n\nConfira nosso cardápio e faça seu pedido pelo link:\n\n${window.location.origin}/share/${selectedProductId}`
                            : generatedPost;

                          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`, '_blank');
                        }}
                        className="bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 px-2"
                      >
                        <MessageCircle size={20} /> Direto p/ Zap
                      </button>
                    </div>
                    
                    <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg">
                      <p className="text-[10px] text-orange-400 text-center font-bold uppercase tracking-wider">
                         Importante: O WhatsApp não permite enviar a FOTO e o TEXTO juntos por link. 
                         Envie o texto, e o link de compartilhamento puxará a foto automaticamente!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Seção de Marketing Local (SEO / GMB) -> Manter no fim, global */}
        <div className="bg-zinc-800 rounded-2xl p-6 md:p-10 border border-zinc-700/50 mt-16 mb-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-500/20 text-yellow-500 rounded-xl flex items-center justify-center">
                      <Star size={24} />
                    </div>
                    <h2 className="text-2xl font-bold">Kit de Marketing Local</h2>
                  </div>
                  <p className="text-zinc-400 mb-6 max-w-lg">
                    Acelere suas avaliações no <strong>Google Meu Negócio</strong>. Use este QR Code nas mesas físicas do Pit Dog ou imprima para colocar nas sacolas de Delivery. Clientes satisfeitos avaliando aumentam suas vendas!
                  </p>
                  
                  <div className="flex gap-4">
                    <a 
                      href="https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=https://g.page/r/CTufWNHrYHk6EAE/review" 
                      download="tri-burgers-qr-code.png"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white text-black px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors"
                    >
                      <Download size={18} /> Baixar QR Code (Alta Qualidade)
                    </a>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-2xl shrink-0">
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://g.page/r/CTufWNHrYHk6EAE/review" 
                    alt="QR Code de Avaliação"
                    className="w-48 h-48 rounded-lg"
                  />
                  <p className="text-black text-center text-xs font-bold mt-3 uppercase tracking-widest">Avalie-nos no Google</p>
                </div>
              </div>
            </div>
      </main>
    </div>
  );
}

interface ProductCardProps {
  item: MenuItem;
  onUpdate: (i: MenuItem) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  key?: React.Key;
}

function ProductCard({ item, onUpdate, onDelete }: ProductCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item);
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = () => {
    const updatedItem = {
      ...draft,
      price: Number(draft.price),
      image: normalizeImageUrl(draft.image || "")
    };
    
    onUpdate(updatedItem);
    setEditing(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      alert("Por favor, envie apenas imagens JPG ou PNG. O WhatsApp pode não exibir WebP corretamente.");
      return;
    }

    if (!storage) {
      alert("Firebase Storage não está configurado.");
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `products/${item.id}_${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setDraft(prev => ({ ...prev, image: downloadURL }));
    } catch (err) {
      console.error("Upload error:", err);
      alert("Erro ao enviar imagem. Verifique suas permissões.");
    } finally {
      setIsUploading(false);
    }
  };

  const isWebp = draft.image?.toLowerCase().includes(".webp");
  const isNotHttps = draft.image && !draft.image.startsWith("https://");
  const isRelative = draft.image?.startsWith("/");

  return (
    <div className="bg-zinc-800 rounded-xl overflow-hidden shadow border border-zinc-700/50">
      <div className="p-4 flex flex-col gap-3">
        {editing ? (
          <>
            <div className="flex gap-4 mb-2 p-2 bg-zinc-900/50 rounded border border-zinc-700/50">
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={draft.available !== false} 
                  onChange={e => setDraft({...draft, available: e.target.checked})} 
                  className="accent-green-500 w-4 h-4 cursor-pointer" 
                />
                Em Estoque
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={!!draft.highlight} 
                  onChange={e => setDraft({...draft, highlight: e.target.checked})} 
                  className="accent-red-600 w-4 h-4 cursor-pointer" 
                />
                Destaque POP
              </label>
            </div>

            <div>
              <label className="text-xs text-zinc-400">Nome do Produto</label>
              <input 
                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:border-red-500 focus:outline-none" 
                value={draft.name} onChange={e => setDraft({...draft, name: e.target.value})} 
              />
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-zinc-400">Preço Base (R$)</label>
                <input 
                  type="number" step="0.01" 
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:border-red-500 focus:outline-none" 
                  value={draft.price} 
                  onChange={e => {
                    const newPrice = Number(e.target.value);
                    setDraft({...draft, price: newPrice});
                  }} 
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-zinc-400">Categoria</label>
                <select 
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:border-red-500 focus:outline-none"
                  value={draft.category} onChange={e => setDraft({...draft, category: e.target.value})}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {draft.meatOptions && (
              <div className="mt-2 bg-zinc-900/50 p-3 rounded border border-zinc-700">
                <label className="text-xs text-orange-400 font-bold mb-2 block">Opções de Carne (Sanduíches Tradicionais)</label>
                <div className="space-y-2">
                  {draft.meatOptions.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input className="w-2/3 bg-zinc-900 border border-zinc-700 rounded p-2 text-xs text-zinc-400" value={opt.name} disabled title={opt.name} />
                      <input 
                         type="number" step="0.01"
                         className="w-1/3 bg-zinc-900 border border-red-900 rounded p-2 text-xs text-white"
                         value={opt.price} 
                         onChange={e => {
                           const newOptions = [...draft.meatOptions!];
                           newOptions[i].price = Number(e.target.value);
                           if (i === 0) {
                             setDraft({...draft, meatOptions: newOptions, price: newOptions[0].price, priceText: `A partir de R$ ${newOptions[0].price.toFixed(2)}`});
                           } else {
                             setDraft({...draft, meatOptions: newOptions});
                           }
                         }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!draft.meatOptions && (
              <div>
                <label className="text-xs text-zinc-400">Texto de Preço Alternativo</label>
                <input 
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white" 
                  placeholder='ex: "Consulte" ou "A partir de R$ 10"'
                  value={draft.priceText || ''} onChange={e => setDraft({...draft, priceText: e.target.value})} 
                />
              </div>
            )}

            <div>
              <label className="text-xs text-zinc-400">Descrição/Ingredientes</label>
              <textarea 
                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white h-20 focus:border-red-500 focus:outline-none" 
                value={draft.description} onChange={e => setDraft({...draft, description: e.target.value})}
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400">Imagem do Produto</label>
                {draft.image && (
                  <div className="w-12 h-12 rounded border border-zinc-700 overflow-hidden bg-black">
                    <img src={draft.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Upload Section */}
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-lg p-2 hover:border-orange-500 transition-colors bg-zinc-900/30">
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/jpeg,image/png" disabled={isUploading} />
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-zinc-500">
                      <Upload size={14} /> Enviar Imagem
                    </div>
                  )}
                </label>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-black mb-1 block">URL Manual</label>
                <input 
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:border-red-500 focus:outline-none" 
                  placeholder="https://site.com/foto.jpg"
                  value={draft.image || ''} 
                  onChange={e => setDraft({...draft, image: e.target.value})} 
                  onBlur={e => setDraft({...draft, image: normalizeImageUrl(e.target.value)})}
                />
              </div>

              {/* Warnings */}
              <div className="space-y-1">
                {isWebp && (
                  <div className="flex items-center gap-1.5 text-[10px] text-yellow-500 font-bold bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                    <AlertCircle size={12} /> WebP pode não aparecer no WhatsApp. Use JPG ou PNG.
                  </div>
                )}
                <div className="text-[10px] text-blue-400 font-bold bg-blue-500/5 p-2 rounded border border-blue-500/10 italic">
                   Dica: Para aparecer corretamente no WhatsApp, use imagem JPG ou PNG com URL pública HTTPS.
                </div>
                {isNotHttps && draft.image && (
                  <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-bold bg-red-500/10 p-2 rounded border border-red-500/20">
                    <Info size={12} /> A URL deve ser HTTPS segura.
                  </div>
                )}
                {isRelative && (
                  <div className="flex items-center gap-1.5 text-[10px] text-orange-400 font-bold bg-orange-500/10 p-2 rounded border border-orange-500/20">
                    <Info size={12} /> Esta imagem é local. Ela será convertida para URL absoluta ao salvar.
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-zinc-700">
              <button 
                onClick={() => setEditing(false)} 
                className="py-3 bg-zinc-700 rounded-xl hover:bg-zinc-600 font-bold flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button 
                onClick={handleSave} 
                className="py-3 bg-green-600 rounded-xl hover:bg-green-500 font-bold flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Salvar Produto
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700 flex-shrink-0">
                <img 
                  src={item.image || "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=200"} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1000";
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] text-orange-500 font-black uppercase px-2 py-0.5 bg-orange-500/10 rounded border border-orange-500/10">
                        {item.category}
                      </span>
                      {item.highlight && (
                        <span className="text-[10px] uppercase font-bold tracking-widest bg-red-600 text-white px-2 py-0.5 rounded shadow-sm">
                          POP
                        </span>
                      )}
                      {item.available === false && (
                        <span className="text-[10px] uppercase font-bold tracking-widest bg-zinc-700 text-zinc-400 px-2 py-0.5 rounded border border-zinc-600">
                          OFF
                        </span>
                      )}
                    </div>
                    <h3 className={`font-bold text-base truncate ${item.available === false ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
                      {item.name}
                    </h3>
                    <p className="text-green-500 font-black text-sm">
                      {item.priceText ? item.priceText : `R$ ${Number(item.price).toFixed(2).replace('.', ',')}`}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => setEditing(true)} className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={onDelete} className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-600 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-2 flex items-center justify-between">
               {item.description && (
                <p className="text-xs text-zinc-400 line-clamp-1 italic">{item.description}</p>
              )}
              <button 
                  onClick={() => {
                    const shareLink = `${window.location.origin}/share/${item.id}`;
                    navigator.clipboard.writeText(shareLink);
                    alert('Link de compartilhamento copiado!');
                  }}
                  title="Copiar Link (WhatsApp)"
                  className="flex items-center gap-1.5 text-xs text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 hover:bg-green-500/20 transition-colors ml-auto"
                >
                  <Share2 className="w-3.5 h-3.5" /> <span className="font-bold">WhatsApp</span>
                </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
