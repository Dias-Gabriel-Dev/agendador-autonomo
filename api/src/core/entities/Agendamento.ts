/**
 * Entidade de domínio representando agendamento de serviço
 *
 * Responsabilidades:
 * - Encapsular dados de agendamento (datas, prestador, cliente, serviço)
 * - Validações de lógica de domínio (pode ser confirmado? pode ser cancelado?)
 *
 * NÃO faz:
 * - Salvamento em BD (repositório faz)
 * - Chamadas a Google Calendar (adapter faz)
 * - Cálculos complexos de horário
 */

/**
 * Status de um possível agendamento
 */

export type StatusAgendamento =
  | 'PENDENTE'
  | 'CONFIRMADO'
  | 'CANCELADO'
  | 'CONCLUIDO'
  | 'CLIENTE_NAO_ESTAVA'
  | 'PRESTADOR_NAO_COMPARECEU';

export class Agendamento {
  readonly id: string;
  readonly clienteId: string;
  readonly prestadorId: string;
  readonly servicoSolicitado: string;
  readonly dataHora: Date;
  readonly duracaoEstimadaMinutos: number;
  readonly status: StatusAgendamento;
  readonly endereco: string;
  readonly precoEstimado?: number;
  readonly notasCliente?: string;
  readonly notasPrestador?: string;
  readonly criadoEm: Date;
  readonly atualizadoEm: Date;
  readonly confirmadoEm?: Date;
  readonly concluidoEm?: Date;

  /**
   * Construtor privado
   *
   * Appointment.create()
   */
  private constructor(
    id: string,
    clienteId: string,
    prestadorId: string,
    servicoSolicitado: string,
    dataHora: Date,
    duracaoEstimadaMinutos: number,
    status: StatusAgendamento,
    endereco: string,
    precoestimado: number | undefined,
    notasCliente: string | undefined,
    notasPrestador: string | undefined,
    criadoEm: Date,
    atualizadoEm: Date,
    confirmadoEm: Date | undefined,
    concluidoEm: Date | undefined,
  ) {
    this.id = id;
    this.clienteId = clienteId;
    this.prestadorId = prestadorId;
    this.servicoSolicitado = servicoSolicitado;
    this.dataHora = dataHora;
    this.duracaoEstimadaMinutos = duracaoEstimadaMinutos;
    this.status = status;
    this.endereco = endereco;
    this.precoEstimado = precoestimado;
    this.notasCliente = notasCliente;
    this.notasPrestador = notasPrestador;
    this.criadoEm = criadoEm;
    this.atualizadoEm = atualizadoEm;
    this.confirmadoEm = confirmadoEm;
    this.concluidoEm = concluidoEm;
  }
  /**
   * Método para criar novo Agendamento
   *
   * @param id - ID único (UUID)
   * @param clienteId - ID do cliente (User)
   * @param prestadorId - ID do prestador (User)
   * @param servicoSolicitado - Nome do serviço
   * @param dataHora - Data e hora do agendamento
   * @param duracaoEstimadaMinutos - Duração estimada em minutos (ex: 60)
   * @param endereco - Enderço onde será realizado
   * @param precoEstimado - Preço estimado em reais (opcional)
   * @param notasCliente - Notas do cliente (opcional)
   * @param notasPrestador - Notas do prestador (opcional)
   * @returns Nova instância de Appointment
   *
   * @example
   * const agendamento = Appointment.create(
   *   'id-uuid',
   *   'cliente-uuid',
   *   'prestador-uuid',
   *   'Encanamento',
   *   new Date('2026-04-15T14:30:00'),
   *   60,
   *   'Rua das Flores, 123'
   * );
   */
  static create(
    id: string,
    clienteId: string,
    prestadorId: string,
    servicoSolicitado: string,
    dataHora: Date,
    duracaoEstimadaMinutos: number,
    endereco: string,
    precoEstimado?: number,
    notasCliente?: string,
    notasPrestador?: string,
  ): Agendamento {
    // Validações de domínio
    // if (datahora < new Dat()) throw new DomainError(...);
    return new Agendamento(
      id,
      clienteId,
      prestadorId,
      servicoSolicitado,
      dataHora,
      duracaoEstimadaMinutos,
      'PENDENTE', // status inicial
      endereco,
      precoEstimado,
      notasCliente,
      notasPrestador,
      new Date(),
      new Date(),
      undefined,
      undefined,
    );
  }

  /**
   * Verifica se agendamento pode ser confirmado
   *
   * @returns true se status é PENDENTE
   *
   * @example
   * if (agendamento.podeConfirmar()) {
   *   // Mostrar botão de confirmação ao prestador
   * }
   */
  confirmacao(): boolean {
    return this.status === 'PENDENTE';
  }

  /**
   * Verifica se agendamento pode ser cancelado
   *
   * @returns true se status é PENDENTE ou CONFIRMADO
   *
   * @example
   * if (agendamento.podeCancelar()) {
   *   // Permitir cancelamento
   * }
   */
  podeCancelar(): boolean {
    return this.status === 'PENDENTE' || this.status === 'CONFIRMADO';
  }

  /**
   * Calcula horário de término do agendamento
   *
   * @returns Data e hora de término
   *
   * @example
   * const fim = agendamento.obterHoraFim();
   * // 2026-04-15T15:30:00Z (se começou às 14:30 por 60 minutos)
   */
  obterHoraFim(): Date {
    const horaSaida = new Date(this.dataHora);
    horaSaida.setMinutes(horaSaida.getMinutes() + this.duracaoEstimadaMinutos);
    return horaSaida;
  }

  /**
   * Verifica se agendamento é hoje
   *
   * @returns true se dataHora é hoje
   *
   * @example
   * if (agendamento.ehHoje()) {
   *   // Marcar com urgência
   * }
   */
  ehHoje(): boolean {
    const hoje = new Date();
    return (
      this.dataHora.getDate() === hoje.getDate() &&
      this.dataHora.getMonth() === hoje.getMonth() &&
      this.dataHora.getFullYear() === hoje.getFullYear()
    );
  }

  /**
   * Verifica se agendamento passou (data expirou)
   *
   * @returns true se dataHora < agora
   *
   * @example
   * if (agendamento.passouDataEHoraAgendamento()) {
   *   // Marcar como não compareceu
   * }
   */
  passouDataEHoraAgendamento(): boolean {
    return this.dataHora < new Date();
  }
}
