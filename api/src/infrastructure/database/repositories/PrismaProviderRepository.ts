/**
 * Implementação concreta do contrato IProviderRepository
 *
 * Utiliza Prisma ORM para fazer operações com PerfilPrestador no PostgreSQL
 *
 * Padrão usado:
 * - Constructor recebe PrismaClient (injeção de dependência)
 * - Cada método mapeia a interface para chamadas Prisma
 * - Trata erros e converte dados Prisma ↔ Entidades
 *
 * ⚠️ MAPEAMENTO:
 *   Banco de Dados (Prisma)    │    Entidade de Domínio
 *   ───────────────────────────────────────────────────
 *   perfilPrestador.*          │    PerfilPrestador.*
 *   servicosOferecidos: string[]   │ servicosOferecidos: string[]
 */

import {
  PrismaClient,
  PerfilPrestador as PrismaPerfilPrestador,
} from '@prisma/client';
import { PerfilPrestador } from '../../../core/entities/PerfilPrestador.js';
import { IProviderRepository } from '../../../core/interfaces/IProviderRepository.js';

/**
 * @class PrismaProviderRepository
 *
 * Implementação de IProviderRepository usando Prisma + PostgreSQL
 *
 * Responsabilidades:
 * - Converter dados Prisma ↔ Entidades PerfilPrestador
 * - Executar queries no banco de dados
 * - Tratar erros de banco
 */
export class PrismaProviderRepository implements IProviderRepository {
  /**
   * Injeção de dependência: cliente Prisma compartilhado
   *
   * @param prisma - Cliente Prisma singleton
   */
  constructor(private readonly prisma: PrismaClient) {}

  // ===== ADAPTADORES (Private) =====

  /**
   * Converte dados Prisma → Entidade PerfilPrestador
   *
   * @param prismaData - Dados brutos do Prisma
   * @returns Entidade PerfilPrestador
   */
  private mapToDomain(prismaData: PrismaPerfilPrestador): PerfilPrestador {
    return PerfilPrestador.create(
      prismaData.id,
      prismaData.usuarioId,
      prismaData.nomeFantasia,
      prismaData.servicosOferecidos,
      prismaData.telefoneContato,
      prismaData.cidade,
      prismaData.bairro,
      prismaData.raioDeAtuacaoKm,
      prismaData.estado,
      prismaData.googleCalendarId || undefined,
      prismaData.rua || undefined,
      prismaData.cep || undefined,
    );
  }

  // ===== MÉTODOS PUBLIC =====

  /**
   * Busca prestador por ID
   *
   * @param id - ID do perfil do prestador (UUID)
   * @returns Promise<PerfilPrestador | null>
   * @throws Error se falha na operação BD
   */
  async findById(id: string): Promise<PerfilPrestador | null> {
    try {
      const prestador = await this.prisma.perfilPrestador.findUnique({
        where: { id },
      });

      if (!prestador) {
        return null;
      }

      return this.mapToDomain(prestador);
    } catch (error) {
      console.error('Erro ao buscar prestador por ID:', error);
      throw new Error('Falha ao buscar prestador no banco de dados');
    }
  }

  /**
   * Busca prestadores por serviço E localização (cidade/bairro)
   *
   * Filtra por:
   * - Serviço oferecido (substring insensitive)
   * - Cidade (substring insensitive)
   * - Bairro (substring insensitive)
   *
   * @param nomeServico - Nome do serviço (Ex: "Encanamento")
   * @param cidade - Cidade (Ex: "São Paulo")
   * @param bairro - Bairro (Ex: "Centro")
   * @returns Promise<PerfilPrestador[]>
   * @throws Error se falha na operação
   */
  async findByServicoECidade(
    nomeServico: string,
    cidade: string,
    bairro: string,
  ): Promise<PerfilPrestador[]> {
    try {
      // Constrói Array OR para filtrar cidade OU bairro (com insensitive search)
      const orFilters = [];

      if (cidade) {
        orFilters.push({
          cidade: { contains: cidade, mode: 'insensitive' as const },
        });
      }

      if (bairro) {
        orFilters.push({
          bairro: { contains: bairro, mode: 'insensitive' as const },
        });
      }

      const prestadores = await this.prisma.perfilPrestador.findMany({
        where: {
          servicosOferecidos: {
            has: nomeServico,
          },
          ...(orFilters.length > 0 && { OR: orFilters }),
        },
      });

      return prestadores.map((p) => this.mapToDomain(p));
    } catch (error) {
      console.error('Erro ao buscar prestadores por serviço e cidade:', error);
      throw new Error('Falha ao buscar prestadores no banco de dados');
    }
  }

