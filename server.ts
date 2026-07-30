import express from "express";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import crypto from 'crypto';

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

// Encryption Utils
const ENCRYPTION_KEY = process.env.SERVER_ENCRYPTION_KEY || 'default-secret-key-32-chars-long-!!!';
const IV_LENGTH = 16;

function encrypt(text: string) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).substring(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (err) {
    console.error("Encryption error:", err);
    return null;
  }
}

function decrypt(text: string) {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).substring(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error("Decryption error:", err);
    return null;
  }
}

// Configuração Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuração Multer
const storageMulter = multer.memoryStorage();
const upload = multer({ 
  storage: storageMulter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

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

  // Rota de Upload Cloudinary Seguro
  app.post("/api/cloudinary/upload", upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "Nenhum arquivo enviado." });
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ success: false, error: "Formato inválido. Use apenas JPG ou PNG." });
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'tri-burgers/products',
          format: 'jpg',
          transformation: [{ width: 1200, crop: "limit", quality: "auto" }]
        },
        (error, result) => {
          if (error || !result) {
            console.error("Cloudinary Error:", error);
            return res.status(500).json({ success: false, error: "Erro no serviço de imagem Cloudinary." });
          }
          return res.json({ success: true, imageUrl: result.secure_url });
        }
      );

      uploadStream.end(req.file.buffer);
    } catch (err: any) {
      console.error("Upload API Error:", err);
      return res.status(500).json({ success: false, error: "Falha interna no upload: " + (err.message || 'Erro desconhecido') });
    }
  });

