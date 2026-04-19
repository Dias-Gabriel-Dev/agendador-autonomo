import { Request, Response, NextFunction } from 'express';

/**
 * Tratador de erro global
 */
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[ERRO GERAL DA APLICACAO]:', err);

  if (err.name == 'UserAlreadyExistError') {
    // Erro simples de domínio, não vaza dados sensíveis
    return res.status(409).json({ succes: false, error: err.message});
  }

  // Falha genérica
  return res.status(500).json({ succes: false,
    error: 'Erro interno no servidor. Acione o suporte'
  });
};