  /**
   * Busca todos os prestadores que oferecem um serviço específico
   *
   * @param nomeServico - Nome do serviço
   * @returns Promise<PerfilPrestador[]>
   * @throws Error se falha na operação
   */
  async findByServico(nomeServico: string): Promise<PerfilPrestador[]> {
    try {
      const prestadores = await this.prisma.perfilPrestador.findMany({
        where: {
          servicosOferecidos: {
            has: nomeServico,
          },
        },
      });

      return prestadores.map((p) => this.mapToDomain(p));
    } catch (error) {
      console.error('Erro ao buscar prestadores por serviço:', error);
      throw new Error('Falha ao buscar prestadores no banco de dados');
    }
  }

  /**
   * Busca todos os prestadores de uma cidade
   *
   * @param cidade - Nome da cidade
   * @returns Promise<PerfilPrestador[]>
   * @throws Error se falha na operação
   */
  async findByCidade(cidade: string): Promise<PerfilPrestador[]> {
    try {
      const prestadores = await this.prisma.perfilPrestador.findMany({
        where: {
          cidade: { contains: cidade, mode: 'insensitive' },
        },
      });

      return prestadores.map((p) => this.mapToDomain(p));
    } catch (error) {
      console.error('Erro ao buscar prestadores por cidade:', error);
      throw new Error('Falha ao buscar prestadores no banco de dados');
    }
  }

  /**
   * Cria novo perfil de prestador
   *
   * @param data - Dados de criação
   * @returns Promise<PerfilPrestador> prestador criado
   * @throws Error se falha na operação
   */
  async create(data: {
    usuarioId: string;
    nomeFantasia: string;
    servicosOferecidos: string[];
    telefoneContato: string;
    cidade: string;
    bairro: string;
    raioDeAtuacaoKm: number;
    estado: string;
    googleCalendarId?: string;
    rua?: string;
    cep?: string;
  }): Promise<PerfilPrestador> {
    try {
      const prestador = await this.prisma.perfilPrestador.create({
        data,
      });

      return this.mapToDomain(prestador);
    } catch (error) {
      console.error('Erro ao criar prestador:', error);
      throw new Error('Falha ao criar prestador no banco de dados');
    }
  }

  /**
   * Atualiza perfil de prestador
   *
   * @param id - ID do prestador a atualizar
   * @param data - Dados a atualizar (parciais)
   * @returns Promise<PerfilPrestador> prestador atualizado
   * @throws Error se prestador não encontrado ou falha na operação
   */
  async update(
    id: string,
    data: Partial<{
      nomeFantasia: string;
      servicosOferecidos: string[];
      telefoneContato: string;
      cidade: string;
      bairro: string;
      raioDeAtuacaoKm: number;
      estado: string;
      googleCalendarId: string;
      rua: string;
      cep: string;
    }>,
  ): Promise<PerfilPrestador> {
    try {
      const prestador = await this.prisma.perfilPrestador.update({
        where: { id },
        data,
      });

      return this.mapToDomain(prestador);
    } catch (error: any) {
      // P2025 = Record to update not found
      if (error.code === 'P2025') {
        throw new Error(`Prestador com ID ${id} não encontrado`);
      }

      console.error('Erro ao atualizar prestador:', error);
      throw new Error('Falha ao atualizar prestador no banco de dados');
    }
  }

  /**
   * Deleta prestador
   *
   * @param id - ID do prestador a deletar
   * @returns Promise<void>
   * @throws Error se prestador não encontrado ou falha na operação
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.perfilPrestador.delete({
        where: { id },
      });
    } catch (error: any) {
      // P2025 = Record to delete not found
      if (error.code === 'P2025') {
        throw new Error(`Prestador com ID ${id} não encontrado`);
      }

      console.error('Erro ao deletar prestador:', error);
      throw new Error('Falha ao deletar prestador no banco de dados');
    }
  }
}
