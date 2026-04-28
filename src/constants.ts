import { MenuItem, Category } from './types';

export const CATEGORIES: Category[] = [
  'Burgers Gourmet',
  'Sanduíches Tradicionais',
  'Combos',
  'Beirute',
  'Pão Sírio',
  'Batata Frita',
  'Sobremesas',
  'Cremes',
  'Sucos',
  'Bebidas',
  'Adicionais',
  'Novidades'
];

export const SLOGANS = [
  "Onde a suculência encontra a perfeição artesanal.",
  "Desde 2012, o padrão ouro do burger em Goiás.",
  "Tri Burgers: Três vezes mais sabor, zero arrependimentos.",
  "Não é apenas um lanche. É um ritual gastronômico.",
  "Sabor que explode. Tradição que impõe respeito."
];

export const HEADLINES = [
  "O BURGER QUE VAI DOMINAR SEUS SENTIDOS.",
  "SUCULÊNCIA QUE VOCÊ NÃO APENAS COME, VOCÊ SENTE.",
  "A LENDA DO SABOR ARTESANAL DESDE 2012.",
  "PARE DE APENAS COMER. COMECE A DEGUSTAR O MELHOR.",
  "O PONTO PERFEITO. O BLEND SECRETO. A SUA NOVA OBSESSÃO."
];

export const BUTTON_TEXTS = {
  primary: "EU QUERO ESSA EXPLOSÃO DE SABOR",
  secondary: "PEDIR AGORA (CHEGA EM MINUTOS)",
  menu: "EXPLORAR CARDÁPIO SUPREMO",
  whatsapp: "GARANTIR MEU BURGER NO WHATSAPP"
};

export const WHATSAPP_CONFIG = {
  number: '5562991778064',
  baseUrl: 'https://api.whatsapp.com/send'
};

export const SOCIAL_PROOF = [
  {
    name: "Sara Eduarda",
    comment: "Ótimo estabelecimento, atendentes super até atenciosos com o pedido.",
    stars: 5,
    role: "Avaliação no Google"
  },
  {
    name: "Robinson Pontes",
    comment: "Ambiente agradável, limpeza e higiene ok Lanche maravilhoso, super índico",
    stars: 5,
    role: "Avaliação no Google"
  },
  {
    name: "Lorena Rodrigues",
    comment: "Perfeito, adoro o molho verde o melhor da região, xtudo de frango meu favorito!!",
    stars: 5,
    role: "Avaliação no Google"
  }
];

export const FAQ_DATA = [
  {
    question: "Vocês entregam no meu bairro?",
    answer: "Entregamos em toda a região central e bairros adjacentes. Clique no WhatsApp e envie sua localização para confirmarmos a taxa de entrega!"
  },
  {
    question: "Quais as formas de pagamento?",
    answer: "Aceitamos Pix, Cartões de Crédito e Débito (levamos a maquininha) e Dinheiro."
  },
  {
    question: "Quanto tempo demora o delivery?",
    answer: "Nosso tempo médio é de 30 a 50 minutos, dependendo da sua localização e do volume de pedidos."
  },
  {
    question: "Os hambúrgueres são artesanais?",
    answer: "Sim! Todos os nossos burgers gourmet são feitos com blends de carnes selecionadas e moídas diariamente."
  },
  {
    question: "Tem opção para crianças?",
    answer: "Sim! Temos o Burger Kid's e o Combo Kids, pensados especialmente para o paladar dos pequenos."
  }
];

