/**
 * Implementação concreta do contrato IUserRepository
 *
 * Utiliza Prisma ORM para fazer operações no banco PostgreSQL
 *
 * Padrão usado:
 * - Constructor recebe PrismaClient (injeção de dependência)
 * - Cada método mapeia a interface para chamadas Prisma
 * - Trata erros do BD e transforma em exceções de domínio
 *
 * ⚠️ MAPEAMENTO IMPORTANTE:
 *   Banco de Dados (Prisma Schema)    │    Entidade de Domínio (User)
 *   ────────────────────────────────────────────────────────
 *   usuario.tipo (TipoUsuario)       │    user.tipo (UserType)
 *   usuario.senha (String)           │    user.senha (String - recebeHash)
 *   usuario.criadoEm (DateTime)      │    user.criadoEm (Date)
 *   usuario.atualizadoEm (DateTime)  │    user.atualizadoEm (Date)
 */

import { PrismaClient } from '@prisma/client';
import { User, UserType } from '../../../core/entities/User.js';
import { IUserRepository } from '../../../core/interfaces/IUserRepository.js';

/**
 * @class PrismaUserRepository
 *
 * Implementação de IUserRepository usando Prisma + PostgreSQL
 *
 * Responsabilidades:
 * - Converter dados Prisma ↔ Entidades de domínio
 * - Executar queries no banco de dados
 * - Tratar erros de banco de dados
 */
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}
  /**
   * Recebe cliente Prisma via injeção de dependência
   *
   * Injeção de dependência permite:
   * - Testar com cliente mock (InMemory) sem precisar de BD real
   * - Reutilizar mesmo cliente Prisma em múltiplos repositórios
   * - Facilitar múltiplas instâncias do repositório
   *
   * @param prisma - Cliente Prisma singleton
   */

  // ===== ADAPTADORES (Private) =====

  /**
   * Converte dados Prisma (Usuario) → Entidade de domínio (User)
   *
   * Mapeamento:
   * - usuario.senha (String) → user.senha (String - recebeHash)
   * - usuario.tipo (TipoUsuario enum) → user.tipo (UserType union)
   * - usuario.criadoEm (DateTime) → user.criadoEm (Date)
   * - usuario.atualizadoEm (DateTime) → user.atualizadoEm (Date)
   *
   * @param prismaUsuario - Dados brutos do Prisma
   * @returns Entidade User já validada
   */
  private mapToDomain(prismaUsuario: any): User {
    return new User(
      prismaUsuario.id,
      prismaUsuario.email,
      prismaUsuario.TipoUsuario as UserType,
      prismaUsuario.senha,
      prismaUsuario.atualizadoEm,
      prismaUsuario.dataCriacao,
      prismaUsuario.deletadoEm,
    );
  }

  /**
   * Converte Entidade de domínio (User) → Dados para Prisma
   *
   * Mapeamento reverso:
   * - user.email → usuarioData.email
   * - user.senha → usuarioData.senha (nota: é um hash vindo do domínio)
   * - user.tipo → usuarioData.tipo
   *
   * Nota: Prisma auto-gera ID e criadoEm em CREATE; em UPDATE preserva ambos
   *
   * @param user - Entidade de domínio
   * @returns Objeto compatível com Prisma create/update
   */
  private mapToPrisma(user: User) {
    return {
      email: user.email,
      senha: user.senhaHash,
      tipoUsuario: user.tipo,
    };
  }
  /**
   * Busca usuário por email (único)
   *
   * Implementação Prisma:
   * 1. Chama `prisma.usuario.findUnique()` com email como filtro
   * 2. Se encontra, transforma dados Prisma → Entidade de domínio
   * 3. Se não encontra, retorna null (não erro)
   *
   * Nota: Email tem UNIQUE constraint no schema.prisma
   *
   * @param email - Email do usuário a buscar
   * @returns Promise<User | null>
   * @throws Error se falha a operação de BD
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const prismaUsuario = await this.prisma.usuario.findUnique({
        where: { email },
      });

      if (!prismaUsuario) {
        return null;
      }

      return this.mapToDomain(prismaUsuario);
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      throw new Error('Falha ao buscar usuário no banco de dados');
    }
  }

  /**
   * Busca usuário por ID (uuid)
   */
  async findById(id: string): Promise<User | null> {
    try {
      const prismaUsuario = await this.prisma.usuario.findUnique({
        where: { id },
      });

      if (!prismaUsuario) {
        return null;
      }

      return this.mapToDomain(prismaUsuario);
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error);
      throw new Error('Falha ao buscar usuário no banco de dados');
    }
  }

  /**
   * Cria novo usuário
   *
   * Implementação Prisma:
   * 1. Converte dados do contrato (email, tipo, senhaHash) para formato Prisma
   * 2. Chama `prisma.usuario.create()` com dados fornecidos
   * 3. Prisma gera ID (uuid v4) e timestamps automaticamente
   * 4. Transforma resposta Prisma → Entidade User
   *
   * Nota: Se email já existe, Prisma lança erro de constraint (P2002)
   *
   * @param userData - Dados de criação { email, tipo, senhaHash }
   * @returns Promise<User> usuário criado com ID gerado
   * @throws Error se email já existe ou falha na operação
   */
  async create(user: User): Promise<User> {
    try {
      // Converte para formato Prisma: senhaHash → senha
      const prismaData = this.mapToPrisma(user);

      const prismaUsuario = await this.prisma.usuario.create({
        data: prismaData,
      });

      return this.mapToDomain(prismaUsuario);
    } catch (error: any) {
      // P2002 = Unique constraint violation (email)
      if (error.code === 'P2002') {
        throw new Error('Email já está registrado');
      }

      console.error('Erro ao criar usuário:', error);
      throw new Error('Falha ao criar usuário no banco de dados');
    }
  }

  /**
   * Atualiza usuário existente
   *
   * Implementação Prisma:
   * 1. Converte entidade User para formato Prisma
   * 2. Chama `prisma.usuario.update()` com id e dados a atualizar
   * 3. Prisma atualiza apenas campos fornecidos; atualizadoEm é auto-atualizado
   * 4. Transforma resposta → Entidade User
   *
   * @param id - ID do usuário a atualizar (UUID)
   * @param user - Entidade User com dados atualizados
   * @returns Promise<User> usuário atualizado
   * @throws Error se usuário não encontrado ou falha na operação
   */
  async update(id: string, user: User): Promise<User> {
    try {
      const prismaData = this.mapToPrisma(user);

      const prismaUsuario = await this.prisma.usuario.update({
        where: { id },
        data: prismaData,
      });

      return this.mapToDomain(prismaUsuario);
    } catch (error: any) {
      // P2025 = registro não encontrado
      if (error.code === 'P2025') {
        throw new Error(`Usuário com ID ${id} não encontrado`);
      }

      console.error('Erro ao atualizar usuário:', error);
      throw new Error('Falha ao atualizar usuário no banco de dados');
    }
  }

  /**
   * Deleta usuário
   *
   * ⚠️ Para produção, considerar SOFT DELETE (adicionar campo deletadoEm)
   *
   * @param id - ID do usuário a deletar (UUID)
   * @returns Promise<void>
   * @throws Error se usuário não encontrado ou falha na operação
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.usuario.delete({
        where: { id },
      });
    } catch (error: any) {
      // P2025 = Record to delete not found
      console.error('Erro ao deletar usuário:', error);
      throw new Error('Falha ao deletar usuário no banco de dados');
    }
  }
}
