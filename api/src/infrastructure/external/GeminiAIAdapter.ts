/**
 * GeminiAIAdapter - Adaptador para Google Gemini AI
 *
 * Implementa IAIService usando Google Generative AI (Gemini)
 *
 * Responsabilidades:
 * - Classificar serviços em categorias padrão
 * - Gerar mensagens de match personalizadas
 * - Normalizar endereços brutos
 *
 * Isolamento:
 * - Nenhum acesso direto a Gemini API fora deste arquivo
 * - Todos os prompts centralizados aqui
 * - Erros de API convertidos em exceções de domínio
 */

import {
  IAIService,
  ResultadoClassificacao,
} from '../../core/interfaces/IAIService.js';

/**
 * @class GeminiAIAdapter
 *
 * Implementação de IAIService usando Google Gemini
 *
 * Injeção de dependência:
 * - Cliente Gemini recebido no constructor (não hardcoded)
 * - API key injetada via variáveis de ambiente
 */
export class GeminiAIAdapter implements IAIService {
  /**
   * Cliente Gemini generative model
   *
   * Recebido via injeção de dependência
   * @param geminiModel - Cliente do Google Generative AI
   */
  constructor(private readonly geminiModel: any) {}

  /**
   * Classifica descrição de serviço em categoria padrão
   *
   * Usa Gemini para entender que "Vaza água" = "Encanamento"
   *
   * @param descricao - Descrição em linguagem natural
   * @returns Promise<ResultadoClassificacao>
   * @throws Error se falha na API do Gemini
   */
  async classificarServico(descricao: string): Promise<ResultadoClassificacao> {
    try {
      const prompt = `
Você é um classificador de serviços. Análise a descrição do cliente e classifique em uma das categorias:
- Encanamento
- Eletricidade
- Limpeza
- Marcenaria
- Pintura
- Reparos Gerais

Descrição: "${descricao}"

Responda em JSON com este formato:
{
  "servico": "Nome da categoria",
  "classificacaoSatisfacao": "Alta|Média|Baixa",
  "extratos": {
    "cidade": "cidade se mencionada ou null",
    "bairro": "bairro se mencionado ou null",
    "estado": "estado ou UF se mencionado ou null"
  }
}

Apenas JSON, sem explicações.`;

      const response = await this.geminiModel.generateContent(prompt);
      const texto = response.response.text();

      // Parse JSON response
      const resultado: ResultadoClassificacao = JSON.parse(texto);
      return resultado;
    } catch (error) {
      console.error('Erro ao classificar serviço com Gemini:', error);
      throw new Error('Falha ao classificar serviço com IA');
    }
  }

  /**
   * Gera mensagem de apresentação automática
   *
   * Usa Gemini para criar mensagem amigável do prestador ao cliente
   *
   * @param nomePrestador - Nome do prestador
   * @param descricaoCliente - Descrição do problema do cliente
   * @returns Promise<string> mensagem gerada
   * @throws Error se falha na API
   */
  async gerarMensagemDeMatch(
    nomePrestador: string,
    descricaoCliente: string,
  ): Promise<string> {
    try {
      const prompt = `
Você é um assistente que ajuda prestadores a enviarem mensagens amigáveis para clientes.

Prestador: ${nomePrestador}
Problema do cliente: ${descricaoCliente}

Gere uma mensagem curta (máximo 2 linhas) de apresentação do prestador ao cliente.
Seja amigável e profissional.
Apenas a mensagem, sem aspas ou formatação extra.`;

      const response = await this.geminiModel.generateContent(prompt);
      return response.response.text().trim();
    } catch (error) {
      console.error('Erro ao gerar mensagem com Gemini:', error);
      throw new Error('Falha ao gerar mensagem com IA');
    }
  }

  /**
   * Normaliza endereço bruto para componentes estruturados
   *
   * Usa Gemini para entender "Osasdo Veloso, sp"
   *
   * @param enderecoBruto - Texto como digitado pelo cliente
   * @returns Promise com { rua, bairro, cidade, estado }
   * @throws Error se falha na API
   */
  async enderecoNormalizado(enderecoBruto: string): Promise<{
    rua: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep?: string;
  }> {
    try {
      const prompt = `
Você é um normalizador de endereços. Analise o endereço bruto e extraia componentes estruturados.

Endereço digitado: "${enderecoBruto}"

Responda em JSON com este formato:
{
  "rua": "nome da rua ou vazio",
  "bairro": "nome do bairro ou vazio",
  "cidade": "nome da cidade ou vazio",
  "estado": "sigla do estado (SP, RJ, etc) ou vazio",
  "cep": "CEP se mensionado ou vazio"
}

Se não conseguir identificar um componente, deixe vazio ("").
Apenas JSON, sem explicações.`;

      const response = await this.geminiModel.generateContent(prompt);
      const texto = response.response.text();

      return JSON.parse(texto);
    } catch (error) {
      console.error('Erro ao normalizar endereço com Gemini:', error);
      throw new Error('Falha ao normalizar endereço com IA');
    }
  }

  /**
   * Método genérico para chamar IA com prompt customizado
   *
   * Permite flexibilidade para prompts não-previstos
   *
   * @param prompt - Texto do prompt
   * @returns Promise<string> resposta da IA
   * @throws Error se falha na API
   */
  async chamadaGenericaIA(prompt: string): Promise<string> {
    try {
      const response = await this.geminiModel.generateContent(prompt);
      return response.response.text();
    } catch (error) {
      console.error('Erro na chamada genérica à Gemini:', error);
      throw new Error('Falha na chamada à IA');
    }
  }
}
