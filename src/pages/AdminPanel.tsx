import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc, getDoc, onSnapshot, query, orderBy, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MENU_ITEMS, TRADITIONAL_BURGERS, CATEGORIES, INITIAL_ADDONS } from '../constants';
import { MenuItem, Addon } from '../types';
import { DEFAULT_SITE_IMAGES, SiteImages } from '../contexts/CartContext';
import { LogOut, Plus, Edit2, Save, Trash2, Check, X, RefreshCw, QrCode, Download, Star, Bell, Lock, Send, Smartphone, Flame, Shield, ChefHat, Sparkles, Copy, MessageCircle, AlertCircle, Info, Share2, Image as ImageIcon, Upload, Loader2, Key } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { generateMarketingPost } from '../services/geminiService';
import { processImage } from '../lib/imageUtils';

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
  const [activeTab, setActiveTab] = useState<'menu' | 'marketing' | 'orders' | 'siteImages'>('orders');
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [siteImages, setSiteImages] = useState<SiteImages>(DEFAULT_SITE_IMAGES);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [isSavingSiteImages, setIsSavingSiteImages] = useState(false);

  // Add-ons Management State
  const [addons, setAddons] = useState<Addon[]>([]);
  const [isLoadingAddons, setIsLoadingAddons] = useState(true);
  const [menuSubTab, setMenuSubTab] = useState<'products' | 'addons'>('products');
  const [isImportingAddons, setIsImportingAddons] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Partial<Addon> | null>(null);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [isUploadingAddonImage, setIsUploadingAddonImage] = useState(false);

  // ADDON_IMAGE_UPLOAD_PARITY_2026_08_05
  const handleAddonCloudinaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      input.value = '';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isAllowedExtension = ['jpg', 'jpeg', 'png'].includes(fileExtension || '');

    if (!allowedTypes.includes(file.type) || !isAllowedExtension) {
      toast.error("Erro: Apenas imagens JPG ou PNG são permitidas.");
      input.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Erro: A imagem deve ter no máximo 2 MB.");
      input.value = '';
      return;
    }

    setIsUploadingAddonImage(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMsg = `HTTP Error ${response.status}`;

        if (errorBody) {
          try {
            const parsedError = JSON.parse(errorBody);
            errorMsg = parsedError?.error || parsedError?.message || errorBody;
          } catch {
            errorMsg = errorBody;
          }
        }

        throw new Error(errorMsg);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        console.error("[CLOUDINARY ADDON] Resposta não-JSON:", errorText);
        throw new Error("O servidor retornou uma resposta inválida.");
      }

      const data = await response.json();

      if (data.success && data.imageUrl) {
        setEditingAddon(prev =>
          prev ? { ...prev, image: data.imageUrl } : prev
        );
        toast.success("Imagem enviada ao Cloudinary com sucesso!");
      } else {
        throw new Error(data.error || "Erro desconhecido no servidor.");
      }
    } catch (err: any) {
      console.error("[CLOUDINARY ADDON] ERRO:", err);
      toast.error(`Não foi possível enviar a imagem: ${err.message || ""}`);
    } finally {
      setIsUploadingAddonImage(false);
      input.value = '';
    }
  };
  
  // Marketing AI State
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [generatedPost, setGeneratedPost] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [isPremium, setIsPremium] = useState(false); 
  
  // Per-client Gemini Key State
  const [geminiKey, setGeminiKey] = useState('');
  const [isGeminiConfigured, setIsGeminiConfigured] = useState(false);
  const [configSource, setConfigSource] = useState<'none' | 'database' | 'environment'>('none');
  const [decryptionFailed, setDecryptionFailed] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);

  const checkGeminiStatus = async () => {
    try {
      const resp = await fetch('/api/settings/status');
      const data = await resp.json();
      setIsGeminiConfigured(data.isConfigured);
      setConfigSource(data.type || 'none');
      setDecryptionFailed(!!data.decryptionFailed);
    } catch (err) {
      console.error("Status check error:", err);
    }
  };

  const handleSaveGeminiKey = async () => {
    if (!geminiKey.trim()) return;
    setIsSavingKey(true);
    try {
      const resp = await fetch('/api/settings/gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: geminiKey.trim() })
      });
      const data = await resp.json();
      if (data.success) {
        toast.success("Chave configurada e salva com sucesso!");
        setGeminiKey('');
        checkGeminiStatus();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(`Falha: ${err.message || 'Erro ao salvar chave'}`);
    } finally {
      setIsSavingKey(false);
    }
  };

  const userEmail = user?.email?.toLowerCase().trim() || '';
  const isAgencyOwner = userEmail === 'marketingjan@gmail.com';
  const isClientOperator = userEmail === 'triburgershamburgueria@gmail.com';

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

  const handleToggleStoreOpen = async () => {
    const newValue = !isStoreOpen;
    setIsStoreOpen(newValue);
    try {
      await setDoc(doc(db, 'settings', 'store'), { isStoreOpen: newValue }, { merge: true });
      toast.success(newValue ? "Loja aberta no sistema!" : "Loja fechada no sistema!");
    } catch (e: any) {
      console.error("Erro ao atualizar status da loja", e);
      setIsStoreOpen(!newValue); // Reverte o estado local em caso de falha no Firebase
      toast.error(`Erro ao salvar no Firebase: ${e?.message || 'Acesso negado ou erro de conexão'}`);
    }
  };

  useEffect(() => {
    if (user) {
      fetchItems();
      checkGeminiStatus();

      // Listener em tempo real do status e configurações da loja
      const unsubSettings = onSnapshot(doc(db, 'settings', 'store'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.isPremium !== undefined) setIsPremium(data.isPremium);
          if (data.isStoreOpen !== undefined) setIsStoreOpen(data.isStoreOpen);
          setSiteImages({
            heroImage: data.heroImage || DEFAULT_SITE_IMAGES.heroImage,
            craftImage: data.craftImage || DEFAULT_SITE_IMAGES.craftImage,
            menuCardImage: data.menuCardImage || DEFAULT_SITE_IMAGES.menuCardImage,
            physicalStoreImage: data.physicalStoreImage || DEFAULT_SITE_IMAGES.physicalStoreImage,
            aboutImage: data.aboutImage || DEFAULT_SITE_IMAGES.aboutImage,
          });
        }
      }, (err) => {
        console.error("Erro ao escutar settings/store:", err);
      });
      
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubOrders = onSnapshot(q, (snap) => {
        const fetchedOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setOrders(fetchedOrders);
      });

      const qAddons = query(collection(db, 'addons'), orderBy('order', 'asc'));
      const unsubAddons = onSnapshot(qAddons, (snap) => {
        const list: Addon[] = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as Addon);
        });
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setAddons(list);
        setIsLoadingAddons(false);
      }, (err) => {
        console.error("Erro ao escutar coleção 'addons':", err);
        setAddons([]);
        setIsLoadingAddons(false);
      });
      
      return () => {
        unsubSettings();
        unsubOrders();
        unsubAddons();
      };
    }
  }, [user]);

  // ADDONS_SEED_13_ITEMS_IDEMPOTENT_2026_08_03
  const handleImportInitialAddons = async () => {
    if (!isAgencyOwner) {
      toast.error('Apenas a agência (marketingjan@gmail.com) pode executar esta importação.');
      return;
    }
    if (!confirm('Deseja importar os 13 adicionais padrão para a coleção "addons"? Documentos já existentes não serão sobrescritos.')) {
      return;
    }
    setIsImportingAddons(true);
    let createdCount = 0;
    let existingCount = 0;
    let failedCount = 0;

    for (const item of INITIAL_ADDONS) {
      try {
        const docRef = doc(db, 'addons', item.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          existingCount++;
        } else {
          const now = new Date().toISOString();
          await setDoc(docRef, {
            ...item,
            createdAt: now,
            updatedAt: now,
          });
          createdCount++;
        }
      } catch (err) {
        console.error(`Erro ao importar adicional ${item.id}:`, err);
        failedCount++;
      }
    }

    setIsImportingAddons(false);
    toast.success(`Importação concluída: ${createdCount} criados, ${existingCount} já existentes, ${failedCount} falhas.`);
  };

  // PUBLIC_ADDONS_MEDIA_MIGRATION_2026_08_05
  const [isMigratingMedia, setIsMigratingMedia] = useState(false);

  const handleMigrateLegacyAddonMedia = async () => {
    if (!isAgencyOwner) {
      toast.error('Apenas a agência (marketingjan@gmail.com) pode executar esta migração.');
      return;
    }

    if (!confirm('Deseja preencher as imagens e descrições dos 13 adicionais a partir dos 7 itens legados do cardápio? Campos customizados existentes não serão sobrescritos.')) {
      return;
    }

    setIsMigratingMedia(true);

    const mapping: Record<string, string> = {
      add1: 'add1',  // Hambúrguer de Costela
      add2: 'add1',  // Hambúrguer de Picanha
      add3: 'add2',  // Filé Mignon
      add4: 'add2',  // Picanha
      add5: 'add3',  // Filé de Frango
      add6: 'add4',  // Hambúrguer
      add7: 'add5',  // Presunto
      add8: 'add5',  // Salsicha
      add9: 'add5',  // Ovo
      add10: 'add6', // Queijo
      add11: 'add6', // Bacon
      add12: 'add7', // Catupiry
      add13: 'add7', // Cheddar
    };

    let updatedCount = 0;
    let alreadyConfiguredCount = 0;
    let missingLegacyCount = 0;
    let failedCount = 0;

    try {
      const legacyDocsMap: Record<string, Partial<MenuItem>> = {};
      for (const legacyId of ['add1', 'add2', 'add3', 'add4', 'add5', 'add6', 'add7']) {
        try {
          const legacyRef = doc(db, 'menu', legacyId);
          const legacySnap = await getDoc(legacyRef);
          if (legacySnap.exists()) {
            legacyDocsMap[legacyId] = legacySnap.data() as MenuItem;
          }
        } catch (e) {
          console.error(`Erro ao buscar documento menu/${legacyId}:`, e);
        }
      }

      for (let i = 1; i <= 13; i++) {
        const addonId = `add${i}`;
        const legacyId = mapping[addonId];
        const legacyData = legacyDocsMap[legacyId];

        if (!legacyData) {
          missingLegacyCount++;
          continue;
        }

        try {
          const addonRef = doc(db, 'addons', addonId);
          const addonSnap = await getDoc(addonRef);

          if (!addonSnap.exists()) {
            console.error(`Documento de adicional ${addonId} não existe em addons/. Impossível migrar mídias.`);
            failedCount++;
            continue;
          }

          const currentData: any = addonSnap.data() || {};

          const hasImage = Boolean(currentData.image && String(currentData.image).trim() !== '');
          const hasDesc = Boolean(currentData.description && String(currentData.description).trim() !== '');

          const updatePayload: any = {
            updatedAt: new Date().toISOString(),
            publicVisible: true,
          };

          let needsUpdate = false;

          if (!hasImage && legacyData.image) {
            updatePayload.image = legacyData.image;
            needsUpdate = true;
          }

          if (!hasDesc && legacyData.description) {
            updatePayload.description = legacyData.description;
            needsUpdate = true;
          }

          if (currentData.publicVisible !== true) {
            updatePayload.publicVisible = true;
            needsUpdate = true;
          }

          if (needsUpdate) {
            await setDoc(addonRef, updatePayload, { merge: true });
            updatedCount++;
          } else {
            alreadyConfiguredCount++;
          }
        } catch (err) {
          console.error(`Erro ao atualizar mídias do adicional ${addonId}:`, err);
          failedCount++;
        }
      }

      toast.success(
        `Migração de Mídias Concluída!\n• Atualizados: ${updatedCount}\n• Já configurados: ${alreadyConfiguredCount}\n• Fontes ausentes: ${missingLegacyCount}\n• Falhas: ${failedCount}`,
        { duration: 6000 }
      );
    } catch (globalErr: any) {
      console.error('Erro na migração de mídias dos adicionais:', globalErr);
      toast.error('Erro ao executar migração: ' + (globalErr?.message || 'Erro desconhecido'));
    } finally {
      setIsMigratingMedia(false);
    }
  };

  const handleSaveAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddon) return;

    const name = editingAddon.name?.trim();
    if (!name) {
      toast.error('O nome do adicional não pode estar vazio.');
      return;
    }

    const price = Number(editingAddon.price);
    if (isNaN(price) || price < 0) {
      toast.error('O preço deve ser um valor numérico válido maior ou igual a zero.');
      return;
    }

    const order = Number(editingAddon.order ?? (addons.length + 1));
    if (isNaN(order)) {
      toast.error('A ordem de exibição deve ser um número válido.');
      return;
    }

    const image = editingAddon.image?.trim() || '';
    if (image) {
      try {
        const parsedUrl = new URL(image);
        if (parsedUrl.protocol !== 'https:') {
          toast.error('A imagem deve usar uma URL HTTPS válida.');
          return;
        }
      } catch {
        toast.error('A imagem deve usar uma URL HTTPS válida.');
        return;
      }
    }

    const id = editingAddon.id || ('add_' + Date.now());
    const now = new Date().toISOString();

    try {
      const docRef = doc(db, 'addons', id);
      const isNew = !editingAddon.id;

      const payload: any = {
        id,
        name,
        price,
        available: editingAddon.available ?? true,
        order,
        image,
        description: editingAddon.description ? editingAddon.description.trim() : '',
        publicVisible: editingAddon.publicVisible ?? false,
        updatedAt: now,
      };
      if (isNew) {
        payload.createdAt = now;
      }

      await setDoc(docRef, payload, { merge: true });
      toast.success(`Adicional "${name}" salvo com sucesso!`);
      setIsAddonModalOpen(false);
      setEditingAddon(null);
    } catch (err: any) {
      console.error('Erro ao salvar adicional:', err);
      toast.error('Erro ao salvar adicional: ' + (err?.message || 'Sem permissão'));
    }
  };

  const handleToggleAddonAvailable = async (addon: Addon) => {
    try {
      const docRef = doc(db, 'addons', addon.id);
      const now = new Date().toISOString();
      await updateDoc(docRef, {
        available: !addon.available,
        updatedAt: now,
      });
      toast.success(`Disponibilidade de "${addon.name}" alterada para ${!addon.available ? 'Disponível' : 'Indisponível'}.`);
    } catch (err: any) {
      console.error('Erro ao atualizar disponibilidade do adicional:', err);
      toast.error('Erro ao atualizar adicional: ' + (err?.message || 'Sem permissão'));
    }
  };

  const handleDeleteAddon = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o adicional "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'addons', id));
      toast.success(`Adicional "${name}" excluído com sucesso.`);
    } catch (err: any) {
      console.error('Erro ao excluir adicional:', err);
      toast.error('Erro ao excluir adicional: ' + (err?.message || 'Sem permissão'));
    }
  };

  useEffect(() => {
    if ((activeTab === 'marketing' || activeTab === 'siteImages') && !isAgencyOwner) {
      setActiveTab('orders');
    }
  }, [activeTab, isAgencyOwner]);

  const handleUploadSiteMedia = async (fieldKey: keyof SiteImages, file: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isAllowedExtension = ['jpg', 'jpeg', 'png'].includes(fileExtension || '');

    if (!allowedTypes.includes(file.type) && !isAllowedExtension) {
      toast.error("Erro: Apenas imagens JPG ou PNG são permitidas.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Erro: A imagem deve ter no máximo 2 MB.");
      return;
    }

    setUploadingField(fieldKey);

    // 1. Tentar upload via servidor (Cloudinary)
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data.success && data.imageUrl) {
            setSiteImages(prev => ({ ...prev, [fieldKey]: data.imageUrl }));
            toast.success("Imagem enviada ao Cloudinary com sucesso!");
            setUploadingField(null);
            return;
          }
        }
      }
    } catch (err) {
      console.warn("[SITE MEDIA] Servidor Cloudinary indisponível ou chaves ausentes. Usando Firebase Storage...", err);
    }

    // 2. Fallback automático para Firebase Storage (disponível por padrão no app)
    try {
      if (storage) {
        const processedBlob = await processImage(file, { maxWidth: 1920, quality: 0.85 });
        const storageRef = ref(storage, `site_media/${fieldKey}_${Date.now()}.jpg`);
        const snapshot = await uploadBytes(storageRef, processedBlob, { contentType: 'image/jpeg' });
        const downloadURL = await getDownloadURL(snapshot.ref);

        setSiteImages(prev => ({ ...prev, [fieldKey]: downloadURL }));
        toast.success("Imagem enviada com sucesso via Firebase Storage!");
        setUploadingField(null);
        return;
      }
    } catch (storageErr: any) {
      console.error("[SITE MEDIA] Erro no Firebase Storage:", storageErr);
    }

    toast.error("Não foi possível realizar o upload automático. Você também pode colar a URL direta da imagem (ex: Imgur, Cloudinary) no campo ao lado.");
    setUploadingField(null);
  };

  const handleSaveSiteImages = async () => {
    setIsSavingSiteImages(true);
    try {
      await setDoc(doc(db, 'settings', 'store'), siteImages, { merge: true });
      toast.success("Mídias do site atualizadas e salvas com sucesso no Firebase!");
    } catch (e: any) {
      console.error("Erro ao salvar mídias no Firebase:", e);
      toast.error(`Erro ao salvar no Firebase: ${e?.message || 'Erro de permissão'}`);
    } finally {
      setIsSavingSiteImages(false);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      console.error("Erro no login:", e);
      if (e?.code === 'auth/unauthorized-domain') {
        toast.error(`Domínio não autorizado no Firebase! Adicione "${window.location.hostname}" no Console do Firebase em Authentication -> Configurações -> Domínios Autorizados.`, { duration: 8000 });
        alert(`⚠️ ATENÇÃO: O domínio "${window.location.hostname}" ainda não está autorizado no Firebase Authentication.\n\nPara corrigir:\n1. Acesse o Console do Firebase (firebase.google.com)\n2. Vá em Authentication -> Configurações -> Domínios Autorizados\n3. Adicione o domínio: ${window.location.hostname}`);
      } else {
        toast.error(`Erro ao realizar login: ${e?.message || 'Tente novamente.'}`);
      }
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
      const updateData: any = {};
      
      // Copy all fields except those that are undefined to avoid Firestore errors
      Object.entries(item).forEach(([key, val]) => {
        if (val !== undefined) {
          updateData[key] = val;
        }
      });
      
      // Se não houver variações de preço, removemos explicitamente do Firestore
      if (!item.meatOptions || item.meatOptions.length === 0) {
        updateData.meatOptions = deleteField();
      }

      await updateDoc(doc(db, 'menu', item.id), updateData);
      alert('Salvo com sucesso!');

      // Cria um objeto de item local limpo (sem meatOptions caso tenha sido removida)
      const updatedLocalItem = { ...item };
      if (!item.meatOptions || item.meatOptions.length === 0) {
        delete updatedLocalItem.meatOptions;
      }

      // Atualiza o estado local imediatamente para refletir na tela
      setItems(prev => prev.map(i => i.id === item.id ? updatedLocalItem : i));
    } catch (err: any) {
      console.error('Erro ao salvar no Firestore:', err);
      alert('Erro ao salvar as alterações: ' + (err.message || 'Sem permissão'));
      throw err;
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

  const handleCreateWithCategory = async (categoryName: string) => {
    const id = 'add_' + Date.now();
    const newItem: MenuItem = {
      id,
      name: 'Novo Adicional',
      description: 'Adicional para os sanduíches',
      price: 5.00,
      category: categoryName,
      available: true,
    };
    try {
      await setDoc(doc(db, 'menu', id), newItem);
      setItems(prev => [newItem, ...prev]);
      setSelectedCategoryFilter(categoryName);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Adicional criado com sucesso! Edite os detalhes no topo da lista.');
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao criar adicional: ' + (e?.message || 'Sem permissão'));
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

  const allowedEmails = [
    'marketingjan@gmail.com',
    'triburgershamburgueria@gmail.com'
  ];

  if (user && !allowedEmails.includes(userEmail)) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-800 p-8 rounded-xl text-center shadow-xl">
          <h2 className="text-2xl font-bold text-red-500 mb-6">Acesso Não Autorizado</h2>
          <p className="text-zinc-500 mb-2 font-mono text-sm">Conectado como: {user.email}</p>
          <p className="text-zinc-400 mb-8">Este e-mail não possui permissão para acessar o painel de administração da Tri Burgers.</p>
          <button 
            onClick={() => signOut(auth)}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-colors"
          >
            Sair e Alternar Conta
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
              <h2 className="text-2xl font-bold text-orange-500">Painel do Delivery</h2>
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
          <div className="flex flex-wrap sm:flex-nowrap gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
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
            {/* PRODUCTION_PARITY_MEDIA_TAB_2026_08_03 */}
            {isAgencyOwner && (
              <button 
                onClick={() => setActiveTab('siteImages')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'siteImages' ? 'bg-red-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Mídia do Site <ImageIcon size={16} />
              </button>
            )}
            {isAgencyOwner && (
              <button 
                onClick={() => setActiveTab('marketing')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'marketing' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Marketing IA <Sparkles size={14} className="text-orange-500" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAgencyOwner && (
              <>
                <Link 
                  to="/agency"
                  title="Painel Master da Agência"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" /> [AGÊNCIA] Master
                </Link>
                <button 
                  onClick={syncInitialData}
                  title="Importar produtos do código para o banco de dados (Apenas na 1a vez)"
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Importar
                </button>
              </>
            )}
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
                    
                    {/* // ADDONS_KITCHEN_DISPLAY_2026_08_04 */}
                    <div className="flex-1 bg-zinc-900 rounded-xl p-4 mb-4 border border-zinc-700/50">
                      <ul className="space-y-3">
                        {(Array.isArray(order.items) ? order.items : []).map((item: any, idx: number) => {
                          const selectedAddons = Array.isArray(item.selectedAddons) ? item.selectedAddons : [];
                          const basePrice = Number(item.price) || 0;
                          const addonsSum = selectedAddons.reduce((sum: number, addon: any) => {
                            const addonPrice = Number(addon?.price) || 0;
                            const addonQuantity = Math.max(0, Number(addon?.quantity) || 0);
                            return sum + (addonPrice * addonQuantity);
                          }, 0);

                          const storedConfiguredUnit = Number(item.configuredUnitPrice);
                          const hasStoredConfiguredUnit =
                            item.configuredUnitPrice !== undefined &&
                            item.configuredUnitPrice !== null &&
                            Number.isFinite(storedConfiguredUnit);

                          const configuredUnit = hasStoredConfiguredUnit
                            ? storedConfiguredUnit
                            : basePrice + addonsSum;

                          const mainQuantity = Math.max(1, Number(item.quantity) || 1);
                          const itemTotal = configuredUnit * mainQuantity;

                          return (
                            <li key={idx} className="flex justify-between items-start border-b border-zinc-800/50 pb-2 last:border-0 last:pb-0">
                              <div>
                                <span className="font-black text-red-500 mr-2">{mainQuantity}x</span>
                                <span className="text-sm text-white font-bold">{item.name}</span>
                                {item.variation && (
                                  <div className="text-[11px] text-zinc-500 ml-6 uppercase">
                                    Variação: {item.variation}
                                  </div>
                                )}
                                {selectedAddons.length > 0 && (
                                  <div className="ml-6 mt-1 text-[11px] text-red-400 space-y-0.5">
                                    <span className="font-bold uppercase tracking-wider text-[9px] text-zinc-500 block">
                                      Adicionais {mainQuantity > 1 ? '(por un.):' : ':'}
                                    </span>
                                    {selectedAddons.map((addon: any, aIdx: number) => {
                                      const addonPrice = Number(addon?.price) || 0;
                                      const addonQuantity = Math.max(0, Number(addon?.quantity) || 0);
                                      const addonUnitTotal = addonPrice * addonQuantity;

                                      return (
                                        <div key={addon?.id || aIdx} className="flex items-center gap-1 font-semibold">
                                          <span>+ {addonQuantity}x {addon?.name || 'Adicional'}</span>
                                          {addonUnitTotal > 0 && (
                                            <span className="text-zinc-500 text-[10px]">
                                              (R$ {addonUnitTotal.toFixed(2).replace('.', ',')})
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs font-bold text-zinc-400">
                                R$ {itemTotal.toFixed(2).replace('.', ',')}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    
                    <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                      <div>
                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Forma Pgto</p>
                        <p className="text-sm font-bold text-white">{order.paymentMethod}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Total</p>
                        <p className="text-lg font-black text-green-500">R$ {(Number(order.total) || 0).toFixed(2).replace('.', ',')}</p>
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
            {/* Subtab Selector for Cardápio */}
            <div className="flex border-b border-zinc-800 mb-6">
              <button
                onClick={() => setMenuSubTab('products')}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  menuSubTab === 'products'
                    ? 'border-orange-500 text-orange-500 bg-orange-500/10'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ChefHat size={18} /> Produtos do Cardápio ({items.length})
              </button>
              <button
                onClick={() => setMenuSubTab('addons')}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  menuSubTab === 'addons'
                    ? 'border-red-500 text-red-500 bg-red-500/10'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles size={18} /> Adicionais no Firestore ({addons.length})
              </button>
            </div>

            {menuSubTab === 'products' ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Produtos do Cardápio</h2>
                    <p className="text-xs text-zinc-400">Gerencie os hambúrgueres e pratos do cardápio.</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCreate}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-bold flex items-center gap-2 transition text-white shadow-md"
                    >
                      <Plus className="w-4 h-4" /> Novo Produto
                    </button>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
                  <button
                    onClick={() => setSelectedCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategoryFilter === 'all'
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    Todos ({items.length})
                  </button>
                  <button
                    onClick={() => setSelectedCategoryFilter('Adicionais')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      selectedCategoryFilter === 'Adicionais'
                        ? 'bg-red-600 text-white shadow-md ring-2 ring-red-400/30'
                        : 'bg-red-950/40 text-red-400 border border-red-500/20 hover:bg-red-900/40'
                    }`}
                  >
                    🍔 Adicionais ({items.filter(i => i.category === 'Adicionais').length})
                  </button>
                  {Array.from(new Set(items.map(i => i.category)))
                    .filter(cat => cat !== 'Adicionais')
                    .map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                          selectedCategoryFilter === cat
                            ? 'bg-orange-600 text-white shadow-md'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                        }`}
                      >
                        {cat} ({items.filter(i => i.category === cat).length})
                      </button>
                    ))}
                </div>

                {isLoadingItems ? (
                  <div className="text-center py-20 text-zinc-400">Carregando cardápio...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
                    {(selectedCategoryFilter === 'all'
                      ? items
                      : items.filter(i => i.category === selectedCategoryFilter)
                    ).map(item => (
                      <ProductCard key={item.id} item={item} onUpdate={handleUpdate} onDelete={() => handleDelete(item.id)} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* ADDONS_MANAGER_FOUNDATION_13_ITEMS_2026_08_03 */
              <div className="space-y-6 mb-16">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 shadow-xl">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="text-red-500" size={20} />
                      Gerenciador de Adicionais (Coleção 'addons')
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Fonte de verdade de adicionais no Firestore. Sincronizado em tempo real.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isAgencyOwner && (
                      <>
                        <button
                          onClick={handleImportInitialAddons}
                          disabled={isImportingAddons}
                          className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold flex items-center gap-2 transition disabled:opacity-50"
                          title="Importar os 13 adicionais padrão sem sobrescrever existentes"
                        >
                          {isImportingAddons ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <RefreshCw className="w-4 h-4 text-red-500" />}
                          Importar adicionais atuais
                        </button>
                        <button
                          onClick={handleMigrateLegacyAddonMedia}
                          disabled={isMigratingMedia}
                          className="px-3 py-2 bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/50 rounded-xl text-xs font-bold flex items-center gap-2 transition disabled:opacity-50"
                          title="Preencher imagens e descrições dos 13 adicionais a partir dos 7 itens legados"
                        >
                          {isMigratingMedia ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <ImageIcon className="w-4 h-4 text-red-500" />}
                          Preencher imagens dos 13 adicionais
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setEditingAddon({
                          name: '',
                          price: 5.00,
                          available: true,
                          publicVisible: true,
                          order: addons.length + 1,
                        });
                        setIsAddonModalOpen(true);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold flex items-center gap-2 transition text-white shadow-md"
                    >
                      <Plus className="w-4 h-4" /> Novo Adicional
                    </button>
                  </div>
                </div>

                {isLoadingAddons ? (
                  <div className="text-center py-16 text-zinc-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-red-500" /> Carregando adicionais...
                  </div>
                ) : addons.length === 0 ? (
                  <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800 p-8">
                    <p className="text-zinc-400 text-sm mb-4">Nenhum adicional cadastrado na coleção 'addons'.</p>
                    {isAgencyOwner && (
                      <button
                        onClick={handleImportInitialAddons}
                        disabled={isImportingAddons}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold inline-flex items-center gap-2 transition shadow-lg"
                      >
                        <RefreshCw className="w-4 h-4" /> Importar 13 adicionais padrão agora
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {addons.map((addon) => (
                      <div
                        key={addon.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 shadow ${
                          addon.available
                            ? 'bg-zinc-800 border-zinc-700/50 hover:border-zinc-700'
                            : 'bg-zinc-900/70 border-zinc-800 opacity-60'
                        }`}
                      >
                        <div className="flex gap-4">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700 flex-shrink-0">
                            <img 
                              src={addon.image || "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=200"} 
                              alt={addon.name} 
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
                                    ID: {addon.id}
                                  </span>
                                  <span className="text-[10px] text-zinc-400 font-bold uppercase px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800">
                                    Ordem: {addon.order}
                                  </span>
                                </div>
                                <h4 className={`font-bold text-base truncate ${addon.available === false ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
                                  {addon.name}
                                </h4>
                                <p className="text-red-400 font-black text-sm">
                                  R$ {addon.price.toFixed(2).replace('.', ',')}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => {
                                    setEditingAddon({ ...addon });
                                    setIsAddonModalOpen(true);
                                  }}
                                  className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition"
                                  title="Editar Adicional"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteAddon(addon.id, addon.name)}
                                  className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-600 hover:text-red-500 transition"
                                  title="Excluir Adicional"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {addon.description && (
                          <p className="text-xs text-zinc-400 line-clamp-1 italic">{addon.description}</p>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-700/60">
                          <button
                            onClick={() => handleToggleAddonAvailable(addon)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 ${
                              addon.available
                                ? 'bg-green-950/80 text-green-400 border border-green-800/50'
                                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                            }`}
                          >
                            {addon.available ? <Check size={12} /> : <X size={12} />}
                            {addon.available ? 'Disponível' : 'Indisponível'}
                          </button>

                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              addon.publicVisible
                                ? 'bg-blue-950/80 text-blue-400 border border-blue-800/50'
                                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                            }`}
                          >
                            {addon.publicVisible ? 'Visível no Site' : 'Oculto no Site'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'marketing' && isAgencyOwner && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="mb-0 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black flex items-center gap-2 text-white">
                  Criador Viral IA 
                  <span className="bg-orange-500/20 text-orange-500 text-[10px] px-2 py-0.5 rounded-full border border-orange-500/30 uppercase font-black tracking-widest">Experimental Beta</span>
                </h2>
                <p className="text-white font-medium mt-1">Gere mensagens prontas para WhatsApp com alto potencial de conversão.</p>
              </div>
              <div className="hidden md:block text-right">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter block">Status do Recurso</span>
                <span className={`text-sm font-black ${isPremium ? 'text-green-500' : 'text-red-500'}`}>
                  {isPremium ? 'MKT VIRAL ATIVADO' : 'MKT VIRAL BLOQUEADO'}
                </span>
              </div>
            </div>

            {/* Legal Disclaimer / Protection Block */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-[11px] text-gray-200 leading-relaxed space-y-3 shadow-inner">
              <p className="font-black text-orange-500 uppercase tracking-tight flex items-center gap-1.5 text-xs">
                <AlertCircle size={14} /> 
                ⚠️ SOBRE O FUNCIONAMENTO DAS PRÉVIAS NO WHATSAPP
              </p>
              <p className="font-medium text-white">Este recurso gera textos otimizados e links inteligentes para compartilhamento.</p>
              <p className="text-gray-300">
                A exibição de imagem (preview) no WhatsApp depende de fatores externos, como:<br />
                • Processamento do próprio WhatsApp<br />
                • Cache da plataforma<br />
                • Tempo de resposta do servidor de imagem<br />
                • Leitura de metadados Open Graph
              </p>
              <p className="text-gray-300">Por se tratar de sistemas de terceiros, o funcionamento da prévia pode variar e não pode ser garantido em 100% dos envios.</p>
              <p className="font-black text-white italic bg-white/5 w-fit px-2 py-1 rounded">O sistema continua funcionando normalmente mesmo sem a exibição da imagem.</p>
            </div>

            {/* AI Config Section - Gemini API Key */}
            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-6">
               <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl pointer-events-none" />
               <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-black text-white text-lg mb-2 flex items-center gap-2">
                       <Lock size={18} className="text-orange-500" /> 
                       🤖 IA de Marketing Ativa
                    </h3>
                    <p className="text-sm text-gray-200 font-semibold leading-relaxed">
                      O sistema gera automaticamente mensagens persuasivas com base no produto selecionado.<br />
                      O envio e a exibição no WhatsApp seguem o comportamento da própria plataforma.
                    </p>
                  </div>
               </div>

               <div className="border-t border-zinc-700/50 pt-6">
                 <h3 className="font-black text-sm text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Key size={16} className="text-orange-500" /> Configuração da API
                 </h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                   <div className="space-y-2">
                     <label className="text-[10px] text-white font-black uppercase">Chave Gemini do Cliente</label>
                     <input 
                       type="password"
                       placeholder="Cole sua chave Gemini aqui..."
                       value={geminiKey}
                       onChange={(e) => setGeminiKey(e.target.value)}
                       className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors placeholder:text-zinc-600"
                     />
                   </div>
                   <button 
                     onClick={handleSaveGeminiKey}
                     disabled={!geminiKey || isSavingKey}
                     className="bg-orange-600 hover:bg-orange-500 disabled:opacity-30 text-white font-black py-3 px-6 rounded-lg transition-all h-[46px] flex items-center justify-center gap-2 shadow-lg active:scale-95"
                   >
                     {isSavingKey ? <RefreshCw size={18} className="animate-spin" /> : "Salvar Chave"}
                   </button>
                 </div>

                 <div className="flex flex-col gap-2 bg-black/40 p-4 rounded-xl border border-zinc-700/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${isGeminiConfigured ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                      <span className={`text-xs font-black uppercase tracking-tight ${isGeminiConfigured ? 'text-green-500' : 'text-red-500'}`}>
                        {isGeminiConfigured ? '🟢 Chave Configurada' : (decryptionFailed ? '⚠️ Erro de Versão' : '🔴 Chave Não Encontrada')}
                      </span>
                    </div>
                    
                    {decryptionFailed && (
                      <div className="text-[10px] bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-200 font-bold leading-tight uppercase flex items-start gap-2">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>Sua chave foi salva em outro ambiente (ex: Vercel). Para usar aqui no Preview, COLE E SALVE A CHAVE NOVAMENTE abaixo.</span>
                      </div>
                    )}

                    {isGeminiConfigured && !decryptionFailed && (
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-900/50 px-3 py-2 rounded-lg border border-zinc-800 flex items-center gap-2">
                        <Info size={12} className="text-orange-500" />
                        <span>Status: {configSource === 'environment' ? 'Modo Produção (Vercel ENV)' : 'Modo Cliente (Banco de Dados)'}</span>
                      </div>
                    )}
                 </div>

                 <div className="mt-4 space-y-4">
                   <div className="space-y-3">
                     <button 
                       onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
                       className="flex items-center gap-2 text-xs font-black text-orange-500 hover:text-orange-400 p-2 bg-orange-500/10 rounded-lg border border-orange-500/20 transition-all uppercase tracking-widest shadow-sm"
                     >
                       <Key size={14} /> Obter chave Gemini
                     </button>
                     
                     <p className="text-[11px] text-zinc-100 font-medium leading-relaxed bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                       Entre com sua conta Google, gere sua chave Gemini e cole aqui no campo acima.<br /><br />
                       A chave será enviada ao servidor e armazenada de forma criptografada. Por segurança, ela não será exibida novamente após o salvamento.
                     </p>
                   </div>
                 </div>
               </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-[11px] text-zinc-100 leading-relaxed shadow-inner">
               <p className="font-black text-zinc-100 uppercase tracking-tight flex items-center gap-1.5 text-xs mb-3">
                 <AlertCircle size={14} className="text-orange-500" /> 
                 ⚠️ SOBRE A API GEMINI
               </p>
               <div className="space-y-2 text-zinc-300">
                 <p>Este recurso utiliza a API Gemini do Google.</p>
                 <p>A chave deve ser fornecida pelo próprio cliente ou responsável pela loja.</p>
                 <p>Limites de uso, disponibilidade, gratuidade, cobrança e funcionamento da API são definidos pelo Google e podem mudar sem aviso prévio.</p>
                 
                 <div className="pt-2 border-t border-zinc-800">
                   <p className="font-black text-orange-500 uppercase text-[10px] tracking-widest mb-1">Não nos responsabilizamos por:</p>
                   <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 list-disc ml-4 font-medium">
                     <li>Limite de uso excedido</li>
                     <li>Indisponibilidade da API</li>
                     <li>Alterações de política ou preço</li>
                     <li>Bloqueio ou suspensão da chave</li>
                   </ul>
                 </div>
               </div>
            </div>

            {!isPremium && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center space-y-4">
                <Lock size={48} className="mx-auto text-red-500" />
                <h3 className="text-xl font-bold">Marketing Viral Bloqueado</h3>
                <p className="text-zinc-400 max-w-md mx-auto">
                  Este recurso faz parte do módulo premium. Entre em contato com a agência para liberar o acesso e gerar posts irresistíveis.
                </p>
                <button 
                   onClick={() => window.open('https://wa.me/5562994805695?text=Olá!%20Gostaria%20de%20pedir%20atualização%20do%20plano%20e%20a%20liberação%20do%20recurso%20de%20Marketing%20Viral', '_blank')}
                   className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-all"
                >
                  Falar com Suporte
                </button>
              </div>
            )}

            {isPremium && (
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
                      <div className="p-3 bg-black border border-zinc-800 rounded-xl">
                        <p className="text-[10px] text-white font-black uppercase mb-1 flex items-center gap-2">
                          <Share2 size={10} className="text-orange-500" /> Link do Produto (Pronto para Uso)
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-orange-500 font-black flex-1 truncate">{window.location.origin}/share/{selectedProductId}</code>
                          <button 
                            onClick={() => {
                              const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
                              const shareLink = `${baseUrl}/share/${selectedProductId}`;
                              navigator.clipboard.writeText(shareLink);
                              alert('Link do produto copiado!');
                            }}
                            className="bg-zinc-800 p-2 rounded-lg hover:bg-zinc-700 text-white transition-colors border border-zinc-700"
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
                    
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2">
                      <p className="text-xs text-blue-300 leading-relaxed font-black flex items-center gap-2 uppercase tracking-tight">
                        <Sparkles size={14} className="text-blue-400" /> 💡 Dica de Sucesso
                      </p>
                      <ul className="text-[10px] text-zinc-100 font-medium space-y-1 ml-5 list-disc leading-tight">
                        <li>O texto gerado já está otimizado para vendas</li>
                        <li>Envie o link ao final da mensagem para ativar o preview</li>
                        <li>Evite editar o link para não quebrar a imagem</li>
                        <li>Use o botão "Copiar Texto" para compatibilidade total</li>
                      </ul>
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
                            const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
                            const shareLink = `${baseUrl}/share/${selectedProductId}`;
                            const textToCopy = isError || !generatedPost 
                              ? `🍔 *${product?.name || 'Delícia do Dia'}*\n\nConfira nosso cardápio e faça seu pedido pelo link:\n\n${shareLink}`
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
                            if (!product) return;

                            const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
                            const shareLink = `${baseUrl}/share/${selectedProductId}`;
                            
                            // 1. Limpar texto gerado (remover links que a IA possa ter colocado para evitar duplicação)
                            let cleanText = generatedPost || "";
                            if (cleanText.startsWith('⚠️')) cleanText = "";

                            // Fallback caso não tenha texto gerado
                            if (!cleanText) {
                                cleanText = product.description.substring(0, 300) || "Peça agora o melhor burger artesanal e pit dog de Goiânia! Qualidade garantida.";
                            }

                            // Remover links https da IA
                            cleanText = cleanText.replace(/https?:\/\/[^\s]+/g, '').trim();
                            
                            // Garantir texto enxuto (resumido se for muito longo)
                            if (cleanText.length > 400) {
                              cleanText = cleanText.substring(0, 397) + "...";
                            }

                            // VERSÃO SEM EMOJIS para WhatsApp URL (evita quebra no desktop)
                            // Remove emojis (simple regex)
                            const cleanTextNoEmoji = cleanText.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF])/g, '');

                            const finalMessage = `[PRODUTO] ${product.name.toUpperCase()}\n\n${cleanTextNoEmoji}\n\nConfira em:\n${shareLink}`;
                            
                            window.open(`https://wa.me/?text=${encodeURIComponent(finalMessage)}`, '_blank');
                          }}
                          className="bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 px-2"
                        >
                          <MessageCircle size={20} /> Compartilhar no WhatsApp
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
            )}
          </div>
        )}

        {/* Seção de Marketing Local (SEO / GMB) -> Manter no fim, global apenas para agência */}
        {isAgencyOwner && (
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
        )}

        {activeTab === 'siteImages' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-800/80 border border-zinc-700/60 p-6 rounded-2xl">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                  <ImageIcon className="text-red-500" /> Gerenciador de Mídias e Banners do Site
                </h2>
                <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
                  Altere as imagens estáticas da página inicial e institucional diretamente daqui. Você pode colar URLs de imagens ou fazer upload direto de arquivos JPG/PNG para o <strong>Cloudinary</strong>.
                </p>
              </div>

              <button
                onClick={handleSaveSiteImages}
                disabled={isSavingSiteImages}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 shrink-0"
              >
                {isSavingSiteImages ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Salvando Mídias...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Salvar Mídias no Firebase
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  key: 'heroImage' as const,
                  title: 'Banner Principal (Hero Background)',
                  description: 'Fundo da área de destaque na entrada do site.',
                  dimensions: '1920 × 1080 px',
                  ratio: '16:9 Horizontal',
                  defaultUrl: DEFAULT_SITE_IMAGES.heroImage,
                  aspect: 'aspect-video'
                },
                {
                  key: 'craftImage' as const,
                  title: 'A Ciência da Suculência (Making-Of)',
                  description: 'Foto da seção que explica os blends, carne e pão selado.',
                  dimensions: '1000 × 1000 px',
                  ratio: '1:1 Quadrada',
                  defaultUrl: DEFAULT_SITE_IMAGES.craftImage,
                  aspect: 'aspect-square'
                },
                {
                  key: 'menuCardImage' as const,
                  title: 'Cardápio Inteligente (Bloco WhatsApp)',
                  description: 'Imagem do lanche/burger ao lado da chamada do WhatsApp.',
                  dimensions: '1200 × 800 px',
                  ratio: '3:2 / 16:9 Horizontal',
                  defaultUrl: DEFAULT_SITE_IMAGES.menuCardImage,
                  aspect: 'aspect-video'
                },
                {
                  key: 'physicalStoreImage' as const,
                  title: 'Espaço Físico & Kids (Pula-Pula)',
                  description: 'Foto da fachada, mesas ou espaço kids.',
                  dimensions: '1200 × 900 px',
                  ratio: '4:3 ou 16:9 Horizontal',
                  defaultUrl: DEFAULT_SITE_IMAGES.physicalStoreImage,
                  aspect: 'aspect-video'
                },
                {
                  key: 'aboutImage' as const,
                  title: 'História & Tradição (Página Sobre)',
                  description: 'Imagem de destaque na página "Nossa História".',
                  dimensions: '1000 × 1000 px',
                  ratio: '1:1 Quadrada',
                  defaultUrl: DEFAULT_SITE_IMAGES.aboutImage,
                  aspect: 'aspect-square'
                }
              ].map((item) => {
                const currentUrl = siteImages[item.key] || item.defaultUrl;
                const isUploadingThis = uploadingField === item.key;

                return (
                  <div key={item.key} className="bg-zinc-800 border border-zinc-700/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-white">{item.title}</h3>
                        <button
                          type="button"
                          onClick={() => setSiteImages(prev => ({ ...prev, [item.key]: item.defaultUrl }))}
                          title="Restaurar imagem padrão"
                          className="text-xs text-zinc-400 hover:text-orange-400 transition-colors flex items-center gap-1 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-700 shrink-0"
                        >
                          <RefreshCw size={12} /> Padrão
                        </button>
                      </div>
                      
                      <p className="text-xs text-zinc-400 mb-2">{item.description}</p>

                      {/* Dimensions Badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-orange-500/10 text-orange-400 border border-orange-500/30 text-[11px] font-bold px-2.5 py-1 rounded-md">
                          📐 Dimensão ideal: {item.dimensions}
                        </span>
                        <span className="bg-zinc-900 text-zinc-400 border border-zinc-700 text-[11px] font-medium px-2 py-1 rounded-md">
                          {item.ratio}
                        </span>
                      </div>

                      {/* Preview Image */}
                      <div className={`relative ${item.aspect} w-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-700 mb-4 group`}>
                        <img
                          src={currentUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = item.defaultUrl;
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center text-xs font-bold text-white">
                          Pré-visualização
                        </div>
                      </div>

                      {/* URL Input */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-300 block">
                          URL da Imagem:
                        </label>
                        <input
                          type="text"
                          value={siteImages[item.key] || ''}
                          onChange={(e) => setSiteImages(prev => ({ ...prev, [item.key]: e.target.value }))}
                          placeholder={item.defaultUrl}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-red-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Cloudinary Upload Button */}
                    <div className="pt-2 border-t border-zinc-700/50 flex items-center justify-between gap-2">
                      <label className={`w-full cursor-pointer bg-zinc-900 hover:bg-zinc-700 text-zinc-200 text-xs font-bold py-2.5 px-3 rounded-lg border border-zinc-700 flex items-center justify-center gap-2 transition-all ${isUploadingThis ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isUploadingThis ? (
                          <>
                            <Loader2 size={14} className="animate-spin text-red-500" /> Enviando foto...
                          </>
                        ) : (
                          <>
                            <Upload size={14} className="text-orange-400" /> Enviar Arquivo JPG/PNG
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          disabled={isUploadingThis}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadSiteMedia(item.key, file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Save Bar */}
            <div className="bg-zinc-950/90 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20 backdrop-blur-md shadow-2xl">
              <div className="text-xs text-zinc-400 flex items-center gap-2">
                <Info size={16} className="text-orange-500 shrink-0" />
                <span>As alterações salvas aqui são aplicadas automaticamente no site público para todos os clientes em tempo real.</span>
              </div>
              <button
                onClick={handleSaveSiteImages}
                disabled={isSavingSiteImages}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 shrink-0"
              >
                {isSavingSiteImages ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Salvando Mídias...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Salvar Mídias no Firebase
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Edit/Create Addon Modal */}
        {isAddonModalOpen && editingAddon && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-zinc-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="text-red-500" size={18} />
                  {editingAddon.id ? 'Editar Adicional' : 'Novo Adicional'}
                </h3>
                <button
                  onClick={() => {
                    setIsAddonModalOpen(false);
                    setEditingAddon(null);
                  }}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveAddon} className="space-y-4">
                {editingAddon.id && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      ID do Documento (imutável)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={editingAddon.id}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-500 cursor-not-allowed font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Nome do Adicional *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Queijo Extra"
                    value={editingAddon.name || ''}
                    onChange={(e) => setEditingAddon(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      required
                      value={editingAddon.price ?? 0}
                      onChange={(e) => setEditingAddon(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Ordem de Exibição
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editingAddon.order ?? 1}
                      onChange={(e) => setEditingAddon(prev => ({ ...prev, order: parseInt(e.target.value, 10) || 1 }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Descrição do Adicional
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Fatias crocantes de bacon artesanal defumado"
                    value={editingAddon.description || ''}
                    onChange={(e) => setEditingAddon(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition resize-none"
                  />
                </div>

                <div className="space-y-3 pt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-zinc-500 uppercase font-black">Imagem do Adicional (WhatsApp Preview)</label>
                  </div>

                  {/* Cloudinary Upload Section */}
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-lg p-3 hover:border-orange-500 transition-colors bg-zinc-900/30 group">
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleAddonCloudinaryUpload} 
                        accept="image/jpeg,image/png" 
                        disabled={isUploadingAddonImage} 
                      />
                      {isUploadingAddonImage ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                          <span className="text-[10px] text-zinc-500 font-bold uppercase">Enviando...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-zinc-500 group-hover:text-orange-500 transition-colors">
                          <Upload size={16} />
                          <span className="text-[10px] uppercase font-black text-center">Enviar Foto p/ Cloudinary</span>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Manual HTTPS URL Input */}
                  <div className="space-y-2">
                    <input 
                      type="url"
                      className={`w-full bg-zinc-950 border ${editingAddon.image && !editingAddon.image.startsWith('https://') ? 'border-red-500' : 'border-zinc-800'} rounded-xl px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none transition font-mono`} 
                      placeholder="https://site.com/sua-foto-gourmet.jpg"
                      value={editingAddon.image || ''} 
                      onChange={e => setEditingAddon(prev => ({ ...prev, image: e.target.value }))}
                      onBlur={e => setEditingAddon(prev => ({ ...prev, image: normalizeImageUrl(e.target.value) }))}
                    />
                    
                    {/* Large Aspect-Video Preview */}
                    <div className="aspect-video w-full rounded-xl border border-zinc-800 bg-black overflow-hidden flex items-center justify-center relative group">
                      {editingAddon.image ? (
                        <>
                          <img 
                            src={editingAddon.image} 
                            alt="Preview" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1000";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Preview Digital</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-500">
                          <ImageIcon size={24} />
                          <span className="text-[10px] uppercase font-bold">Sem imagem definida</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Warnings and Tips */}
                  <div className="space-y-2">
                    <div className="text-[10px] text-zinc-400 bg-zinc-900/50 p-2 rounded border border-zinc-800">
                      <span className="text-orange-500 font-black">DICA:</span> Use imagens do <a href="https://unsplash.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">Unsplash</a> ou links diretos de alta qualidade.
                    </div>

                    {editingAddon.image?.toLowerCase().includes('.webp') && (
                      <div className="flex items-center gap-1.5 text-[10px] text-yellow-500 font-bold bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                        <AlertCircle size={12} /> <span className="uppercase">Aviso:</span> WebP detectado. Use JPG ou PNG para garantir o preview.
                      </div>
                    )}
                    
                    {editingAddon.image && !editingAddon.image.startsWith('https://') && (
                      <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-bold bg-red-500/10 p-2 rounded border border-red-500/20">
                        <Info size={12} /> <span className="uppercase">Erro:</span> A imagem precisa ser HTTPS (Segura).
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="addonAvailableCheck"
                      checked={editingAddon.available ?? true}
                      onChange={(e) => setEditingAddon(prev => ({ ...prev, available: e.target.checked }))}
                      className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                    />
                    <label htmlFor="addonAvailableCheck" className="text-xs font-medium text-zinc-300 cursor-pointer select-none">
                      Disponível para seleção no modal de customização
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="addonPublicVisibleCheck"
                      checked={editingAddon.publicVisible ?? false}
                      onChange={(e) => setEditingAddon(prev => ({ ...prev, publicVisible: e.target.checked }))}
                      className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                    />
                    <label htmlFor="addonPublicVisibleCheck" className="text-xs font-medium text-zinc-300 cursor-pointer select-none">
                      Exibir na seção pública de adicionais
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddonModalOpen(false);
                      setEditingAddon(null);
                    }}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingAddonImage}
                    className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition shadow-md flex items-center gap-2"
                  >
                    {isUploadingAddonImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando imagem...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Salvar Adicional</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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

  const handleSave = async () => {
    const normalizedUrl = normalizeImageUrl(draft.image || "");
    
    // Validations
    if (normalizedUrl && !normalizedUrl.startsWith("https://")) {
      alert("Erro: A imagem precisa ser uma URL HTTPS segura para aparecer no WhatsApp.");
      return;
    }

    if (normalizedUrl && !normalizedUrl.includes(".")) {
      alert("Erro: Informe uma URL de imagem válida (ex: https://site.com/foto.jpg)");
      return;
    }

    const updatedItem = {
      ...draft,
      price: Number(draft.price),
      image: normalizedUrl
    };
    
    try {
      await onUpdate(updatedItem);
      setEditing(false);
    } catch (e: any) {
      console.error("Erro capturado ao salvar no ProductCard:", e);
      // O erro já gerou um alert() no handleUpdate, então apenas mantemos a tela aberta
    }
  };

  const handleCloudinaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isAllowedExtension = ['jpg', 'jpeg', 'png'].includes(fileExtension || '');
    
    if (!allowedTypes.includes(file.type) && !isAllowedExtension) {
      alert("Erro: Apenas imagens JPG ou PNG são permitidas.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Erro: A imagem deve ter no máximo 2 MB.");
      return;
    }

    setIsUploading(true);
    console.log(`[CLOUDINARY] Iniciando upload para produto: ${draft.id}`);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        console.error("[CLOUDINARY] Resposta não-JSON:", errorText);
        throw new Error("O servidor retornou uma resposta inválida (HTML). Verifique se as rotas da API estão configuradas corretamente.");
      }

      const data = await response.json();

      if (data.success && data.imageUrl) {
        console.log(`[CLOUDINARY] Sucesso! URL: ${data.imageUrl}`);
        
        // 5. Aplicar URL ao produto
        const updatedItem = {
          ...draft,
          price: Number(draft.price),
          image: data.imageUrl
        };
        setDraft(updatedItem);
        
        // 6. Salvar produto no Firestore imediatamente
        await onUpdate(updatedItem);

        // 7. Exibir sucesso somente após upload e salvamento concluídos
        alert("Imagem enviada ao Cloudinary e salva no produto com sucesso!");
      } else {
        throw new Error(data.error || "Erro desconhecido no servidor.");
      }
    } catch (err: any) {
      console.error("[CLOUDINARY] ERRO:", err);
      alert(`Não foi possível enviar ou salvar a imagem. Tente novamente com JPG ou PNG menor que 2MB.\n${err.message || ""}`);
    } finally {
      setIsUploading(false);
      console.log("[CLOUDINARY] Fluxo finalizado.");
    }
  };

  /*
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: Only JPG, JPEG, PNG
    const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const forbiddenExtensions = ['.webp', '.gif', '.svg'];
    const fileNameLower = file.name.toLowerCase();
    
    if (!acceptedTypes.includes(file.type)) {
      alert("Erro: Apenas imagens JPG ou PNG são permitidas.");
      return;
    }

    if (forbiddenExtensions.some(ext => fileNameLower.endsWith(ext))) {
       alert("Erro: Formatos WebP, GIF e SVG não são permitidos.");
       return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Erro: A imagem deve ter no máximo 2 MB.");
      return;
    }

    if (!storage) {
      alert("Firebase Storage não está configurado.");
      return;
    }

    setIsUploading(true);
    console.log(`[UPLOAD] Iniciando para produto: ${item.id}`);

    // Timeout de 15 segundos para toda a operação (processamento + upload)
    const uploadTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout: O processo demorou demais. Verifique se a imagem é muito pesada ou se sua conexão está instável.")), 15000)
    );

    const performUpload = async () => {
      console.log("[UPLOAD] Etapa 1: Processando imagem...");
      const processedBlob = await processImage(file, { maxWidth: 1200, quality: 0.85 });
      
      console.log("[UPLOAD] Etapa 2: Enviando para Storage...");
      const storageRef = ref(storage, `products/${item.id}/main.jpg`);
      const snapshot = await uploadBytes(storageRef, processedBlob, { contentType: 'image/jpeg' });
      
      console.log("[UPLOAD] Etapa 3: Obtendo URL...");
      return await getDownloadURL(snapshot.ref);
    };

    try {
      const downloadURL = await Promise.race([performUpload(), uploadTimeout]) as string;
      console.log(`[UPLOAD] Sucesso! URL: ${downloadURL}`);

      setDraft(prev => ({ ...prev, image: downloadURL }));
      alert("Imagem enviada com sucesso!");
    } catch (err: any) {
      console.error("[UPLOAD] ERRO:", err);
      alert(err.message || "Erro inesperado ao enviar imagem.");
    } finally {
      setIsUploading(false);
      console.log("[UPLOAD] Fluxo finalizado.");
    }
  };
  */

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

            {/* Seção de Variações de Preço (Opções do Produto) */}
            <div className="mt-2 bg-zinc-900/50 p-4 rounded-xl border border-zinc-700/50">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
                <label className="text-xs font-black uppercase text-orange-400 tracking-wider flex items-center gap-1.5">
                  Variações de Preço / Opções (Opcional)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const currentOptions = draft.meatOptions ? [...draft.meatOptions] : [];
                    currentOptions.push({ name: '', price: draft.price || 0 });
                    const val = { ...draft, meatOptions: currentOptions };
                    
                    // Auto-update price text if applicable
                    const prices = currentOptions.map(o => o.price).filter(p => p > 0);
                    if (prices.length > 0) {
                      const minPrice = Math.min(...prices);
                      val.priceText = `A partir de R$ ${minPrice.toFixed(2)}`;
                    } else if (val.price > 0) {
                      val.priceText = `A partir de R$ ${val.price.toFixed(2)}`;
                    }
                    setDraft(val);
                  }}
                  className="flex items-center gap-1 text-[10px] bg-red-600 hover:bg-red-500 text-white font-black px-2 py-1 rounded transition-colors uppercase tracking-widest cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Var.
                </button>
              </div>

              {draft.meatOptions && draft.meatOptions.length > 0 ? (
                <div className="space-y-3">
                  {draft.meatOptions.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center bg-zinc-950/40 p-2 rounded border border-zinc-800">
                      <div className="flex-1">
                        <label className="text-[9px] uppercase font-black text-zinc-500 tracking-wider">Nome da Opção</label>
                        <input
                          type="text"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                          placeholder="Ex: 100g Filé de Frango"
                          value={opt.name || ''}
                          onChange={e => {
                            const newOptions = [...draft.meatOptions!];
                            newOptions[i] = { ...newOptions[i], name: e.target.value };
                            setDraft({ ...draft, meatOptions: newOptions });
                          }}
                        />
                      </div>
                      <div className="w-24">
                        <label className="text-[9px] uppercase font-black text-zinc-500 tracking-wider">Preço (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                          value={opt.price === undefined || opt.price === null ? '' : opt.price}
                          onChange={e => {
                            const newOptions = [...draft.meatOptions!];
                            newOptions[i] = { ...newOptions[i], price: Number(e.target.value) };
                            
                            const val = { ...draft, meatOptions: newOptions };
                            const prices = newOptions.map(o => o.price).filter(p => p > 0);
                            if (prices.length > 0) {
                              const minPrice = Math.min(...prices);
                              val.priceText = `A partir de R$ ${minPrice.toFixed(2)}`;
                            }
                            setDraft(val);
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newOptions = draft.meatOptions!.filter((_, idx) => idx !== i);
                          const updatedOptions = newOptions.length > 0 ? newOptions : undefined;
                          const val = { ...draft, meatOptions: updatedOptions };
                          if (!updatedOptions) {
                            val.priceText = '';
                          } else {
                            const prices = updatedOptions.map(o => o.price).filter(p => p > 0);
                            if (prices.length > 0) {
                              const minPrice = Math.min(...prices);
                              val.priceText = `A partir de R$ ${minPrice.toFixed(2)}`;
                            }
                          }
                          setDraft(val);
                        }}
                        className="text-zinc-500 hover:text-red-500 p-1.5 mt-4 transition-colors cursor-pointer"
                        title="Remover variação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-zinc-500 text-center italic py-2">
                  Nenhuma variação adicionada. O produto usará apenas o preço base.
                </p>
              )}
            </div>

            <div>
              <label className="text-xs text-zinc-400">Texto de Preço Alternativo (Opcional)</label>
              <input 
                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white focus:outline-none focus:border-red-500" 
                placeholder='ex: "Sob Consulta" ou "A partir de R$ 10"'
                value={draft.priceText || ''} 
                onChange={e => setDraft({...draft, priceText: e.target.value})} 
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400">Descrição/Ingredientes</label>
              <textarea 
                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white h-20 focus:border-red-500 focus:outline-none" 
                value={draft.description} onChange={e => setDraft({...draft, description: e.target.value})}
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-zinc-500 uppercase font-black">Imagem do Produto (WhatsApp Preview)</label>
              </div>

              {/* Cloudinary Upload Section */}
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-lg p-3 hover:border-orange-500 transition-colors bg-zinc-900/30 group">
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleCloudinaryUpload} 
                    accept="image/jpeg,image/png" 
                    disabled={isUploading} 
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Enviando...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-zinc-500 group-hover:text-orange-500 transition-colors">
                      <Upload size={16} />
                      <span className="text-[10px] uppercase font-black text-center">Enviar Foto p/ Cloudinary</span>
                    </div>
                  )}
                </label>
              </div>

              {/* URL Input */}
              <div className="space-y-2">
                <input 
                  className={`w-full bg-zinc-900 border ${isNotHttps && draft.image ? 'border-red-500' : 'border-zinc-700'} rounded p-3 text-sm text-white focus:border-red-500 focus:outline-none transition-colors`} 
                  placeholder="https://site.com/sua-foto-gourmet.jpg"
                  value={draft.image || ''} 
                  onChange={e => setDraft({...draft, image: e.target.value})} 
                  onBlur={e => setDraft({...draft, image: normalizeImageUrl(e.target.value)})}
                />
                
                {/* Visual Preview */}
                <div className="aspect-video w-full rounded-lg border border-zinc-700 bg-zinc-900 overflow-hidden flex items-center justify-center relative group">
                  {draft.image ? (
                    <>
                      <img 
                        src={draft.image} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1000";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Preview Digital</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                      <ImageIcon size={24} />
                      <span className="text-[10px] uppercase font-bold">Sem imagem definida</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Warnings and Tips */}
              <div className="space-y-2">
                <div className="text-[10px] text-zinc-400 bg-zinc-900/50 p-2 rounded border border-zinc-800">
                  <span className="text-orange-500 font-black">DICA:</span> Use imagens do <a href="https://unsplash.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">Unsplash</a> ou links diretos de alta qualidade para o melhor resultado no WhatsApp.
                </div>

                {isWebp && (
                  <div className="flex items-center gap-1.5 text-[10px] text-yellow-500 font-bold bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                    <AlertCircle size={12} /> <span className="uppercase">Aviso:</span> WebP detectado. Use JPG ou PNG para garantir o preview no WhatsApp.
                  </div>
                )}
                
                {isNotHttps && draft.image && (
                  <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-bold bg-red-500/10 p-2 rounded border border-red-500/20">
                    <Info size={12} /> <span className="uppercase">Erro:</span> A imagem precisa ser HTTPS (Segura).
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
                    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
                    const shareLink = `${baseUrl}/share/${item.id}`;
                    navigator.clipboard.writeText(shareLink);
                    alert('Link de compartilhamento copiado!');
                  }}
                  title="Copiar Link para Divulgação"
                  className="flex items-center gap-1.5 text-xs text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 hover:bg-green-500/20 transition-colors ml-auto"
                >
                  <Share2 className="w-3.5 h-3.5" /> <span className="font-bold">Compartilhar</span>
                </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
