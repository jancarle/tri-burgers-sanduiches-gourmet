import express from "express";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

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

// Inicialização robusta do Firebase Admin
let adminInitialized = false;
try {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!rawServiceAccount) {
    console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT não configurada. Funcionalidades de Admin (OG, Push) estão limitadas.");
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
    console.log("🔥 Firebase Admin inicializado com sucesso!");
  }
} catch (error) {
  console.error("❌ Erro crítico ao inicializar o Firebase Admin:", error instanceof Error ? error.message : error);
  adminInitialized = false;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

const DATABASE_ID = "ai-studio-e7104e09-5d7d-4fb2-be51-883f71432273";

  // Rota para metadados dinâmicos (Open Graph) - Para o WhatsApp puxar a imagem do produto específico
  app.get("/share/:productId", async (req, res) => {
    const { productId } = req.params;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
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
        console.log(`🔍 [DEV] Buscando no DB ${DATABASE_ID}: ${productId}`);
        const db = getFirestore(DATABASE_ID);
        
        // Timeout para não travar a resposta caso o Firestore demore
        const docPromise = db.collection("menu").doc(productId).get();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500));
        
        const doc = await Promise.race([docPromise, timeoutPromise]) as admin.firestore.DocumentSnapshot;

        if (doc.exists) {
          const data = doc.data();
          foundInDB = true;
          console.log(`✅ [DEV] Produto REAL encontrado: ${data?.name}`);
          
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
        }
      } catch (err) {
        console.error("❌ Erro ao buscar produto para OG:", err);
      }
    }

    // Garante que a imagem seja um URL absoluto
    if (productData.image && !productData.image.startsWith('http')) {
      productData.image = `${baseUrl}${productData.image.startsWith('/') ? '' : '/'}${productData.image}`;
    }

    const shareUrl = `${baseUrl}/share/${productId}`;
    const redirectUrl = `${baseUrl}/?p=${productId}`;

    const html = `
<!DOCTYPE html>
<html lang="pt-br" prefix="og: http://ogp.me/ns#">
<head>
    <meta charset="UTF-8">
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
    `;
    res.send(html);
  });

  // Rota segura para IA (Gemini) - Chave protegida no backend para produção na Vercel
  app.post("/api/gemini/generate-post", async (req, res) => {
    const { product, shareLink } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Garante que o retorno seja sempre JSON, mesmo em erro
    if (!apiKey) {
      return res.status(500).json({ 
        error: "Configuração do servidor incompleta: GEMINI_API_KEY não encontrada no ambiente." 
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
      Crie um post de marketing IRRESISTÍVEL para WhatsApp e Instagram.
      FOCO: DESEJO, FOMO e VENDAS RÁPIDAS.

      DADOS DO PRODUTO (USE ESTES DADOS OBRIGATORIAMENTE):
      NOME: "${product.name}"
      DESCRIÇÃO: "${product.description}"
      PREÇO: ${product.price}
      CATEGORIA: ${product.category}
      LINK DA FOTO: ${shareLink}

      REGRAS RÍGIDAS DE CONTEÚDO:
      1. TÍTULO: O post DEVE começar com o nome do produto: "*${product.name.toUpperCase()}* 🍔" em negrito e destaque.
      2. PERSUASÃO: Escreva 2 parágrafos curtos descrevendo por que o cliente PRECISA comer isso agora. Fale do sabor, da suculência e da pressa.
      3. INGREDIENTES: Liste os ingredientes usando emojis ✅.
      4. PREÇO: Destaque o preço em uma linha separada: "*Valor: ${product.price}*".
      5. LINK: Adicione o link ${shareLink} no final com a frase "Veja a foto aqui:".
      6. CTA: Termine com "Clique no link acima para ver a foto real e peça o seu antes que acabe! 🚀🔥".

      REGRAS VISUAIS:
      - Use duas quebras de linha entre cada bloco.
      - Use negrito (*texto*) no nome do produto e no preço.
      - NÃO adicione introduções como "Aqui está seu post". Retorne APENAS o conteúdo para copiar.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      const text = response.text;

      if (!text) {
        throw new Error("A IA retornou um resultado vazio.");
      }

      res.json({ text });
    } catch (error: any) {
      console.error("Erro no processamento da IA:", error);
      res.status(500).json({ 
        error: error.message || "Erro inesperado ao gerar post via IA." 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
