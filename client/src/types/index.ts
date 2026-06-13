export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  colors: string[];
}

export interface CartItem extends Product {
  quantity: number;
}
