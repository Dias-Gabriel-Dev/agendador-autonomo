import express from 'express';
const router = express.Router();

import { register, login } from '../controllers/authController.js';

/**
 * Rotas expostas para autenticação (/api/auth)
 */
router.post('/register', register);
router.post('/login', login);

export default router;
