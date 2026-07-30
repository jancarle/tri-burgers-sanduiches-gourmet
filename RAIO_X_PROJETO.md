# 📋 DOC | RAIO-X COMPLETO DO PROJETO — TRI BURGERS DELIVERY & AGÊNCIA IMPÉRIO

Este documento serve como **mapeamento técnico definitivo (Raio-X)** da sua aplicação de Delivery e Painel de Marketing. Ele foi projetado para servir como um guia de restauração, suporte, compreensão estrutural e segurança caso você precise migrar, recriar do zero ou duplicar a aplicação para outros clientes.

---

## 1. 🔍 VISÃO GERAL DA ARQUITETURA

O sistema é uma aplicação **Full-Stack (Vite + React com Express)** integrada a serviços de nuvem modernos para banco de dados, storage de imagens e inteligência artificial generativa.

### Estilos & Tecnologias Principais:
- **Frontend**: React 19 (SPA) + Router DOM v6 + Tailwind CSS (estilo visual responsivo premium no tema Dark e Slate).
- **Backend**: Express.js (executado por servidor Node localmente ou rotas Serverless `/api/*` em ambientes como Vercel).
- **Banco de Dados (DB)**: Firebase Cloud Firestore para persistência em nuvem segura de produtos, pedidos e configurações.
- **Autenticação**: Firebase Authentication (autenticação baseada em e-mail/senha).
- **Inteligência Artificial**: SDK oficial do Gemini (`@google/genai`) para copywriting viral corporativo.
- **Armazenamento de Imagens**: Cloudinary integrado via Node/Multer e backend seguro para evitar vazamento de credenciais na web.

---

## 2. 📂 MAPEAMENTO DOS ARQUIVOS CHAVE (ESTRUTURA DE DIRETÓRIOS)

Ao recriar o projeto do zero, estas são as funções exatas de cada arquivo no diretório raiz:

```bash
├── package.json                   # Dependências npm, scripts de build (Fast-Build CJS)
├── metadata.json                  # Metadados do applet de visualização e permissões do frame
├── firestore.rules                # Regras críticas de segurança de leitura/escrita do Firestore
├── firebase-blueprint.json        # Esquema inicial sugerido de coleções Firestore
├── server.ts                      # Servidor principal Express rodando em desenvolvimento/Cloud Run
├── api/
│   ├── server.ts                  # Cópia servidora adaptada para serverless do Express
│   └── gemini/
│       └── generate-post.ts       # Endpoint serverless exclusivo para geração de posts de WhatsApp
├── src/
│   ├── main.tsx                   # Entrada e montagem de componentes React
│   ├── App.tsx                    # Roteador principal e tratamento de loja suspensa / licenciamento
│   ├── constants.ts               # Slogans, depoimentos, cardápio estático base e WhatsApp de testes
│   ├── types.ts                   # Definição e interfaces de tipos TypeScript de todo o sistema
│   ├── index.css                  # Inicialização global do Tailwind CSS e fontes do Google
│   ├── pages/
│   │   ├── Home.tsx               # Landing page premium pública com carrossel de fotos, depoimentos e FAQ
│   │   ├── Menu.tsx               # Cardápio interativo público com gerenciamento de carrinho e checkout
│   │   ├── Contact.tsx            # Informações de endereço e contato integrados
│   │   ├── AdminPanel.tsx         # Painel administrativo da Hamburgueria (gerenciador de cardápio e posts)
│   │   ├── AdminPanel.tmp.tsx     # Cópia temporária/backup para segurança em desenvolvimento
│   │   └── MasterAdmin.tsx        # Área administrativa da Agência (Apenas marketingjan@gmail.com)
│   └── components/                # Componentes globais (botão do WhatsApp, footer dinâmico, etc)
```

---

## 3. 🛡️ SEGURANÇA E PROTEÇÃO DE DADOS

O projeto foi blindado contra invasões e vazamento de chaves usando segurança em múltiplas camadas:

