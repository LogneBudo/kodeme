import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173', // Vite frontend
  'http://localhost:4000', // fallback
];

export const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

export default cors(corsOptions);