export const MENU_ITEMS: MenuItem[] = [
  // PROMOÇÃO DESTAQUE / WHATSAPP - ADDED VIA AI
  {
    id: 'combo-promocional-xtudao',
    name: '🔥 Combo X-Tudão Duplo + Fritas + Refri 1L',
    description: 'A promoção imperdível de hoje: 2x X-Tudão + Porção de Fritas Dupla + Guaraná Antarctica 1L. Só por tempo limitado!',
    price: 69.00,
    category: 'Combos',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=800', // You can replace this if they provide the exact image URL
    highlight: true
  },
  // BURGERS GOURMET
  {
    id: 'g1',
    name: 'Burger Gourmet',
    description: 'Pão brioche, carne bovina 100G, duplo queijo Mussarela, Alface americana, tomate e molhos da casa (M. Ervas/ M. Barbecue)',
    price: 22.00,
    category: 'Burgers Gourmet',
    image: '/tri-burgers-gourmet.jpg',
    highlight: true
  },
  {
    id: 'g2',
    name: 'Clássico',
    description: 'Pão brioche com gergelin carne bovina 150G duplo queijo duplo bacon, alface americana, tomate e molhos da casa (M. Ervas/ M. Barbecue)',
    price: 29.99,
    category: 'Burgers Gourmet',
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&q=80&w=800',
    highlight: true
  },
  {
    id: 'g3',
    name: 'Premium',
    description: 'Pão Prime gergelin misto selado na manteiga, hambúrguer Costela 150G, duplo bacon e cheddar, cebola Roxa e molhos da casa (M. Ervas/ M. Barbecue)',
    price: 32.00,
    category: 'Burgers Gourmet',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=800',
    highlight: true
  },
  {
    id: 'g4',
    name: 'Premium Duplo',
    description: 'Pão prime gergelin misto selado na manteiga, 2 hambúrguer Picanha, duplo cheddar, 4 bacon, cebola Roxa e molhos da casa (M. Ervas/ M. Barbecue)',
    price: 39.00,
    category: 'Burgers Gourmet',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'g4_trip',
    name: 'Premium Triplo',
    description: 'Pão prime gergelim, 3 hambúrgueres Picanha, triplo cheddar, muito bacon, cebola Roxa e molhos da casa',
    price: 49.00,
    category: 'Burgers Gourmet',
    image: 'https://images.unsplash.com/photo-1608767221051-2b9d18f35a1f?auto=format&fit=crop&q=80&w=800',
    highlight: true
  },
  {
    id: 'g5',
    name: "Burger Kid's",
    description: 'Pão de leite, carne bovina 100G, cheddar e molho especial.',
    price: 22.00,
    category: 'Burgers Gourmet',
    image: 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?auto=format&fit=crop&q=80&w=800'
  },

  // COMBOS
  {
    id: 'c1_xtudo_fritas',
    name: 'Super Combo: X Tudo 🍔 + Fritas 100g 🍟',
    description: 'X Tudo: Pão de hambúrguer com gergelim, Hambúrguer caseiro 100g, queijo mussarela, bacon, Presunto, ovo, salsicha, alface americana, tomate, milho e batata palha. Acompanhamentos: molho verde, barbecue, maionese bnc, Maionese Picanha, ketchup e mostarda.',
    price: 38.00, // Preço sugestivo, o admin pode alterar no firebase depois
    category: 'Combos',
    highlight: true,
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'c1',
    name: 'Combo Kids',
    description: 'Burger Kid\'s + Fritas + Suco',
    price: 23.00,
    category: 'Combos',
    image: 'https://images.unsplash.com/photo-1534790566855-4cb788d389ec?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'c2',
    name: 'Burger Gourmet Combo',
    description: 'Burger Gourmet + Fritas + Refri',
    price: 28.00,
    category: 'Combos',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'c3',
    name: 'Burger Clássico Combo',
    description: 'Burger Clássico + Fritas + Refri',
    price: 35.00,
    category: 'Combos',
    image: 'https://images.unsplash.com/photo-1610614819513-58e34989848b?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'c4',
    name: 'Burger Premium Combo',
    description: 'Burger Premium + Fritas + Refri',
    price: 39.99,
    category: 'Combos',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'c5',
    name: 'Premium Duplo Combo',
    description: 'Premium Duplo + Fritas + Refri',
    price: 45.00,
    category: 'Combos',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'c6',
    name: 'Burguer Tudo Combo (com Suco)',
    description: 'Burguer Tudo + Fritas + Suco',
    price: 39.00,
    category: 'Combos',
    image: 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'c7',
    name: 'Burguer Tudo Combo (com Refri)',
    description: 'Burguer Tudo + Fritas + Refri',
    price: 35.00,
    category: 'Combos',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'c8',
    name: 'Combo Casal em Dobro',
    description: '2 Sanduíches + Fritas em DOBRO + Guaraná 1L',
    price: 69.00,
    category: 'Combos',
    highlight: true,
    image: 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?auto=format&fit=crop&q=80&w=800'
  },

  // BEIRUTE E PÃO SÍRIO
  {
    id: 'b1',
    name: 'Beirute Filé de Frango',
    description: 'Para 2 Pessoas. Acompanha Batata Frita 150g. Pão Sírio, 2 frangos, 4 queijos, orégano, azeite e salada',
    price: 59.00,
    category: 'Beirute',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'b2',
    name: 'Beirute Filé Mignon',
    description: 'Para 2 Pessoas. Acompanha Batata Frita 150g. Pão Sírio, 2 filés, 4 queijos, orégano, azeite e salada',
    price: 59.00,
    category: 'Beirute',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'b3',
    name: 'Sanduíche Pão Sírio Frango Light',
    description: 'Pão Sírio, 1 frango, 2 queijos e salada',
    price: 29.00,
    category: 'Pão Sírio',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'b4',
    name: 'Sanduíche Pão Sírio Filé Mignon',
    description: 'Pão Sírio, 1 filé mignon, 2 queijos e salada',
    price: 29.00,
    category: 'Pão Sírio',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800'
  },

  // PORÇÕES
  {
    id: 'p1',
    name: 'Batata Frita 500g',
    description: 'Porção inteira de batata frita',
    price: 35.00,
    category: 'Batata Frita',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'p2',
    name: 'Batata Frita 1/2 Porção',
    description: 'Meia porção de batata frita',
    price: 25.00,
    category: 'Batata Frita',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=800'
  },

  // SOBREMESAS E CREMES
  {
    id: 's1',
    name: 'Açaí 500ml no Copo',
    description: 'Granola, Leite Ninho, Leite Condensado, Morango e Banana',
    price: 25.00,
    category: 'Sobremesas',
    image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 's2',
    name: 'Açaí na Barca',
    description: 'Açaí luxuoso na barca com Granola, Leite Ninho, Leite Condensado, Morango e Banana',
    price: 49.00,
    category: 'Sobremesas',
    highlight: true,
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 's3',
    name: 'Cremes 500ml',
    description: 'Escolha o seu sabor favorito',
    price: 19.99,
    priceText: 'R$ 19,99',
    category: 'Cremes',
    image: 'https://images.unsplash.com/photo-1553177595-4de2bb0842b9?auto=format&fit=crop&q=80&w=800',
    meatOptions: [
      { name: 'Creme de Maracujá', price: 19.99 },
      { name: 'Creme de Morango', price: 19.99 },
      { name: 'Creme de Cupuaçu', price: 19.99 },
      { name: 'Creme de Acerola', price: 19.99 },
      { name: 'Creme de Açaí', price: 19.99 }
    ]
  },

  // SUCOS E BEBIDAS
  {
    id: 'd1',
    name: 'Sucão Natural 500ml',
    description: 'Sabores naturais e refrescantes',
    price: 13.00,
    priceText: 'R$ 13,00',
    category: 'Sucos',
    image: '/sucos.jpeg',
    meatOptions: [
      { name: 'Suco de Laranja', price: 13.00 },
      { name: 'Suco de Maracujá', price: 13.00 },
      { name: 'Suco de Morango', price: 13.00 },
      { name: 'Suco de Cupuaçu', price: 13.00 },
      { name: 'Suco de Abacaxi', price: 13.00 },
      { name: 'Suco de Acerola', price: 13.00 }
    ]
  },
  {
    id: 'd2',
    name: 'Refrigerantes',
    description: 'Escolha o tamanho ideal para sua sede',
    price: 6.00,
    priceText: 'A partir de R$ 6,00',
    category: 'Bebidas',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800',
    meatOptions: [
      { name: 'Refri Lata 350ml', price: 6.00 },
      { name: 'Refri 600ml', price: 9.00 },
      { name: 'Refri 1 Litro', price: 12.00 },
      { name: 'Refri 2 Litros', price: 16.00 }
    ]
  },
  {
    id: 'd3',
    name: 'Água Mineral',
    description: 'Garrafa 500ml',
    price: 4.00,
    priceText: 'A partir de R$ 4,00',
    category: 'Bebidas',
    image: 'https://i.postimg.cc/QdyWyty4/agua-mineral.webp',
    meatOptions: [
      { name: 'Água sem Gás', price: 4.00 },
      { name: 'Água com Gás', price: 5.00 }
    ]
  },

  // BARCA GOURMET
  {
    id: 'bg1',
    name: 'Barca Gourmet',
    description: 'Acompanha 500g de batata frita c/ cheddar e bacon e 2 Burgers Gourmet',
    price: 69.00,
    category: 'Novidades',
    highlight: true,
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'bg_trio',
    name: 'Barca Trio Gourmet',
    description: 'Acompanha farta porção de batata frita c/ cheddar e bacon e 3 Burgers Gourmet',
    price: 89.00,
    category: 'Novidades',
    highlight: true,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'bg2',
    name: 'Barca Sanduíche 2 X Tudo',
    description: 'Acompanha 500g de batata frita c/ cheddar e bacon',
    price: 99.00,
    category: 'Novidades',
    image: 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'bg3',
    name: 'Barca Batata c/ Cheddar e Bacon 700g',
    description: 'Porção generosa na barca',
    price: 49.00,
    category: 'Novidades',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'bg4',
    name: 'Barca Açaí 750ml',
    description: 'Açaí completo na barca',
    price: 49.00,
    category: 'Novidades',
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&q=80&w=800'
  },
  
  // ADICIONAIS
  {
    id: 'add1',
    name: 'Hambúrguer de Costela ou Picanha',
    description: 'Adicional para os sanduíches',
    price: 14.00,
    category: 'Adicionais'
  },
  {
    id: 'add2',
    name: 'Filé Mignon ou Picanha',
    description: 'Adicional para os sanduíches',
    price: 14.00,
    category: 'Adicionais'
  },
  {
    id: 'add3',
    name: 'Filé de Frango',
    description: 'Adicional para os sanduíches',
    price: 10.00,
    category: 'Adicionais'
  },
  {
    id: 'add4',
    name: 'Hambúrguer',
    description: 'Adicional para os sanduíches',
    price: 8.00,
    category: 'Adicionais'
  },
  {
    id: 'add5',
    name: 'Presunto, Salsicha ou Ovo',
    description: 'Adicional para os sanduíches',
    price: 4.00,
    category: 'Adicionais'
  },
  {
    id: 'add6',
    name: 'Queijo ou Bacon',
    description: 'Adicional para os sanduíches',
    price: 6.00,
    category: 'Adicionais'
  },
  {
    id: 'add7',
    name: 'Catupiry ou Cheddar',
    description: 'Adicional para os sanduíches',
    price: 5.00,
    category: 'Adicionais'
  }
];

