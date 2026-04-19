/**
 * PerfilPrestador - Entidade de domínio representando perfil de prestador de serviço
 *
 * Responsabilidades:
 * - Encapsular dados do prestador (nome, serviços, localização, calendário)
 * - Validações de domínio (oferece serviço? pode atender bairro?)
 *
 * NÃO faz:
 * - Acesso a Google Calendar (issoé adapter em/infrastructure)
 * - Queries ao banco de dados (repositório faz isso)
 * - Cálculos de distância complexos (IA ou serviço faz)
 */

/**
 * Perfil Prestador - Entidade de domínio
 */

export class PerfilPrestador {
  readonly id: string;
  readonly usuarioId: string;
  readonly nomeFantasia: string;
  readonly servicosOferecidos: string[];
  readonly telefoneContato: string;
  readonly cidade: string;
  readonly bairro: string;
  readonly raioDeAtuacaoKm: number;
  readonly estado: string;
  readonly googleCalendarId?: string;
  readonly rua?: string;
  readonly cep?: string;
  readonly criadoEm: Date;
  readonly atualizadoEm: Date;

  /**
   * Constructor privado
   *
   * PerfilPrestador.create() deve ser usado para criar novas instâncias
   */
  private constructor(
    id: string,
    usuarioId: string,
    nomeFantasia: string,
    servicosOferecidos: string[],
    telefoneContato: string,
    cidade: string,
    bairro: string,
    raioDeAtuacaoKm: number,
    estado: string,
    googleCalendarId: string | undefined,
    rua: string | undefined,
    cep: string | undefined,
    criadoEm: Date,
    atualizadoEm: Date,
  ) {
    this.id = id;
    this.usuarioId = usuarioId;
    this.nomeFantasia = nomeFantasia;
    this.servicosOferecidos = servicosOferecidos;
    this.telefoneContato = telefoneContato;
    this.cidade = cidade;
    this.bairro = bairro;
    this.raioDeAtuacaoKm = raioDeAtuacaoKm;
    this.estado = estado;
    this.googleCalendarId = googleCalendarId;
    this.rua = rua;
    this.cep = cep;
    this.criadoEm = criadoEm;
    this.atualizadoEm = atualizadoEm;
  }

  /**
   * Método para criar novo PerfilPrestador
   *
   * @param id - ID único (UUID)
   * @param usuarioId - ID do usuário proprietário
   * @param nomeFantasia - Nome comercial (Ex: "João Encanador")
   * @param servicosOferecidos - Lista de serviços (Ex: ["Encanamento", "Hidráulica"])
   * @param telefoneContato - Telefone para contato
   * @param cidade - Cidade onde atua (normalizada)
   * @param bairro - Bairro de atuação
   * @param raioDeAtuacaoKm - Raio em km (default: 15)
   * @param estado - Estado (default: "SP")
   * @param googleCalendarId - ID do calendário Google (opcional)
   * @param rua - Rua da localização (opcional)
   * @param cep - CEP da localização (opcional)
   * @returns Nova instância de PerfilPrestador
   *
   * @example
   * const perfil = PerfilPrestador.create(
   *   'id-uuid',
   *   'user-uuid',
   *   'João Encanador',
   *   ['Encanamento', 'Hidráulica'],
   *   '(11) 98765-4321',
   *   'São Paulo',
   *   'Vila Madalena',
   *   15,
   *   'SP',
   *   'email@google.com'
   * );
   */
  static create(
    id: string,
    usuarioId: string,
    nomeFantasia: string,
    servicosOferecidos: string[],
    telefoneContato: string,
    cidade: string,
    bairro: string,
    raioDeAtuacaoKm: number = 25,
    estado: string = 'SP',
    googleCalendarId?: string,
    rua?: string,
    cep?: string,
  ): PerfilPrestador {
    // Aqui você pode adicionar validações
    // if (!servicosOferecidos.length) throw new DomainError(...)

    return new PerfilPrestador(
      id,
      usuarioId,
      nomeFantasia,
      servicosOferecidos,
      telefoneContato,
      cidade,
      bairro,
      raioDeAtuacaoKm,
      estado,
      googleCalendarId,
      rua,
      cep,
      new Date(),
      new Date(),
    );
  }

  /**
   * Verifica se este prestador oferece um serviço específico
   *
   * @param serviço - Nome do serviço (Ex: "Encanamento")
   * @returns true se oferece, false caso contrário
   *
   * @example
   * if (perfil.ofereceServico('Encanamento')) {
   *   // ...
   * }
   */
  ofereceServico(servico: string): boolean {
    return this.servicosOferecidos.includes(servico);
  }

  /**
   * Verifica se pode atender um cliente em determinado bairro/cidade
   *
   * @param cidadeCliente - Cidade do cliente
   * @param bairroCliente - Bairro do cliente
   * @returns true se pode atender, false caso contrário
   *
   * @example
   * if (perfil.podeAtenderBairro('São Paulo', 'Vila Madalena')) {
   *   // Mostrar ao cliente
   * }
   */
  podeAtenderBairro(cidadeCliente: string, bairroCliente: string): boolean {
    const coberturaRegiao =
      this.cidade.toLowerCase() === cidadeCliente.toLowerCase() &&
      this.bairro.toLowerCase() === bairroCliente.toLowerCase();

    return coberturaRegiao;
  }

  /**
   * Retorna lista de serviços formatada para display
   *
   * @returns String com serviços
   *
   * @example
   * const display = perfil.listarServicos(); // "Encanamento, Hidráulica"
   */
  listarServicos(): string {
    return this.servicosOferecidos.join(', ');
  }
}
