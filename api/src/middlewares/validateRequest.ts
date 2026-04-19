import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod";

/**
 * Middleware que intercepta o fluxo e injeta o ZodSchema
 */
export const validateResource = (schema: AnyZodObject) =>
(req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (e: any) {
    return res.status(400).json({
      sucesso: false,
      erro: "Dados de entrada inválidos",
      detalhes: e.errors,
    });
  }
}
;