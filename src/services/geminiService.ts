export async function generateMarketingPost(product: {
  id: string;
  name: string;
  description: string;
  price: number | string;
  category: string;
}) {
  try {
    const shareLink = `${window.location.origin}/share/${product.id}`;

    const response = await fetch("/api/gemini/generate-post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ product, shareLink }),
    });

    // 1. Verificar se a resposta é HTML (comum em erros de infraestrutura ou Vercel offline)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const textPreview = await response.text();
      console.error("Resposta não-JSON do servidor:", textPreview.substring(0, 200));
      throw new Error("O servidor retornou uma resposta inválida (HTML). Verifique as chaves e o status da Vercel.");
    }

    const data = await response.json();

    // 2. Verificar erros retornados pela API (formato JSON)
    if (!response.ok) {
      throw new Error(data.message || data.error || `Erro na API (${response.status})`);
    }

    // 3. Validar se o texto existe
    if (!data.text) {
      throw new Error("A IA processou o pedido, mas o texto retornou vazio.");
    }

    return data.text;
  } catch (error: any) {
    console.error("Erro no Gerador de Post:", error);
    // Retornamos uma mensagem amigável que será exibida no lugar do post
    return `⚠️ Não foi possível gerar o post agora.\n\nMotivo: ${error.message || "Erro de conexão"}\n\nPor favor, garanta que a GEMINI_API_KEY está configurada na Vercel e tente novamente.`;
  }
}
