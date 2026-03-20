import express from 'express';
const router = express.Router();

import { searchProviders } from '../controllers/providersController.js';

/**
 * Rotas expostas para o Marketplace de Serviços (/api/providers)
 */
router.get('/search', searchProviders);

export default router;
