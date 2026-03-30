import express from 'express';
import { searchProviders, matchProviders } from '../controllers/providersController.js';

const router = express.Router();

/**
 * Rotas expostas para o Marketplace de Serviços (/api/providers)
 */
router.get('/search', searchProviders);
router.post('/match', matchProviders);

export default router;
