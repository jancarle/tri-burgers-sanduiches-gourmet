import express from "express";
import admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Inicialização robusta do Firebase Admin
let adminInitialized = false;
try {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!rawServiceAccount) {
    console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT não definida no ambiente.");
  } else {
    // Validação básica se é um JSON
    if (!rawServiceAccount.trim().startsWith('{')) {
      throw new Error("O formato da FIREBASE_SERVICE_ACCOUNT não parece ser um JSON válido.");
    }

    const serviceAccount = JSON.parse(rawServiceAccount);

    // Ajuste crucial para chaves privadas na Vercel/Plataformas Cloud
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    } else {
      throw new Error("Campo private_key ausente no JSON da Conta de Serviço.");
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    adminInitialized = true;
    console.log("🔥 Firebase Admin inicializado com sucesso (Vercel Functions).");
  }
} catch (error) {
  console.error("❌ Erro crítico ao inicializar Firebase Admin:", error instanceof Error ? error.message : error);
  adminInitialized = false;
}

// Rota para metadados dinâmicos (Open Graph)
app.get("/share/:productId", async (req, res) => {
  const { productId } = req.params;
  const protocol = req.headers['x-forwarded-proto'] || "https";
  const host = req.get('host');
  const baseUrl = `${protocol}://${host}`;
  
  let productData = {
    name: "Delícia da Lanchonete",
    description: "Confira nosso cardápio completo!",
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=1000"
  };

  if (adminInitialized) {
    try {
      const cleanId = String(productId).trim();
      console.log(`[OG_DEBUG] Iniciando busca para ID: "${cleanId}"`);
      
      const firestore = admin.firestore();
      const doc = await firestore.collection("menu").doc(cleanId).get();
      
      if (doc.exists) {
        const data = doc.data();
        console.log(`[OG_DEBUG] Produto ENCONTRADO no Firestore: ${data?.name}`);
        
        // Define o nome
        productData.name = data?.name || productData.name;
        
        // Define a imagem (prioridade para a do banco)
        if (data?.image && data.image.trim() !== "") {
          productData.image = data.image;
          console.log(`[OG_DEBUG] Usando imagem do banco: ${productData.image}`);
        } else {
          console.log(`[OG_DEBUG] Produto sem imagem no banco, usando fallback.`);
        }
        
        // Trata a descrição e preço
        let finalDescription = data?.description || "";
        let pricePrefix = "";

        if (data?.price) {
          const numPrice = Number(data.price);
          if (!isNaN(numPrice) && numPrice > 0) {
            pricePrefix = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numPrice);
          }
        } else if (data?.meatOptions && Array.isArray(data.meatOptions) && data.meatOptions.length > 0) {
          // Se for sanduíche tradicional com opções de carne, pega a primeira
          const firstOption = data.meatOptions[0];
          if (firstOption.price) {
             pricePrefix = `A partir de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(firstOption.price)}`;
          }
        } else if (data?.priceText) {
          pricePrefix = data.priceText;
        }

        if (pricePrefix) {
          finalDescription = `${pricePrefix} - ${finalDescription}`;
        }
        
        if (finalDescription) {
          productData.description = finalDescription.length > 150 ? `${finalDescription.substring(0, 147)}...` : finalDescription;
        }
      } else {
        console.warn(`[OG_DEBUG] Documento NÃO existe no Firestore para ID: ${cleanId}. Verifique se o ID no banco é EXATAMENTE esse.`);
      }
    } catch (err) {
      console.error("[OG_DEBUG] Erro CRÍTICO ao buscar no Firestore:", err);
    }
  }

  // Garantir que a URL da imagem seja ABSOLUTA (O WhatsApp exige)
  if (productData.image && !productData.image.startsWith('http')) {
    const cleanImgPath = productData.image.startsWith('/') ? productData.image : `/${productData.image}`;
    productData.image = `${baseUrl}${cleanImgPath}`;
    console.log(`[OG_DEBUG] URL da imagem convertida para absoluta: ${productData.image}`);
  }

  const redirectUrl = `${baseUrl}/?p=${productId}`;

  res.send(`
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${productData.name}</title>
    
    <!-- Open Graph / WhatsApp / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${redirectUrl}">
    <meta property="og:title" content="${productData.name}">
    <meta property="og:description" content="${productData.description}">
    <meta property="og:image" content="${productData.image}">
    <meta property="og:image:url" content="${productData.image}">
    <meta property="og:image:secure_url" content="${productData.image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${productData.name}">
    <meta property="og:site_name" content="Cardápio Digital">
    <meta itemprop="name" content="${productData.name}">
    <meta itemprop="description" content="${productData.description}">
    <meta itemprop="image" content="${productData.image}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${productData.name}">
    <meta name="twitter:description" content="${productData.description}">
    <meta name="twitter:image" content="${productData.image}">

    <!-- Redirecionamento Automático -->
    <meta http-equiv="refresh" content="1;url=${redirectUrl}">
    <script>
      setTimeout(function() {
        window.location.href = "${redirectUrl}";
      }, 500);
    </script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #000; color: #fff;">
    <div style="text-align: center; padding: 20px;">
        <div style="border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #ef4444; border-radius: 50%; width: 40px; height: 40px; animation: spin 0.8s linear infinite; margin: 0 auto 30px;"></div>
        <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 10px; text-transform: uppercase; letter-spacing: -1px; font-style: italic;">${productData.name}</h1>
        <p style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Carregando sua delícia...</p>
        
        <!-- Oculto para usuários, visível para scrapers se necessário -->
        <div style="display:none">
          <img src="${productData.image}" alt="Preview">
        </div>
    </div>
    <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
</body>
</html>
  `);
});

  // Rota de diagnóstico
  app.get("/api/health", (req, res) => {
    const hasApiKey = !!process.env.GEMINI_API_KEY;
    res.json({ 
      status: "ok", 
      firebase: adminInitialized ? "configurado" : "pendente",
      gemini: hasApiKey ? "configurado" : "ausente",
      time: new Date().toISOString()
    });
  });

  // Catch-all para rotas de API não encontradas
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: `Rota de API não encontrada: ${req.originalUrl}` });
  });

export default app;
