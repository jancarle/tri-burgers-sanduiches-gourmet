import express from "express";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Backup de dados para quando o Firestore falhar ou para respostas instantâneas
const MENU_ITEMS_BACKUP = [
  { id: 'g1', name: 'Burger Gourmet', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=1000' },
  { id: 'g2', name: 'Clássico', image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&q=80&w=800' },
  { id: 'g3', name: 'Premium', image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=800' },
  { id: 'g4', name: 'Premium Duplo', image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=800' },
  { id: 'g4_trip', name: 'Premium Triplo', image: 'https://images.unsplash.com/photo-1608767221051-2b9d18f35a1f?auto=format&fit=crop&q=80&w=800' },
  { id: 'combo-promocional-xtudao', name: 'Combo X-Tudão Duplo', image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=800' }
];

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

const DATABASE_ID = "ai-studio-e7104e09-5d7d-4fb2-be51-883f71432273";

// Rota para metadados dinâmicos (Open Graph)
app.get("/share/:productId", async (req, res) => {
  const { productId } = req.params;
  const protocol = req.headers['x-forwarded-proto'] || "https";
  const host = req.get('host');
  const baseUrl = `${protocol}://${host}`;
  
  // Tenta encontrar nos backups primeiro para resposta imediata
  const backupProduct = MENU_ITEMS_BACKUP.find(i => i.id === productId);

  let productData = {
    name: backupProduct?.name || "Delícia da Lanchonete",
    description: "Confira nosso cardápio completo e peça agora o melhor burger de Goiânia!",
    image: backupProduct?.image || "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=1200&h=630"
  };

  let foundInDB = false;

  if (adminInitialized) {
    try {
      console.log(`🔍 [Vercel OG] Buscando no DB ${DATABASE_ID}: ${productId}`);
      const cleanId = String(productId).trim();
      
      // Busca no banco de dados específico utilizando getFirestore
      const db = getFirestore(DATABASE_ID);
      
      const docPromise = db.collection("menu").doc(cleanId).get();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500));
      
      const doc = await Promise.race([docPromise, timeoutPromise]) as admin.firestore.DocumentSnapshot;

      if (doc.exists) {
        const data = doc.data();
        foundInDB = true;
        console.log(`✅ [Vercel OG] Produto REAL encontrado: ${data?.name}`);
        
        // Atribui dados reais do banco
        productData.name = data?.name || productData.name;
        
        if (data?.image && data.image.trim() !== "") {
          productData.image = data.image; // PRIORIDADE TOTAL À IMAGEM DO BANCO
        }
        
        if (data?.description) {
          productData.description = data.description.length > 150 ? `${data.description.substring(0, 147)}...` : data.description;
        }

        if (data?.price) {
          const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.price);
          productData.description = `${formattedPrice} - ${productData.description}`;
        }
      } else {
        console.warn(`⚠️ [Vercel OG] ID ${cleanId} não encontrado no banco ${DATABASE_ID}.`);
      }
    } catch (err) {
      console.error("❌ [Vercel OG] Erro de conexão/busca:", err);
    }
  }

  // Garantir que a URL da imagem seja ABSOLUTA (O WhatsApp exige)
  if (productData.image && !productData.image.startsWith('http')) {
    const cleanImgPath = productData.image.startsWith('/') ? productData.image : `/${productData.image}`;
    productData.image = `${baseUrl}${cleanImgPath}`;
  }

  const shareUrl = `${baseUrl}/share/${productId}`;
  const redirectUrl = `${baseUrl}/?p=${productId}`;

  res.send(`
<!DOCTYPE html>
<html lang="pt-br" prefix="og: http://ogp.me/ns#">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${productData.name} | Tri Burgers</title>
    
    <!-- Diagnóstico Silencioso -->
    <!-- DB: ${foundInDB ? 'YES' : 'NO'} | ID: ${productId} | ADMIN: ${adminInitialized ? 'YES' : 'NO'} -->

    <!-- Open Graph / Meta Tags Primárias para Redes Sociais -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${shareUrl}" />
    <meta property="og:title" content="${productData.name}" />
    <meta property="og:description" content="${productData.description}" />
    <meta property="og:site_name" content="Tri Burgers Gourmet" />
    
    <!-- Imagem (O que o WhatsApp realmente usa) -->
    <meta property="og:image" content="${productData.image}" />
    <meta property="og:image:secure_url" content="${productData.image}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${productData.name}" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${productData.name}">
    <meta name="twitter:description" content="${productData.description}">
    <meta name="twitter:image" content="${productData.image}">

    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #000;
            color: #fff;
            text-align: center;
        }
        .loader {
            border: 4px solid rgba(255,255,255,0.1);
            border-top: 4px solid #ef4444;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h1 { font-size: 1.5rem; margin-bottom: 10px; font-weight: 900; text-transform: uppercase; }
        p { color: #a1a1aa; }
    </style>
    
    <!-- Redirecionamento planejado para respeitar o robô do WhatsApp -->
    <script>
        // Apenas redireciona se não for um rastro (crawler) de rede social
        const isCrawler = /bot|googlebot|facebookexternalhit|whatsapp|telegram/i.test(navigator.userAgent);
        if (!isCrawler) {
            setTimeout(() => {
                window.location.replace("${redirectUrl}");
            }, 2500);
        }
    </script>
    
    <!-- Fallback caso o JS falhe -->
    <meta http-equiv="refresh" content="4;url=${redirectUrl}">
</head>
<body>
    <div class="loader"></div>
    <h1>${productData.name}</h1>
    <p>Estamos preparando sua experiência... Você será redirecionado em instantes.</p>
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
