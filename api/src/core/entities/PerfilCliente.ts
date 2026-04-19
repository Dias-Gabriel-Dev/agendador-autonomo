/**
 * PerfilCliente — Entidade que representa perfil de cliente
 *
 * Responsabilidades:
 * - Encapsular dados de cliente (nome, telefone, endereço)
 * - Armazenar endereço bruto (como digitado) e normalizado (extraído por IA)
 *
 * NÃO faz:
 * - Chamar IA para normalizar
 * - Calcular distância
 * - Acessar banco de dados
 */

export class PerfilCliente {
  readonly id: string;
  readonly usuarioId: string;
  readonly nome: string;
  readonly telefoneContato: string;
  readonly enderecoBruto: string;
  readonly estado?: string;
  readonly cidade?: string;
  readonly bairro?: string;
  readonly rua?: string;
  readonly cep?: string;
  readonly criadoEm: Date;
  readonly atualizadoEm: Date;

  /**
   * Constructor privado
   *
   * PerfilCliente.create() deve ser usado para criar novas instâncias
   */

  private constructor(
    id: string,
    usuarioId: string,
    nome: string,
    telefonaContato: string,
    enderecoBruto: string,
    estado: string | undefined,
    cidade: string | undefined,
    bairro: string | undefined,
    rua: string | undefined,
    cep: string | undefined,
    criadoEm: Date,
    atualizadoEm: Date,
  ) {
    this.id = id;
    this.usuarioId = usuarioId;
    this.nome = nome;
    this.telefoneContato = telefonaContato;
    this.enderecoBruto = enderecoBruto;
    this.estado = estado;
    this.cidade = cidade;
    this.bairro = bairro;
    this.rua = rua;
    this.cep = cep;
    this.criadoEm = criadoEm;
    this.atualizadoEm = atualizadoEm;
  }

  /**
   * Métodopara criar novo PerfilCliente
   *
   * @param id - ID único (UUID)
   * @param usuarioId - ID do usuário proprietário
   * @param nome - Nome do cliente (Ex: "João Silva")
   * @param telefone - Telefone de contato
   * @param enderecoBruto - Endereço como digitado pelo cliente
   * @param estado - Estado (extraído por IA, opcional)
   * @param cidade - Cidade (extraído por IA, opcional)
   * @param bairro - Bairro (extraído por IA, opcional)
   * @param rua - Rua (extraído por IA, opcional)
   * @param cep - CEP (extraído por IA, opcional)
   * @returns Nova instância de PerfilCliente
   *
   * @example
   * const perfil = PerfilCliente.create(
   *   'id-uuid',
   *   'user-uuid',
   *   'João Silva',
   *   '(11) 91234-5678',
   *   'Osasco Veloso, sp'
   *   // Campos opcionais preenchidos depois pela IA
   * );
   */
  static create(
    id: string,
    usuarioId: string,
    nome: string,
    telefoneContato: string,
    enderecoBruto: string,
    estado?: string,
    cidade?: string,
    bairro?: string,
    rua?: string,
    cep?: string,
  ): PerfilCliente {
    // Validação de dados (exemplo: telefone)}
    return new PerfilCliente(
      id,
      usuarioId,
      nome,
      telefoneContato,
      enderecoBruto,
      estado,
      cidade,
      bairro,
      rua,
      cep,
      new Date(),
      new Date(),
    );
  }

  /**
   * Verifica se endereço foi normalizado completamente por IA
   *
   * @returns true se todos os campos de endereço estão preenchidos
   *
   * @example
   * if (!perfil.enderecoNormalizado()) {
   *   // Enviar para IA normalizar
   * }
   */
  enderecoNormalizado(): boolean {
    return !!(this.estado && this.cidade && this.bairro);
  }

  /**
   * Retorna endereço formatado para display
   *
   * @returns String com endereço completo ou bruto se não normalizado
   *
   * @example
   * const display = perfil.obterEndereco();
   * // "Rua das Flores, 123, Centro, São Paulo, SP"
   */
  obterEndereco(): string {
    if (this.enderecoNormalizado()) {
      return `${this.rua || ''}, ${this.bairro}, ${this.cidade}, ${this.estado}`;
    }
    return this.enderecoBruto;
  }

  /**
   * Retorna localização em formato "Cidade, Estado" para busca
   *
   * @returns String com localização
   *
   * @example
   * const local = perfil.obterLocalizacao(); // "São Paulo, SP"
   */
  obterLocalizacao(): string {
    if (this.cidade && this.estado) {
      return `${this.cidade}, ${this.estado}`;
    }
    return '';
  }
}
