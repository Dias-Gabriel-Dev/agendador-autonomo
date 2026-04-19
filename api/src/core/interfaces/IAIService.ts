/**
 * Contrato abstrato para serviços de IA
 * 
 * Qualquer LLM pode ser usada nesse contrato
 * 
 Implementações possíveis:
 * - GeminiAIAdapter (Google Gemini)
 * - OpenAIAdapter (OpenAI GPT)
 * - ClaudeAIAdapter (Anthropic Claude)
 * - MockAIAdapter (para testes)
 */

export interface ResultadoClassificacao {
  servico: string;
  confianca: number;
  extratos?: {
    cidade?: string;
    bairro?: string;
    estado?: string;
  };
}

/**
 * @interface IAIService
 *
 * Contrato para serviços de LLM
 * Não importa qual LLM, interface é a mesma
 */
export interface IAIService {
  /**
   * Classifica descrição de serviço em categoria padrão
   *
   * Usa IA para entender que "Vaza água" = "Encanamento"
   * Normaliza descrição para categoria conhecida
   *
   * @param descricao - Descrição em linguagem natural (ex: "Vaza água na cozinha")
   * @returns Promise que resolve para ClassificationResult
   * @throws Error se falha na IA
   *
   * @example
   * const result = await aiService.classifyService('Vaza água na cozinha');
   * // { servico: 'Encanamento', confianca: 0.95, extratos: { ... } }
   */
  classificarServico(descricao: string): Promise<ResultadoClassificacao>;

  /**
   * Gera mensagem de apresentação automática
   *
   * Usa IA para criar mensagem amigável do prestador ao cliente
   *
   * @param nomePrestador - Nome do prestador (ex: "João Encanador")
   * @param descricaoCliente - Descrição do problema do cliente
   * @returns Promise que resolve para string com mensagem gerada
   *
   * @example
   * const msg = await aiService.generateMatchingMessage(
   *   'João Encanador',
   *   'Vaza água na cozinha'
   * );
   * // "Oi! Sou João, especialista em encanamento..."
   */
  gerarMensagemDeMatch(
    nomePrestador: string,
    descricaoCliente: string,
  ): Promise<string>;

  /**
   * Normaliza endereço bruto para componentes estruturados
   *
   * Usa IA para entender "Osasdo Veloso, sp" → { rua, cidade, bairro, estado }
   *
   * @param enderecoBruto - Texto como digitado pelo cliente
   * @returns Promise que resolve para objeto com componentes normalizados
   *
   * @example
   * const normalizado = await aiService.normalizeAddress('Osasdo Veloso, sp');
   * // { rua: 'Osasdo Veloso', bairro: '...', cidade: '...', estado: 'SP' }
   */
  enderecoNormalizado(enderecoBruto: string): Promise<{
    rua?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  }>;

  /**
   * Método genérico para chamar IA com prompt customizado
   *
   * @param prompt - Texto do prompt
   * @returns Promise que resolve para resposta da IA
   */
  chamadaGenericaIA(prompt: string): Promise<string>;
}
