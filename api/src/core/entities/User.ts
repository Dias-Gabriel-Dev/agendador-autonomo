/**
 * User - Entidade de domínio representando um usuário
 *
 * Responsabilidades:
 * - Encapsular dados do usuário (email, tipo, etc)
 * - Validações de lógica de domínio simples (não-nulas, tipos)
 *
 * NÃO faz:
 * - Acesso a banco de dados
 * - HTTP requests
 * - Formatação específica de framework
 */

export type UserType = 'CLIENTE' | 'PRESTADOR';

export class User {
  readonly id: string;
  readonly email: string;
  readonly tipo: UserType;
  readonly senhaHash: string;
  readonly criadoEm: Date;
  readonly atualizadoEm: Date;
  readonly deletadoEm: Date;

  constructor(
    id: string,
    email: string,
    tipo: UserType,
    senhaHash: string,
    criadoEm: Date,
    atualizadoEm: Date,
    deletadoEm: Date,
  ) {
    this.id = id;
    this.email = email;
    this.tipo = tipo;
    this.senhaHash = senhaHash;
    this.criadoEm = criadoEm;
    this.atualizadoEm = atualizadoEm;
    this.deletadoEm = deletadoEm;
  }

  /**
   * Método para criar um novo usuário
   *
   * @param id - Identificador único (UUID)
   * @param email - Email válido do usuário
   * @param tipo - Tipo: 'CLIENTE' ou 'PRESTADOR'
   * @param senhaHash - Senha já hasheada (deveria vir de bcryptjs)
   * @returns Nova instância de User
   *
   * @example
   * const user = User.create('id-123', 'joao@email.com', 'CLIENTE', 'hash-bcrypt');
   */
  static create(
    id: string,
    email: string,
    tipo: UserType,
    senhaHash: string,
  ): User {
    // Validação de dados(exemplo: email)

    return new User(
      id,
      email,
      tipo,
      senhaHash,
      new Date(),
      new Date(),
      new Date(),
    );
  }

  isCliente(): boolean {
    return this.tipo === 'CLIENTE';
  }

  isPrestador(): boolean {
    return this.tipo === 'PRESTADOR';
  }
}
