import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { validateResource } from '../middlewares/validateRequest.js';
import { registerUserSchema } from '../schemas/authSchema.js';

/**
 * Função que recebo o Controller Injetado no index
 */
export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

  router.post('/register', validateResource(registerUserSchema),
  authController.register.bind(authController)); 

  return router;
}