### 1) Regras do Firestore (`firestore.rules`)
O banco de dados do Firebase Firestore é protegido na raiz. Ninguém, exceto os administradores autorizados, pode ler ou escrever informações de configurações globais ou produtos:
- **Acesso Público**: Permite apenas leituras para as coleções públicas (`products`, `settings`) por clientes visualizando o cardápio.
- **Controle Administrativo**: Operações de mutação (criar, atualizar, deletar de produtos) exigem autenticação do Firebase.
- **Autenticação Direta**: Protegido por Token no nível do token do e-mail do usuário autenticado no Firebase Auth:
  - `marketingjan@gmail.com` (Master Admin / Agência)
  - `triburgershamburgueria@gmail.com` (Nova cliente com nível operacional)

### 2) Camada de Criptografia Interna (AES-256-GCM)
Para evitar que terceiros acessem chaves de API do Gemini salvas no painel de administração:
- O servidor Express utiliza uma chave de criptografia de 32 caracteres definida na variável `SERVER_ENCRYPTION_KEY`.
- Se o usuário salvar sua chave Gemini no banco, ela é criptografada no banco e descriptografada **apenas na memória do servidor** quando chamadas à IA forem efetuadas.

### 3) Backend-Proxy para APIs
Nenhuma chave de API (Gemini ou Cloudinary) é exposta ao código que roda no navegador do cliente (frontend). Todas as chamadas para IA e uploads de arquivos são efetuadas por endpoints seguros `/api/*`.

---

## 4. 🧠 INTEGRAÇÃO COM INTELIGÊNCIA ARTIFICIAL (GEMINI)

Após as recentes atualizações corretivas para mitigar falhas de suporte ao modelo em bibliotecas depreciadas, a integração com o Gemini foi atualizada para os padrões mais modernos do Google:

### O que foi corrigido:
Anteriormente, o sistema utilizava a biblioteca depreciada `@google/generative-ai` com referências a modelos antigos (`gemini-2.5-flash-preview` ou `gemini-1.5-flash` especificando API v1beta direto em query string). Isso gerava erros `404 Not Found` por obsolescência de chamada do endpoint do Google.

### Estado atual da IA:
- **SDK Oficial**: `@google/genai` (A biblioteca moderna do Google que gerencia chamadas estáveis automaticamente).
- **Modelo Oficial**: `gemini-3-flash-preview` (Extremamente rápido, otimizado para copywriting de marketing em português do Brasil, utilizando emojis corretos de hamburgueria/bebidas e formatação nativa para WhatsApp com textos em negritos e espaçamentos magnéticos).
-**Arquivos modificados**: `/api/gemini/generate-post.ts`, `/server.ts` e `/api/server.ts` agora usam o novo modelo de inicialização lazy e seguro.

---

## 5. 👥 CONTROLE DE ACESSO OPERACIONAL (NOVO RECURSO IMPLEMENTADO)

Implementamos um controle de níveis de privilégio para permitir a entrega do painel de administração da Hamburgueria para a cliente sem dar acesso às engrenagens internas da agência.

### Mapeamento dos E-mails:
1. **Administrador Master (Agência Império)**: `marketingjan@gmail.com`
   - Tem acesso integral ao painel de administração operacional da Tri Burgers.
   - Tem acesso **exclusivo** ao painel **MasterAdmin (Gerenciador da Agência)** para configurações globais, controle de licenciamento de domínio, relatórios e chaves macro.
   - Marcado internamente pela variável `isAgencyOwner` no código.
2. **Operacional Cliente (Tri Burgers)**: `triburgershamburgueria@gmail.com`
   - Tem acesso de leitura e escrita ao painel Admin da Hamburgueria (`/admin`).
   - Pode adicionar produtos, alterar preços, gerenciar estoque, fazer upload de imagens de lanches via Cloudinary, e gerar posts de marketing usando a IA do Gemini.
   - **NÃO CONSEGUE** acessar a área de Agência ou modificar licenças administrativas do sistema. Se tentar forçar entrada, o sistema bloqueia e redireciona.

