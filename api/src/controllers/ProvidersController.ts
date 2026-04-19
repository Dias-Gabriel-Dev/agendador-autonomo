import { Request, Response, NextFunction } from "express";
import { MatchProviderUseCase } from "../core/useCases/MatchProviderUseCase.js";
import { MatchProviderDTO } from "../schemas/providersSchema.js";

export class ProvidersController {
  constructor(private readonly matchProviderUseCase: MatchProviderUseCase) {}

  async match(req: Request, res: Response, next: NextFunction) {
    try {
      const payload: MatchProviderDTO = req.body;
      const resultado = await this.matchProviderUseCase.execute({
        descricaoServico: payload.descricaoServico,
        endereco: payload.endereco
      });

      if (!resultado.success) {
        return res.status(400).json(resultado);
      }

      return res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  }
}