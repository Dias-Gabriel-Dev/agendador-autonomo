import { IProviderRepository } from '../interfaces/IProviderRepository.ts';
import { IAIService } from '../interfaces/IAIService.ts';
import { ICalendarService } from '../interfaces/ICalendarService.ts';

/**
 * Input para MatchProviderUseCase
 */

export interface MatchProviderInput {
  descricaoServico: string;
  endereco: string;
}

/**
 * Resultado estruturado de cada prestador encontrado
 */

export interface ProviderMatch {
  id: string;
  nomeFantasia: string;
  servicosOferecidos: string[];
  telefoneContato: string;
  cidade: string;
  bairro: string;
  proximoHorarioDisponivel?: Date;
  confiancaMatch: number;
}

/**
 * Output para MatchProviderUseCase
 */

export interface MatchProviderOutput {
  success: boolean;
  prestadoresEncontrados?: ProviderMatch[];
  servicoIdentificado?: string;
  confianca?: number;
  localidadeCliente?: {
    cidade?: string;
    bairro?: string;
  };
  error?: string;
}

/**
 * @class MatchProviderUseCase
 *
 * Orquestra busca de prestadores
 * Maior complexidade: envolve 3 serviços externos + 1 repositório
 *
 * Separação de responsabilidades:
 * - IA classifica/normaliza (domínio especializado)
 * - PaaRepository busca (domínio dado)
 * - CalendarService verifica (domínio integração)
 * - MatchProviderUseCase orquestra (domínio lógica)
 */
export class MatchProviderUseCase {
  /**
   * Constructor com injeção de dependências
   *
   * @params providerRepository - Repositório de prestadores
   * @params aiService - Serviço de IA
   * @params calendarService - Serviço de calendário
   */
  constructor(
    private readonly providerRepository: IProviderRepository,
    private readonly aiService: IAIService,
    private readonly calendarService: ICalendarService,
  ) {}

  /**
   * Executa busca de prestadores
   *
   * Algoritmo (4 passos):
   *
   * Passo 1: Classifica serviço com IA
   * ├─ Input: "Vaza água na cozinha"
   * └─ Output: { servico: "Encanamento", confianca: 0.95 }
   *
   * Passo 2: Normaliza endereço com IA
   * ├─ Input: "Osasdo Veloso, sp"
   * └─ Output: { cidade: "São Paulo", bairro: "Centro" }
   *
   * Passo 3: Busca prestadores por serviço + localidade
   * ├─ Query: prestadores que oferecem "Encanamento" em "São Paulo" / "Centro"
   * └─ Output: [ prestador1, prestador2, prestador3 ]
   *
   * Passo 4: Verifica disponibilidade de calendário para cada um
   * ├─ Para cada prestador: calendarService.getAvailableSlots()
   * └─ Output: [ { ...prestador1, proximoHorario: Date }, ... ]
   *
   * @param input - { descricaoServico, endereco }
   * @returns Promise para MatchProviderOutput
   */
  async execute(input: MatchProviderInput): Promise<MatchProviderOutput> {
    try {
      // 1. Classifica serviço com IA
      console.log('[MatchProviderUseCase] Classificando serviço...');
      const classificacao = await this.aiService.classificarServico(
        input.descricaoServico,
      );

      if (classificacao.confianca < 0.5) {
        //Confiança muito baixa = não consegue entender a descrição que o cliente fez
        return {
          success: false,
          error: `Não consegui entender qual serviço você precisa. Descrição: "${
            input.descricaoServico
          }" não é clara.`,
        };
      }

      // 2. Normaliza endereço com IA
      console.log('[MatchProviderUseCase] Normalizando endereço...');
      const enderecoNormalizado = await this.aiService.enderecoNormalizado(
        input.endereco,
      );

      const cidade = enderecoNormalizado.cidade || 'São Paulo';
      const bairro = enderecoNormalizado.bairro || 'Centro';

      // 3. Busca prestadores no repositório
      console.log(
        `[MatchProviderUseCase] Buscando prestadores de ${classificacao.servico} em
         ${cidade}/${bairro}...`,
      );

      const prestadores = await this.providerRepository.findByServicoECidade(
        classificacao.servico,
        cidade,
        bairro,
      );

      if (prestadores.length === 0) {
        return {
          success: false,
          error: `Não encontrei prestadores para "${classificacao.servico}" em
               ${cidade}/${bairro}.`,
        };
      }

      //4. Verifica disponibilidade de calendário para cada prestador
      console.log(
        `[MatchProviderUseCase] Verificando disponibilidade de calendário para
            ${prestadores.length} prestadores...`,
      );

      const prestadoresComDisponibilidade: ProviderMatch[] = [];

      for (const prestador of prestadores) {
        try {
          //Busca horários disponíveis no calendário do prestador
          //Se o googleCalendarId não estiver configurado, pula (ele não integrou seu Google Calendar)
          if (!prestador.googleCalendarId) {
            //Prestador não tem calendário integrado
            prestadoresComDisponibilidade.push({
              id: prestador.id,
              nomeFantasia: prestador.nomeFantasia,
              servicosOferecidos: prestador.servicosOferecidos,
              telefoneContato: prestador.telefoneContato,
              cidade: prestador.cidade,
              bairro: prestador.bairro,
              proximoHorarioDisponivel: undefined,
              confiancaMatch: classificacao.confianca,
            });
            continue;
          }

          const hoje = new Date();
          const dataDisponivel = await this.calendarService.obterDataDisponivel(
            prestador.googleCalendarId,
            hoje,
            60, //Assuma 60 minutos de duração padrão
          );

          const proximoHorario =
            dataDisponivel.length > 0 ? dataDisponivel[0] : undefined;

          prestadoresComDisponibilidade.push({
            id: prestador.id,
            nomeFantasia: prestador.nomeFantasia,
            servicosOferecidos: prestador.servicosOferecidos,
            telefoneContato: prestador.telefoneContato,
            cidade: prestador.cidade,
            bairro: prestador.bairro,
            proximoHorarioDisponivel: proximoHorario ? proximoHorario.inicio: undefined,
            confiancaMatch: classificacao.confianca,
          });
        } catch (error) {
          //Se falhar a verificação de calendário, apenas pula este prestador
          console.warn(
            `[MatchProviderUseCase] Erro ao verificar calendário de ${prestador}`,
          );
          //Adiciona o prestador sem informação de calendário
          prestadoresComDisponibilidade.push({
            id: prestador.id,
            nomeFantasia: prestador.nomeFantasia,
            servicosOferecidos: prestador.servicosOferecidos,
            telefoneContato: prestador.telefoneContato,
            cidade: prestador.cidade,
            bairro: prestador.bairro,
            proximoHorarioDisponivel: undefined,
            confiancaMatch: classificacao.confianca,
          });
        }
      }

      //Ordena por disponibilidade mais próxima
      prestadoresComDisponibilidade.sort((a, b) => {
        if (a.proximoHorarioDisponivel && !b.proximoHorarioDisponivel)
          return -1;
        if (!a.proximoHorarioDisponivel && b.proximoHorarioDisponivel) return 1;
        return 0;
      });
      //Retorna resultado estruturado
      return {
        success: true,
        prestadoresEncontrados: prestadoresComDisponibilidade,
        servicoIdentificado: classificacao.servico,
        confianca: classificacao.confianca,
        localidadeCliente: {
          cidade,
          bairro,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(
        '[MatchProviderUseCase] Erro ao buscar prestadores:',
        errorMessage,
      );
      return {
        success: false,
        error: `Erro ao buscar prestadores: ${errorMessage}`,
      };
    }
  }
}
