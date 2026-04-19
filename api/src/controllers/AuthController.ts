import { Request, Response, NextFunction } from "express";
import { RegisterUserUseCase, RegisterUserInput } from "../core/useCases/RegisterUserCases.js";

/**
 * @class AuthController
 * Apenas mapeia a requisição HTTP no UseCase e devolve a Promise.
 */
export class AuthController {

  constructor(private readonly registerUserCase: RegisterUserUseCase) {}

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const payload: RegisterUserInput = req.body;

      const resultado = await this.registerUserCase.execute(payload);

      if (!resultado.success) {
        return res.status(400).json(resultado);
      }

      return res.status(201).json(resultado);
    } catch (error) {
      next(error);
    }
  }
}