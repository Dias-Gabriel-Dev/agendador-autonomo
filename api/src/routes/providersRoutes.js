import { Router } from 'express';
import { searchProviders, matchProviders } from '../controllers/providersController.js';
import { validate } from '../middlewares/validateRequest.js';
import { searchProvidersSchema, matchProvidersSchema } from '../schemas/providersSchema.js';



const router = Router();

/**
 * Rotas expostas para o Marketplace de Serviços (/api/providers)
 */
router.get('/search',validate(searchProvidersSchema), searchProviders);
router.post('/match', validate(matchProvidersSchema), matchProviders);

export default router;
