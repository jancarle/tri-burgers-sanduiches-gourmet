export interface Addon {
  id: string;
  name: string;
  price: number;
  available: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SelectedAddon {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  priceText?: string;
  meatOptions?: { name: string; price: number }[];
  category: string;
  image?: string;
  highlight?: boolean;
  available?: boolean;
}

export type Category = 
  | 'Burgers Gourmet'
  | 'Sanduíches Tradicionais'
  | 'Combos'
  | 'Beirute'
  | 'Pão Sírio'
  | 'Batata Frita'
  | 'Sobremesas'
  | 'Cremes'
  | 'Sucos'
  | 'Bebidas'
  | 'Adicionais'
  | 'Novidades';
