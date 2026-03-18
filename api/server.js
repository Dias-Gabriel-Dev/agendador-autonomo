const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares Globais
app.use(cors());           // Permite acesso de outras portas (do seu futuro front-end)
app.use(express.json());   // Permite ler requisições em formato JSON no req.body

// Rota Simples de Teste (Health Check)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'API rodando perfeitamente!', 
    banco: 'PostgreSQL com Prisma' 
  });
});

// Importando e usando as Rotas de Autenticação
const authRoutes = require('./src/routes/auth.routes');
// Todas as rotas de auth agora ficarão dentro do prefixo /api/auth
app.use('/api/auth', authRoutes);

// Inicializa o servidor Express
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`➡️  Teste a API: http://localhost:${PORT}/health`);
});
