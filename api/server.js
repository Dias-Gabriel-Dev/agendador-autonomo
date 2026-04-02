import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import express from 'express';
import cors from 'cors';
import { globalErrorHandler } from './src/middlewares/errorHandler.js';



const app = express();

app.use(cors());
app.use(express.json());

// Health check (Monitoramento do Servidor)
app.get('/health', (req, res) => res.json({ status: 'API rodando', banco: 'PostgreSQL com Prisma' }));

// Mapeamento global de Rotas (Injeção de Módulos)
import authRoutes from './src/routes/authRoutes.js';
app.use('/api/auth', authRoutes);

import providerRoutes from './src/routes/providersRoutes.js';
app.use('/api/providers', providerRoutes);

app.use(globalErrorHandler);

// Inicialização do servidor na porta disponível
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`➡️  Teste a API: http://localhost:${PORT}/health`);
});
