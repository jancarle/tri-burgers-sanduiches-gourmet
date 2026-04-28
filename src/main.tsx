import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * TRI BURGERS - ARQUITETURA DE SEO & GEO (Generative Engine Optimization)
 * 
 * Este projeto foi otimizado para ser "AI-Ready" (Pronto para IAs), seguindo as 
 * diretrizes de GEO, AIO (AI Overviews) e E-E-A-T.
 * 
 * ESTRATÉGIAS IMPLEMENTADAS:
 * 1. Dados Estruturados (JSON-LD): Localizado no index.html, define a entidade 
 *    'Restaurant' de forma robusta para o Google Knowledge Graph e IAs.
 * 2. Semântica HTML5: Uso rigoroso de <main>, <article>, <section> e 
 *    aria-labels para facilitar o "parsing" por web crawlers e LLMs.
 * 3. E-E-A-T (Experiência, Especialidade, Autoridade e Confiabilidade): 
 *    Páginas institucionais com dados reais, datas de fundação (2012) e 
 *    fotos de campo autênticas para validar a originalidade do conteúdo.
 * 4. Local SEO (GEO): Meta tags geográficas e citações precisas de endereço 
 *    (Setor Leste Vila Nova) para dominar buscas locais em Goiânia.
 * 5. Documentação Interna: Comentários estratégicos no código para guiar 
 *    futuras manutenções de indexação.
 */

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
