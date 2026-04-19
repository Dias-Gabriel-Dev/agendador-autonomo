/**
 * IUserRepository — Contrato abstrato para operações com usuários
 *
 * Define QUAIS operações são possíveis com usuários
 * Não importa se usa Prisma, MongoDB ou arquivo JSON — a interface é a mesma
 *
 * Implementações possíveis:
 * - PrismaUserRepository (BD PostgreSQL)
 * - MongoUserRepository (BD MongoDB)
 * - InMemoryUserRepository (testes)
 * - FileUserRepository (JSON file)
 */

import { User, UserType } from '../entities/User.js';

/**
 * @interface IUserRepository
 *
 * Contrato para operações CRUD de usuários
 *
 * Qualquer classe que implementa IUserRepository DEVE ter
 * todos estes métodos com exatamente estes tipos
 */

export interface IUserRepository {
  /**
   * Busca usuário por email (único)
   *
   * @param email - Email do usuário
   * @returns Promise que resolve para User se encontrado, null se não existe
   * @throws Error se falha na operação (ex: erro de BD)
   *
   * @example
   * const user = await userRepository.findByEmail('joao@email.com');
   * if (user) {
   *   console.log(`Encontrado: ${user.email}`);
   * }
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Busca usuário por ID
   *
   * @param id - ID único (UUID) do usuário
   * @returns Promise que resolve para User se encontrado, null se não existe
   * @throws Error se falha na operação
   *
   * @example
   * const user = await userRepository.findById('uuid-12345');
   */
  findById(id: string): Promise<User | null>;
  /**
   * Cria novo usuário no repositório
   *
   * @param userData - Dados para criação
   * @param userData.email - Email único
   * @param userData.tipo - 'CLIENTE' ou 'PRESTADOR'
   * @param userData.senhaHash - Senha já hasheada (de bcryptjs)
   * @returns Promise que resolve para User criado com ID gerado automaticamente
   * @throws Error se email já existe ou falha na operação
   *
   * @example
   * const novoUser = await userRepository.create({
   *   email: 'maria@email.com',
   *   tipo: 'CLIENTE',
   *   senhaHash: '$2b$10$...' // hash bcrypt
   * });
   * console.log(novoUser.id); // UUID gerado automaticamente
   */
  create(userData: {
    email: string;
    tipo: UserType;
    senhaHash: string;
  }): Promise<User>;

  /**
   * Atualiza dados de usuário existente
   *
   * @param id - ID do usuário a atualizar
   * @param updates - Campos a atualizar (parciais)
   * @returns Promise que resolve para User atualizado
   * @throws Error se usuário não existe ou falha na operação
   *
   * @example
   * const atualizado = await userRepository.update('uuid-123', {
   *   email: 'novo@email.com'
   * });
   */
  update(id: string, updates: Partial<User>): Promise<User>;

  /**
   * Soft delete de usuário (fica inativo)
   *
   * @param id - ID do usuário a deletar
   * @returns Promise que resolve quando deletado
   * @throws Error se usuário não existe
   *
   * @example
   * await userRepository.delete('uuid-123');
   */
  delete(id: string): Promise<void>;
}