export const TRADITIONAL_BURGERS: MenuItem[] = [
  {
    id: 't1',
    name: 'Simples',
    description: 'Pão, carne a escolha, mussarela, salada, batata e milho',
    price: 22.00,
    priceText: 'A partir de R$ 22,00',
    meatOptions: [
      { name: '100g Hambúrguer Bovino', price: 22.00 },
      { name: '100g Filé de Frango', price: 24.00 },
      { name: '150g Hambúrguer Picanha', price: 26.00 },
      { name: '150g Hambúrguer Costela', price: 26.00 },
      { name: '100g Filé Mignon', price: 28.00 },
      { name: '100g Picanha', price: 30.00 }
    ],
    category: 'Sanduíches Tradicionais',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 't2',
    name: 'Especial',
    description: 'Pão, carne a escolha, mussarela, ovo, salada, batata e milho',
    price: 23.00,
    priceText: 'A partir de R$ 23,00',
    meatOptions: [
      { name: '100g Hambúrguer Bovino', price: 23.00 },
      { name: '100g Filé de Frango', price: 25.00 },
      { name: '150g Hambúrguer Picanha', price: 27.00 },
      { name: '150g Hambúrguer Costela', price: 27.00 },
      { name: '100g Filé Mignon', price: 31.00 },
      { name: '100g Picanha', price: 31.00 }
    ],
    category: 'Sanduíches Tradicionais',
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 't3',
    name: 'Bacon',
    description: 'Pão, carne a escolha, mussarela, bacon, salada, batata e milho',
    price: 25.00,
    priceText: 'A partir de R$ 25,00',
    meatOptions: [
      { name: '100g Hambúrguer Bovino', price: 25.00 },
      { name: '100g Filé de Frango', price: 27.00 },
      { name: '150g Hambúrguer Picanha', price: 29.00 },
      { name: '150g Hambúrguer Costela', price: 29.00 },
      { name: '100g Filé Mignon', price: 31.00 },
      { name: '100g Picanha', price: 33.00 }
    ],
    category: 'Sanduíches Tradicionais',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 't4',
    name: 'Bacon Especial',
    description: 'Pão, carne a escolha, mussarela, bacon, ovo, salada, batata e milho',
    price: 27.00,
    priceText: 'A partir de R$ 27,00',
    meatOptions: [
      { name: '100g Hambúrguer Bovino', price: 27.00 },
      { name: '100g Filé de Frango', price: 29.00 },
      { name: '150g Hambúrguer Picanha', price: 31.00 },
      { name: '150g Hambúrguer Costela', price: 31.00 },
      { name: '100g Filé Mignon', price: 33.00 },
      { name: '100g Picanha', price: 35.00 }
    ],
    category: 'Sanduíches Tradicionais',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 't5',
    name: 'Dog',
    description: 'Pão, carne a escolha, mussarela, 2 salsichas, salada, batata e milho',
    price: 25.00,
    priceText: 'A partir de R$ 25,00',
    meatOptions: [
      { name: '100g Hambúrguer Bovino', price: 25.00 },
      { name: '100g Filé de Frango', price: 27.00 },
      { name: '150g Hambúrguer Picanha', price: 29.00 },
      { name: '150g Hambúrguer Costela', price: 29.00 },
      { name: '100g Filé Mignon', price: 31.00 },
      { name: '100g Picanha', price: 33.00 }
    ],
    category: 'Sanduíches Tradicionais',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 't6',
    name: 'Dog Especial',
    description: 'Pão, carne a escolha, mussarela, 2 salsichas, ovo, salada, batata e milho',
    price: 27.00,
    priceText: 'A partir de R$ 27,00',
    meatOptions: [
      { name: '100g Hambúrguer Bovino', price: 27.00 },
      { name: '100g Filé de Frango', price: 29.00 },
      { name: '150g Hambúrguer Picanha', price: 31.00 },
      { name: '150g Hambúrguer Costela', price: 31.00 },
      { name: '100g Filé Mignon', price: 33.00 },
      { name: '100g Picanha', price: 35.00 }
    ],
    category: 'Sanduíches Tradicionais',
    image: 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 't7',
    name: 'À Moda',
    description: 'Pão, carne a escolha, mussarela, salsicha, bacon, salada, batata e milho',
    price: 27.00,
    priceText: 'A partir de R$ 27,00',
    meatOptions: [
      { name: '100g Hambúrguer Bovino', price: 27.00 },
      { name: '100g Filé de Frango', price: 29.00 },
      { name: '150g Hambúrguer Picanha', price: 31.00 },
      { name: '150g Hambúrguer Costela', price: 31.00 },
      { name: '100g Filé Mignon', price: 33.00 },
      { name: '100g Picanha', price: 35.00 }
    ],
    category: 'Sanduíches Tradicionais',
    image: 'https://images.unsplash.com/photo-1547530170-32930100472b?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 't8',
    name: 'Tudo',
    description: 'Pão, carne a escolha, mussarela, 2 salsicha, presunto, ovo, bacon, salada, batata e milho',
    price: 29.99,
    priceText: 'A partir de R$ 29,99',
    meatOptions: [
      { name: '100g Hambúrguer Bovino', price: 29.99 },
      { name: '100g Filé de Frango', price: 31.00 },
      { name: '150g Hambúrguer Picanha', price: 33.00 },
      { name: '150g Hambúrguer Costela', price: 33.00 },
      { name: '100g Filé Mignon', price: 35.00 },
      { name: '100g Picanha', price: 38.00 }
    ],
    category: 'Sanduíches Tradicionais',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 't50',
    name: 'Moda da Casa',
    description: 'Pão, hambúrguer, 2 salsichas, 1 carne à escolha, 2 mussarelas, 2 presuntos, 2 ovos, 2 bacons, salada, batata e milho',
    price: 55.00,
    priceText: 'R$ 55,00',
    meatOptions: [
      { name: '100g Hambúrguer Bovino', price: 55.00 },
      { name: '100g Filé de Frango', price: 55.00 },
      { name: '150g Hambúrguer Picanha', price: 55.00 },
      { name: '150g Hambúrguer Costela', price: 55.00 },
      { name: '100g Filé Mignon', price: 55.00 },
      { name: '100g Picanha', price: 55.00 }
    ],
    category: 'Sanduíches Tradicionais',
    image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&q=80&w=800'
  }
];
