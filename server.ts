import express from "express";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

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

  // Rota para metadados dinâmicos (Open Graph) - Para o WhatsApp puxar a imagem do produto específico
  app.get("/share/:productId", async (req, res) => {
    const { productId } = req.params;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    let productData = {
      name: "Delícia da Lanchonete",
      description: "Confira nosso cardápio completo!",
      image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=1000"
    };

    if (adminInitialized) {
      try {
        const doc = await admin.firestore().collection("menu").doc(productId).get();
        if (doc.exists) {
          const data = doc.data();
          productData = {
            name: data?.name || productData.name,
            description: data?.description ? `${data.description.substring(0, 150)}... Clique para ver mais!` : productData.description,
            image: data?.image || productData.image
          };
          
          // Se o preço existir, adiciona à descrição
          if (data?.price) {
            const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.price);
            productData.description = `${formattedPrice} - ${productData.description}`;
          }
        }
      } catch (err) {
        console.error("Erro ao buscar produto para OG:", err);
      }
    }

    // Garante que a imagem seja um URL absoluto
    if (productData.image && !productData.image.startsWith('http')) {
      productData.image = `${baseUrl}${productData.image.startsWith('/') ? '' : '/'}${productData.image}`;
    }

    const redirectUrl = `${baseUrl}/?p=${productId}`;

    const html = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${productData.name}</title>
    
    <!-- Open Graph / Meta Tags para WhatsApp/Redes Sociais -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="${productData.name}">
    <meta property="og:description" content="${productData.description}">
    <meta property="og:image" content="${productData.image}">
    <meta property="og:url" content="${redirectUrl}">
    <meta property="og:site_name" content="Cardápio Digital">
    
    <!-- Meta tags adicionais para Twitter e outros -->
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
            background-color: #f8f9fa;
            color: #333;
            text-align: center;
        }
        .loader {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #e11d48;
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
        h1 { font-size: 1.5rem; margin-bottom: 10px; }
        p { color: #666; }
    </style>
    
    <!-- Redirecionamento instantâneo via JS -->
    <script>
        setTimeout(() => {
            window.location.href = "${redirectUrl}";
        }, 500);
    </script>
    
    <!-- Fallback caso o JS falhe -->
    <meta http-equiv="refresh" content="3;url=${redirectUrl}">
</head>
<body>
    <div class="loader"></div>
    <h1>${productData.name}</h1>
    <p>Estamos te levando para o cardápio...</p>
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
      Foque em DESEJO e FOMO (medo de ficar de fora).
      
      DADOS DO PRODUTO:
      Nome: ${product.name}
      Ingredientes: ${product.description}
      Preço: ${product.price}
      Categoria: ${product.category}
      
      ESTRUTURA OBRIGATÓRIA (Siga exatamente):
      1. TÍTULO DE IMPACTO: Comece com um título em CAPS LOCK que desperte a fome/curiosidade + 1 emoji.
      
      2. CORPO DO TEXTO (Storytelling): 2 a 3 parágrafos curtos no tom "Amigo indicando a melhor comida da vida". Use *negrito* nas palavras chave.
      
      3. LISTA DE DELÍCIAS: Liste os principais ingredientes de forma organizada usando o emoji ✅ como marcador.
      
      4. PREÇO DESTACADO: Coloque o preço em uma linha isolada de forma chamativa.
      
      5. LINK DA FOTO: Coloque o link abaixo em uma linha separada:
      ${shareLink}
      
      6. CALL TO ACTION: Uma frase final convidando a pedir agora + emojis.
      
      REGRAS VISUAIS:
      - Use DUAS QUEBRAS DE LINHA entre cada seção.
      - Use APENAS estes emojis: 🍔, 🔥, 🤤, 🍟, 🥤, ✅, 🥓, ✨, 📦, 📍, 🚀.
      - Formate com *Asteriscos* para negrito (padrão WhatsApp).
      
      Retorne APENAS o texto pronto para copiar e colar. Sem introduções ou explicações.
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