---

## 6. 📱 POLÍTICA DO WHATSAPP DE TESTES

Para evitar disparos indesejados com pedidos fictícios ou testes de clientes para o telefone oficial de atendimento da Tri Burgers e manter a segurança de implantação:
- O número de WhatsApp foi intencionalmente mantido apontado para o **número de testes atual** nos botões de pedido, carrinho, checkout, botões flutuantes e links de redirecionamento.
- **Número mantido**: `5562994805695` (Definido globalmente no arquivo `/src/constants.ts` em `WHATSAPP_CONFIG`).
- Quando os testes finais da cliente forem concluídos por você, basta alterar unicamente o telefone em `WHATSAPP_CONFIG.number` no arquivo `/src/constants.ts`.

---

## 7. ⚙️ VARIÁVEIS DE AMBIENTE (.env.example)

Para clonar e replicar o projeto em um novo servidor ou Vercel de forma limpa, configure as seguintes variáveis descritas no seu `.env.example`:

| Nome da Variável | Função / Descrição |
| :--- | :--- |
| `FIREBASE_SERVICE_ACCOUNT` | JSON de credenciais administrativas do Firebase Admin para autenticar o backend do Express de forma segura. |
| `VITE_FIREBASE_API_KEY` | Chave de API pública para visualização e SDK cliente do Firebase do projeto. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domínio de autenticação padrão gerado pelo Firebase. |
| `VITE_FIREBASE_PROJECT_ID` | Identificador único do banco de dados/projeto no Firebase Console. |
| `VITE_FIREBASE_STORAGE_BUCKET` | Nome do contêiner de arquivos Cloud Storage se houver uso. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Chave remota para notificações ou controle de mensagens. |
| `VITE_FIREBASE_APP_ID` | Código identificador único do aplicativo cliente Web cadastrado. |
| `VITE_FIREBASE_DATABASE_ID` | Identificador de banco complementar se configurado (opcional). |
| `GEMINI_API_KEY` | Chave mestre de acesso de faturamento do Google AI Studio para geração de textos por IA. |
| `CLOUDINARY_CLOUD_NAME` | Nome da nuvem do Cloudinary usada para armazenar fotos de produtos publicamente. |
| `CLOUDINARY_API_KEY` | Chave de API única de acesso para upload no Cloudinary. |
| `CLOUDINARY_API_SECRET` | Chave secreta de autenticação e autenticidade para Cloudinary. |
| `SERVER_ENCRYPTION_KEY` | Sequência aleatória forte de 32 caracteres usada para criptografia interna local. |
| `VITE_APP_URL` | URL pública de produção do seu frontend (utilizado para geração estática e links). |
| `APP_URL` | Espelhamento de URL para o backend e redirecionamentos seguros de domínio. |

---

## 8. 🚀 RECOMENDAÇÕES E EVOLUÇÕES PARA O FUTURO

Se o sistema precisar ser ampliado ou escalado comercialmente:
1. **Domínio de Multi-Tenancy**: Atualmente o banco de dados compartilha coleções diretas. Para vender este serviço para outras 10 hamburguerias, deve-se adicionar um prefixo (como `tenantId` ou `storeId`) nos documentos Firestore, fazendo com que cada painel de cliente visualize apenas o id correspondente.
2. **Integração de SEO e IA (GEO AI / Google Maps)**: Para ser indexador e impulsionado de forma orgânica pelo Google e pelas IAs (GEO AI, Ask Maps, Gemini Overview), recomendamos adicionar tags JSON-LD (Schema.org de restaurante) no cabeçalho do `index.html` de forma estrita, garantindo que o robô do Google Extraia endereço, horário de funcionamento e avaliações instantâneas.
3. **Backup Automatizado do Firestore**: Configure uma rotina no Google Cloud Storage do Firebase para exportar as coleções semanalmente. Isso garante restauração em um clique caso e-mails adicionais façam edições errôneas.
