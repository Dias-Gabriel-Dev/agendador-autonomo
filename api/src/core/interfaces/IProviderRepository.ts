/**
 * Contrato abstrato para operações com perfil de prestadores
 *
 * Qualquer repositório que implemente isto DEVE ter exatamente estes métodos
 *
 * Implementações possíveis:
 * - PrismaProviderRepository (Prisma + PostgreSQL)
 * - MongoProviderRepository (MongoDB)
 * - InMemoryProviderRepository (testes)
 */

import { PerfilPrestador } from '../entities/PerfilPrestador.js';

/**
 * @interface IProviderRepository
 *
 * Contrato para operações CRUD de perfis de prestadores
 */
export interface IProviderRepository {
  /**
   * Busca prestador por ID
   *
   * @param id - ID do perfil do prestador
   * @returns Promise que retorna um array para PerfilPrestador ou null
   *
   * @example
   * const perfil = await providerRepository.findById('provider-uuid');
   */
  findById(id: string): Promise<PerfilPrestador | null>;
  /**
   * Busca prestadores por tipo de serviço E localização
   *
   * - Filtra por serviço oferecido
   * - Filtra por cidade
   * - Opcionalmente ordena por distância
   * @param nomeServico - Nome do serviço (ex: "Encanamento")
   * @param cidade - Cidade onde cliente está (ex: "São Paulo")
   * @param bairro - Bairro onde cliente está (ex: "Centro")
   * @returns Promise que retorna um array de PerfilPrestador encontrados
   *
   * @example
   * const prestadores = await providerRepository.findByServiceoAndCity(
   *   'Encanamento',
   *   'São Paulo',
   *   'Centro'
   * );
   * // Retorna [ { nomeFantasia: 'João Encanador', ... }, { ... } ]
   */
  findByServicoECidade(
    nomeServico: string,
    cidade: string,
    bairro: string,
  ): Promise<PerfilPrestador[]>;

  /**
   * Busca todos prestadores que oferecem um serviço específico
   *
   * @param nomeServico - Nome do serviço
   * @returns Promise que retorna um array de PerfilPrestador por serviço
   *
   * @example
   * const encanadores = await providerRepository.findByServico('Encanamento');
   */
  findByServico(nomeServico: string): Promise<PerfilPrestador[]>;

  /**
   * Busca todos prestadores de uma cidade
   *
   * @param cidade - Nome da cidade
   * @returns Promise que retorna um array de PerfilPrestador da cidade
   *
   * @example
   * const cidadePrestadores = await providerRepository.findByCity('São Paulo');
   */
  findByCidade(cidade: string): Promise<PerfilPrestador[]>;

  /**
   * Cria novo perfil de prestador
   *
   * @param data - Dados para criação
   * @returns Promise que retorna um PerfilPrestador criado
   *
   * @example
   * const novoPerfil = await providerRepository.create({
   *   usuarioId: 'uuid',
   *   nomeFantasia: 'João Encanador',
   *   servicosOferecidos: ['Encanamento', 'Hidráulica'],
   *   telefoneContato: '11 9876-5432',
   *   cidade: 'São Paulo',
   *   bairro: 'Centro'
   * });
   */
  create(data: {
    usuarioId: string;
    nomeFantasia: string;
    servicosOferecidos: string[];
    telefoneContato: string;
    cidade: string;
    bairro: string;
    raioDeAtuacaoKm?: number;
    estado?: string;
    googleCalendarId?: string;
    rua?: string;
    cep?: string;
  }): Promise<PerfilPrestador>;

  /**
   * Atualiza perfil de prestador
   *
   * @param id - ID do perfil
   * @param updates - Campos a atualizar (parciais)
   * @returns Promise que retorna PerfilPrestador atualizado
   *
   * @example
   * const atualizado = await providerRepository.update('provider-uuid', {
   *   servicosOferecidos: ['Encanamento', 'Hidráulica', 'Gás']
   * });
   */
  update(
    id: string,
    updates: Partial<PerfilPrestador>,
  ): Promise<PerfilPrestador>;

  /**
   * Deleta perfil de prestador
   *
   * @param id - ID do perfil
   * @returns Promise que resolve quando deletado
   */
  delete(id: string): Promise<void>;
}
