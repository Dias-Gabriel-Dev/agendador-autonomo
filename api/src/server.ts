import express from 'express';
import { ControllersFactory } from './factories/ControllersFactory.ts';
import { createAuthRoutes } from './routes/authRoutes.ts';
import { globalErrorHandler } from './middlewares/errorHandler.ts';

const app = express();
app.use(express.json());

async function bootstrap() {
  try {
    const authController = ControllersFactory.createAuthController();
    
    const authRouter = createAuthRoutes(authController);
    app.use('/api/auth', authRouter);

    app.use(globalErrorHandler);

    const PORT = 3000;
    app.listen(PORT,() => {
      console.log(`API rodando na porta ${PORT}`);
    })

  } catch (error) {
    console.error("Falha ao iniciar o servidor", error);
    process.exit(1);
  }
}

bootstrap();
