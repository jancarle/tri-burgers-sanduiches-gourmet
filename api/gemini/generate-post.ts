import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Garantir que é POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("ERRO: GEMINI_API_KEY não configurada no ambiente.");
      return res.status(500).json({ 
        error: "Configuração do servidor incompleta.",
        message: "Chave de API GEMINI_API_KEY não encontrada nas variáveis de ambiente." 
      });
    }

    const { product, shareLink } = req.body;

    if (!product || !shareLink) {
      return res.status(400).json({ error: "Dados do produto ou link de compartilhamento ausentes." });
    }

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
      
      Retorne APENAS o texto pronto para copiar e colar. Sem introduções.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    const text = response.text;

    if (!text) {
      throw new Error("A IA retornou um resultado vazio.");
    }

    // Sucesso absoluto: Retorno JSON limpo
    return res.status(200).json({
      success: true,
      text: text
    });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Fallback de erro sempre em JSON
    return res.status(500).json({
      error: "Erro na geração do post",
      message: error?.message || "Erro desconhecido no processamento da IA."
    });
  }
}
