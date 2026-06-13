import axios from 'axios';
import type { Product } from '../types';

const API_URL = 'http://localhost:5000/api';

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const response = await axios.get(`${API_URL}/products`);
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};