const DATABASE_ID = "ai-studio-e7104e09-5d7d-4fb2-be51-883f71432273";

  // Rota para salvar a chave Gemini do cliente de forma segura
  app.post("/api/settings/gemini-key", async (req, res) => {
    try {
      const { key } = req.body;
      if (!key || key.trim() === "") {
        return res.status(400).json({ success: false, error: "Chave não fornecida." });
      }

      if (!adminInitialized) {
        console.error("Tentativa de salvar chave Gemini sem Firebase Admin configurado.");
        return res.status(500).json({ 
          success: false, 
          error: "Não foi possível salvar no banco de dados. Verifique a variável FIREBASE_SERVICE_ACCOUNT no Painel da Vercel. No entanto, se você já configurou a GEMINI_API_KEY diretamente na Vercel, ela já deve estar funcionando." 
        });
      }

      const encryptedKey = encrypt(key.trim());
      if (!encryptedKey) throw new Error("Erro ao criptografar a chave.");

      const db = getFirestore(DATABASE_ID);
      await db.collection("settings").doc("gemini").set({
        encryptedKey: encryptedKey,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.json({ success: true, configured: true, message: "Chave configurada com sucesso!" });
    } catch (err: any) {
      console.error("Save Key Error:", err);
      const detailedError = err.message || String(err);
      let userFriendlyError = `Erro ao salvar: ${detailedError}.`;
      
      if (detailedError.includes("UNAUTHENTICATED") || detailedError.includes("16")) {
        userFriendlyError = "Erro 16 (Não Autenticado): O JSON da sua 'FIREBASE_SERVICE_ACCOUNT' foi recusado pelo Google. \n\nSOLUÇÃO:\n1. Vá no Console do Firebase > Configurações > Contas de Serviço.\n2. Gere uma NOVA chave privada.\n3. Copie o JSON INTEIRO e cole aqui nas Settings deste ambiente.";
      }

      return res.status(500).json({ 
        success: false, 
        error: userFriendlyError 
      });
    }
  });

  // Rota para verificar status da chave Gemini - Melhora visibilidade do ambiente (Vercel)
  app.get("/api/settings/status", async (req, res) => {
    try {
      // Prioridade 1: Variável de ambiente (Vercel/AI Studio)
      // Nota: No AI Studio process.env.GEMINI_API_KEY geralmente está presente
      const isConfiguredInEnv = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10;
      
      if (!adminInitialized) {
        return res.json({ 
          isConfigured: isConfiguredInEnv, 
          type: isConfiguredInEnv ? 'environment' : 'none',
          message: isConfiguredInEnv ? 'Usando chave do Ambiente (Vercel/Sistema)' : 'Nenhuma chave encontrada'
        });
      }
      
      const db = getFirestore(DATABASE_ID);
      const doc = await db.collection("settings").doc("gemini").get();
      let isConfiguredInDB = false;
      let decryptionFailed = false;
      
      if (doc.exists) {
        const encrypted = doc.data()?.encryptedKey;
        if (encrypted) {
          const decrypted = decrypt(encrypted);
          if (decrypted && decrypted.trim().startsWith('AIza')) {
            isConfiguredInDB = true;
          } else {
            decryptionFailed = true;
            console.warn("Falha na decriptografia da chave do banco. Possível mismatch de SERVER_ENCRYPTION_KEY.");
          }
        }
      }
      
      return res.json({ 
        isConfigured: isConfiguredInDB || isConfiguredInEnv,
        type: isConfiguredInDB ? 'database' : (isConfiguredInEnv ? 'environment' : 'none'),
        decryptionFailed,
        message: isConfiguredInDB ? 'Chave do cliente ativa' : (decryptionFailed ? 'Erro de Decriptografia (Salve a chave novamente)' : (isConfiguredInEnv ? 'Usando chave do Sistema' : 'Nenhuma chave configurada'))
      });
    } catch (err) {
      const isEnvFallback = !!process.env.GEMINI_API_KEY;
      return res.json({ 
        isConfigured: isEnvFallback, 
        type: isEnvFallback ? 'environment' : 'none',
        message: 'Erro ao verificar status.'
      });
    }
  });

    // Rota para metadados dinâmicos (Open Graph)
    app.get("/share/:productId", async (req, res) => {
      const startTime = Date.now();
      const { productId } = req.params;
      const userAgent = String(req.headers["user-agent"] || "");
      const redirectUrl = `/?p=${productId}`;

      // Detecção de Crawler Social específica
      const isSocialCrawler =
        /facebookexternalhit/i.test(userAgent) ||
        /facebot/i.test(userAgent) ||
        /whatsapp/i.test(userAgent) ||
        /twitterbot/i.test(userAgent) ||
        /linkedinbot/i.test(userAgent) ||
        /telegrambot/i.test(userAgent);

      console.log(`[SHARE] ID: ${productId} | Crawler: ${isSocialCrawler} | UA: ${userAgent}`);

      // Redirecionamento imediato para humanos (Servidor)
      if (!isSocialCrawler) {
        res.setHeader('Vary', 'User-Agent');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        return res.redirect(302, redirectUrl);
      }

      // Configuração para Crawlers
      res.status(200);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Robots-Tag', 'all');
      res.setHeader('Vary', 'User-Agent');
      // Garantir que crawlers recebam sempre a versão mais fresca (zero cache)
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const protocol = req.headers['x-forwarded-proto'] || req.protocol || "https";
      const host = req.get('host') || "tri-burgers-sanduiches-gourmet.vercel.app";
      const baseUrl = process.env.VITE_APP_URL || process.env.APP_URL || `${protocol}://${host}`;
      
      const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=1200&h=630";
      
      // Tenta encontrar nos backups primeiro para resposta imediata
      const backupProduct = MENU_ITEMS_BACKUP.find(i => i.id === productId);

      let productData = {
        name: backupProduct?.name || "Tri Burgers | O Melhor de Goiânia",
        description: "Confira nosso cardápio completo e peça agora o melhor burger artesanal e pit dog de Goiânia!",
        image: backupProduct?.image || DEFAULT_IMAGE
      };

      let foundInDB = false;

      if (adminInitialized) {
        try {
          const db = getFirestore(DATABASE_ID);
          
          const docPromise = db.collection("menu").doc(productId).get();
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000));
          
          const doc = await Promise.race([docPromise, timeoutPromise]) as admin.firestore.DocumentSnapshot;

          if (doc.exists) {
            const data = doc.data();
            foundInDB = true;
            
            productData.name = data?.name || productData.name;
            
            if (data?.image && typeof data.image === 'string' && data.image.trim() !== "") {
              productData.image = data.image.trim();
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
          console.error(`❌ [SHARE] Erro ID ${productId}:`, err instanceof Error ? err.message : err);
        }
      }

      // Garantir imagem absoluta, segura (HTTPS) e válida
      if (!productData.image || productData.image === "") {
        productData.image = DEFAULT_IMAGE;
      }

      if (typeof productData.image === 'string') {
        let imgUrl = productData.image;
        if (!imgUrl.startsWith('http')) {
          const cleanImgPath = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
          imgUrl = `${baseUrl}${cleanImgPath}`;
        }
        if (imgUrl.startsWith('http://')) {
          imgUrl = imgUrl.replace('http://', 'https://');
        }
        productData.image = imgUrl;
      }

      const shareUrl = `${baseUrl}/share/${productId}`;
      const duration = Date.now() - startTime;
      console.log(`✅ [SHARE] Finalizado em ${duration}ms | Imagem: ${productData.image}`);

      res.send(`<!DOCTYPE html>
<html lang="pt-br" prefix="og: http://ogp.me/ns#">
<head>
    <meta charset="UTF-8" />
    <title>${productData.name} | Tri Burgers</title>
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${shareUrl}" />
    <meta property="og:title" content="${productData.name}" />
    <meta property="og:description" content="${productData.description}" />
    <meta property="og:site_name" content="Tri Burgers" />
    <meta property="og:image" content="${productData.image}" />
    <meta property="og:image:secure_url" content="${productData.image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:image" content="${productData.image}">
</head>
<body style="background: #000; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
    <p>Redirecionando para o cardápio...</p>
</body>
</html>`);
    });

  // Rota segura para IA (Gemini) - Usa a chave do cliente se existir, caso contrário tenta a global
  app.post("/api/gemini/generate-post", async (req, res) => {
    try {
      const { product, shareLink } = req.body;
      let apiKey = null;

      // 1. Tentar buscar chave do cliente no banco (Prioridade Total)
      if (adminInitialized) {
        const db = getFirestore(DATABASE_ID);
        const settingsDoc = await db.collection("settings").doc("gemini").get();
        if (settingsDoc.exists) {
          const encrypted = settingsDoc.data()?.encryptedKey;
          if (encrypted) {
            const decrypted = decrypt(encrypted);
            // Validar se a chave parece legítima (inicia com AIza para Google API)
            if (decrypted && decrypted.startsWith('AIza')) {
              apiKey = decrypted;
            } else {
              console.warn("Chave decriptografada parece inválida ou de outra versão. Usando fallback.");
            }
          }
        }
      }

      // 2. Fallback para a chave de ambiente (Vercel / AI Studio)
      if (!apiKey || apiKey === "") {
        console.log("Tentando fallback para GEMINI_API_KEY do ambiente...");
        apiKey = process.env.GEMINI_API_KEY;
      }

      if (!apiKey || apiKey === "" || apiKey === "YOUR_GEMINI_API_KEY") {
        return res.status(400).json({ 
          success: false, 
          error: "Chave Gemini não configurada. Informe sua chave no painel para que o sistema possa gerar os posts. A chave do ambiente parece estar vazia ou ser um placeholder." 
        });
      }

      console.log(`Usando chave Gemini (Início: ${apiKey.substring(0, 8)}...) - Origem: ${apiKey === process.env.GEMINI_API_KEY ? 'Ambiente' : 'Banco de Dados'}`);
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      
      const prompt = `
      Crie um post de marketing IRRESISTÍVEL para WhatsApp.
      FOCO: DESEJO, FOMO e VENDAS RÁPIDAS.

      DADOS DO PRODUTO (USE ESTES DADOS OBRIGATORIAMENTE):
      NOME: "${product.name}"
      DESCRIÇÃO: "${product.description}"
      PREÇO: ${product.price}
      LINK DA FOTO: ${shareLink}

      REGRAS RÍGIDAS DE CONTEÚDO:
      1. TÍTULO: O post DEVE começar com o nome do produto em negrito. Ex: "*X-TUDO ESPECIAL*"
      2. PERSUASÃO: Escreva 2 parágrafos curtos descrevendo por que o cliente PRECISA comer isso agora. Fale do sabor e suculência.
      3. INGREDIENTES: Liste os ingredientes usando emojis.
      4. PREÇO: Destaque o preço em uma linha separada.
      5. LINK: Adicione o link ${shareLink} no final.
      6. CTA: Termine com uma chamada forte para ação.

      REGRAS VISUAIS:
      - Use quebras de linha entre cada bloco.
      - Use negrito (*texto*) no nome do produto e no preço.
      - NÃO adicione introduções. Retorne APENAS o conteúdo.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      const text = response.text;

      if (!text) {
        throw new Error("A IA retornou um resultado vazio.");
      }

      return res.json({ text });
    } catch (error: any) {
      console.error("Erro no processamento da IA:", error);
      
      let errorMessage = "Erro inesperado ao gerar post via IA.";
      
      // Detecção refinada de erros de autenticação e quota
      const errStr = error.message || String(error);
      if (errStr.includes("API_KEY_INVALID") || errStr.includes("UNAUTHENTICATED") || errStr.includes("401") || errStr.includes("403")) {
        errorMessage = "Chave Gemini Rejeitada (Erro 401/403): A chave fornecida é inválida ou expirou. Se você salvou a chave no Vercel, você deve salvá-la NOVAMENTE aqui no Preview, pois as chaves de criptografia são diferentes.";
      } else if (errStr.includes("quota") || errStr.includes("429") || errStr.includes("limit")) {
        errorMessage = "Limite de Cotas (Quota Exceeded): A chave atingiu o limite de requisições gratuitas do Google. Se você estiver usando a chave padrão do sistema, ela pode estar congestionada. Recomendamos gerar sua própria chave gratuita no Google AI Studio e salvá-la no painel.";
      } else if (errStr.includes("User location is not supported")) {
        errorMessage = "Região Não Suportada: A API Gemini ainda não está disponível em sua região geográfica atual.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      return res.status(500).json({ 
        success: false,
        error: errorMessage
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
