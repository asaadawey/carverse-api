import { CorsOptions } from 'cors';

export default {
  origin: ['http://localhost:5173', 'https://localhost:5173', 'https://web.carverse.me', 'https://api.carverse.me'],
  credentials: true,
  exposedHeaders: ['set-cookie'],
} as CorsOptions;
