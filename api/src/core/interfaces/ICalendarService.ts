/**
 * Contrato abstrato para serviços de calendário
 *
 * Qualquer calendário que implemente isto pode ser usado
 *
 * Implementações possíveis:
 * - GoogleCalendarAdapter (Google Calendar)
 * - OutlookCalendarAdapter (Microsoft Outlook)
 * - AppleCalendarAdapter (iCloud)
 * - MockCalendarAdapter (testes)
 */

export interface agendaDisponivel {
  inicio: Date;
  fim: Date;
  duracaoMinutos: number;
}

/**
 * @interface ICalendarService
 *
 * Contrato para integração com calendários de prestadores
 * Permite verificar disponibilidade e bloquear horários
 */
export interface ICalendarService {
  /**
   * Verifica se prestador tem disponibilidade em data/hora específica
   *
   * Consulta o calendário do prestador para ver se está livre
   *
   * @param providerCalendarId - ID único do calendário (ex: email do Google)
   * @param dataHora - Data e hora a verificar
   * @param duracaoMinutos - Quanto tempo o serviço leva
   * @returns Promise que resolve para true se disponível, false se ocupado
   * @throws Error se falha na API do calendário
   *
   * @example
   * const ehDisponivel = await calendarService.checkAvailability(
   *   'joao@gmail.com',
   *   new Date('2026-04-15T14:30:00'),
   *   60 // 60 minutos de duração
   * );
   * if (ehDisponivel) {
   *   // Mostrar ao cliente: "Horário disponível!"
   * }
   */
  verificarDisponibilidade(
    providerCalendarId: string,
    dataHora: Date,
    duracaoMinutos: number,
  ): Promise<boolean>;

  /**
   * Retorna próximos horários disponíveis de um prestador
   *
   * Busca os 5 próximos slots livres no calendário
   *
   * @param providerCalendarId - ID único do calendário
   * @param data - Data para buscar horários
   * @param duracaoMinutos - Duração do serviço
   * @returns Promise que resolve para array de TimeSlot disponíveis
   *
   * @example
   * const slots = await calendarService.getAvailableSlots(
   *   'joao@gmail.com',
   *   new Date('2026-04-15'),
   *   60
   * );
   * // [
   * //   { inicio: Date, fim: Date, duracaoMinutos: 60 },
   * //   { ... }
   * // ]
   */
  obterDataDisponivel(
    providerCalendarId: string,
    data: Date,
    duracaoMinutos: number,
  ): Promise<agendaDisponivel[]>;

  /**
   * Bloqueia um horário no calendário após agendamento confirmado
   *
   * @param providerCalendarId - ID único do calendário
   * @param dataHora - Data e hora a bloquear
   * @param duracaoMinutos - Duração a bloquear
   * @param titulo - Título do evento (ex: "Encanamento - João Silva")
   * @returns Promise que resolve com ID do evento criado
   *
   * @example
   * const eventId = await calendarService.blockSlot(
   *   'joao@gmail.com',
   *   new Date('2026-04-15T14:30:00'),
   *   60,
   *   'Encanamento - João Silva'
   * );
   */
  bloquearHorarioAgenda(
    providerCalendarId: string,
    dataHora: Date,
    duracaoMinutos: number,
    titulo: string,
  ): Promise<string>;
  /**
   * Desbloqueia um horário (cancela evento)
   *
   * @param providerCalendarId - ID único do calendário
   * @param eventId - ID do evento a cancelar
   * @returns Promise que resolve quando cancelado
   */
  desbloquearHorarioAgenda(
    providerCalendarId: string,
    eventId: string,
  ): Promise<void>;
}
