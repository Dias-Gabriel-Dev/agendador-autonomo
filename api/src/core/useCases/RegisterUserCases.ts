/**
 * RegisterUserUseCase — Orquestra o registro de novo usuário
 *
 * Responsabilidades:
 * 1. Validar entrada (email, tipo)
 * 2. Hash da senha (bcryptjs)
 * 3. Verificar se email já existe
 * 4. Salvar novo usuário no repositório
 * 5. Retornar resultado estruturado
 */

import bcrypt from 'bcryptjs';
import { User } from '../entities/User.js';
import { IUserRepository } from '../interfaces/IUserRepository.js';

/**
 * Input para RegisterUserCase
 */
export interface RegisterUserInput {
  email: string;
  tipo: 'CLIENTE' | 'PRESTADOR';
  senha: string;
}

/**
 * Output para RegisterUserCase
 */
export interface RegisterUserOutput {
  success: boolean;
  data?: {
    id: string;
    email: string;
    tipo: string;
    mensagem: string;
  };
  error?: string;
}

/**
 * Erros de domínio customizados
 */
export class EmailAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`Email ${email} já está registrado`);
    this.name = 'EmailAlreadyExistsError';
  }
}

export class InvalidEmailError extends Error {
  constructor(email: string) {
    super(`Email ${email} é inválido`);
    this.name = 'InvalidEmailError';
  }
}

/**
 * @class RegisterUserUseCase
 *
 * Orquestra registro de novo usuário
 *
 * Injeção: Recebe IUserRepository via constructor
 * Não sabe onde usuário será salvo (Prisma? MongoDB? File?)
 * Só sabe que existe um repositório que faz isso
 */
export class RegisterUserUseCase {
  /**
   * Constructor com injeção de dependência
   *
   * @param userRepository - Repositório injetado (implementa IUserRepository)
   */
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Executa o usecase
   *
   * Algoritmo:
   * 1. Valida email (formato)
   * 2. Valida tipo (deve ser CLIENTE ou PRESTADOR)
   * 3. Valida senha (não pode estar vazia)
   * 4. Busca se email já existe (IUserRepository.findByEmail)
   * 5. Se existe: lança EmailAlreadyExistsError
   * 6. Hash da senha (bcryptjs.hash)
   * 7. Salva novo usuário (IUserRepository.create)
   * 8. Retorna resultado estruturado
   *
   * @param input - Dados de registro { email, tipo, senha }
   * @returns Promise que resolve para RegisterUserOutput
   */
  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    try {
      // 1. Valida email (validação básica)
      // Em produção, usar regex ou library específica
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email)) {
        throw new InvalidEmailError(input.email);
      }

      // 2. Valida tipo
      if (!['CLIENTE', 'PRESTADOR'].includes(input.tipo)) {
        throw new Error(
          `Tipo inválido: ${input.tipo}. Deve ser CLIENTE ou PRESTADOR`,
        );
      }

      // 3. Valida senha
      if (!input.senha || input.senha.length < 6) {
        throw new Error('Senha deve ter no mínimo 6 caracteres');
      }

      // 4. Verifica se email já existe
      // Query: SELECT * FROM User WHERE email = 'joao@email.com'
      const usuarioExistente = await this.userRepository.findByEmail(
        input.email,
      );

      if (usuarioExistente) {
        throw new EmailAlreadyExistsError(input.email);
      }

      // 5. Hash da senha
      const senhaHash = await bcrypt.hash(input.senha, 10);

      // 6. Cria novo usuário no repositório
      const novoUsuario = await this.userRepository.create({
        email: input.email,
        tipo: input.tipo,
        senhaHash,
      });

      // 7. Retorna sucesso com dados do novo usuário
      return {
        success: true,
        data: {
          id: novoUsuario.id,
          email: novoUsuario.email,
          tipo: novoUsuario.tipo,
          mensagem: 'Registrado com sucesso!',
        },
      };
    } catch (error) {
      // 8. Trata erros e retorna formato padrão
      if (error instanceof EmailAlreadyExistsError) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (error instanceof InvalidEmailError) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Erro genérico
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      console.error('[RegisterUserUseCase] Erro :', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Método auxiliar para validar senha
   *
   * Comparação segura com bcrypt.compare
   *
   * @param senhaDigitada - Senha fornecida pelo usuário
   * @param senhaHash - Hash da senha armazenado no banco
   * @returns True se as senhas combinam, false caso contrário
   */
  static async verificarSenha(
    senhaDigitada: string,
    senhaHash: string,
  ): Promise<boolean> {
    return bcrypt.compare(senhaDigitada, senhaHash);
  }
}
