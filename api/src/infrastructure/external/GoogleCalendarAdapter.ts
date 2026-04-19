/**
 * GoogleCalendarAdapter - Adaptador para Google Calendar API
 *
 * Implementa ICalendarService usando Google Calendar API
 *
 * Responsabilidades:
 * - Verificar disponibilidade de prestadores
 * - Bloquear horários para agendamentos
 * - Integração com Google Calendar dos prestadores
 *
 * Isolamento:
 * - Nenhum acesso direto à API Google fora deste arquivo
 * - Autenticação via OAuth 2.0 configurado no constructor
 * - Erros de API convertidos em exceções de domínio
 */

import {
  ICalendarService,
  agendaDisponivel,
} from '../../core/interfaces/ICalendarService.js';

/**
 * @class GoogleCalendarAdapter
 *
 * Implementação de ICalendarService usando Google Calendar API
 *
 * Injeção de dependência:
 * - Cliente Google Calendar recebido no constructor (não hardcoded)
 * - Credenciais obtidas via variáveis de ambiente
 */
export class GoogleCalendarAdapter implements ICalendarService {
  /**
   * Cliente Google Calendar API
   *
   * Recebido via injeção de dependência
   * @param calendarClient - Cliente autenticado do Google Calendar
   */
  constructor(private readonly calendarClient: any) {}

  /**
   * Verifica se prestador tem disponibilidade em data/hora específica
   *
   * Consulta o calendário do prestador (Google Calendar) para ver se está livre
   *
   * @param providerCalendarId - ID único do calendário (ex: email do Google)
   * @param dataHora - Data e hora a verificar
   * @param duracaoMinutos - Quanto tempo o serviço leva
   * @returns Promise<boolean> true se disponível, false se ocupado
   * @throws Error se falha na API do Google Calendar
   */
  async verificarDisponibilidade(
    providerCalendarId: string,
    dataHora: Date,
    duracaoMinutos: number,
  ): Promise<boolean> {
    try {
      // Calcula intervalo de tempo a verificar
      const inicio = new Date(dataHora);
      const fim = new Date(dataHora.getTime() + duracaoMinutos * 60000);

      // Consulta eventos bloqueados no calendário
      const events = await this.calendarClient.events.list({
        calendarId: providerCalendarId,
        timeMin: inicio.toISOString(),
        timeMax: fim.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      // Se não há eventos conflitantes, horário está disponível
      return !events.data.items || events.data.items.length === 0;
    } catch (error) {
      console.error(
        'Erro ao verificar disponibilidade no Google Calendar:',
        error,
      );
      throw new Error('Falha ao verificar disponibilidade do prestador');
    }
  }

  /**
   * Retorna próximos horários disponíveis de um prestador
   *
   * @param providerCalendarId - ID do calendário do prestador
   * @param data - Data para buscar horários
   * @param duracaoMinutos - Duração do serviço cliente
   * @returns Promise<agendaDisponivel[]> array de horários disponíveis
   * @throws Error se falha na API
   */
  async obterDataDisponivel(
    providerCalendarId: string,
    data: Date,
    duracaoMinutos: number,
  ): Promise<agendaDisponivel[]> {
    try {
      const dataInicio = new Date(data);
      dataInicio.setHours(0, 0, 0, 0);

      const dataFim = new Date(dataInicio);
      dataFim.setDate(dataFim.getDate() + 7); // Próximos 7 dias

      // Busca todos os eventos do período
      const events = await this.calendarClient.events.list({
        calendarId: providerCalendarId,
        timeMin: dataInicio.toISOString(),
        timeMax: dataFim.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      // Retorna slots disponíveis
      const horarios: agendaDisponivel[] = [];

      // Simula slots de 1 hora a cada dia (8h-18h)
      let atual = new Date(dataInicio);
      while (atual < dataFim) {
        // Só verifica horário comercial (8h-18h)
        if (atual.getHours() >= 8 && atual.getHours() < 18) {
          const disponivel = !events.data.items?.some((event: any) => {
            const inicioEvento = new Date(
              event.start.dateTime || event.start.date,
            );
            const fimEvento = new Date(event.end.dateTime || event.end.date);
            return atual >= inicioEvento && atual < fimEvento;
          });

          if (disponivel) {
            const fimSlot = new Date(atual);
            fimSlot.setHours(fimSlot.getHours() + 1);
            horarios.push({
              inicio: new Date(atual),
              fim: fimSlot,
              duracaoMinutos: 60,
            });
          }
        }

        // Próxima hora
        atual.setHours(atual.getHours() + 1);
      }

      return horarios;
    } catch (error) {
      console.error(
        'Erro ao listar horários disponíveis no Google Calendar:',
        error,
      );
      throw new Error('Falha ao listar horários disponíveis do prestador');
    }
  }

  /**
   * Bloqueia um horário no calendário após agendamento confirmado
   *
   * @param providerCalendarId - ID do calendário do prestador
   * @param dataHora - Data e hora do agendamento
   * @param duracaoMinutos - Duração do serviço em minutos
   * @param titulo - Título do evento
   * @returns Promise<string> que retorna o ID do evento criado
   * @throws Error se falha na API ou horário já está bloqueado
   */
  async bloquearHorarioAgenda(
    providerCalendarId: string,
    dataHora: Date,
    duracaoMinutos: number,
    titulo: string,
  ): Promise<string> {
    try {
      // Verifica primeiro se está disponível
      const disponivel = await this.verificarDisponibilidade(
        providerCalendarId,
        dataHora,
        duracaoMinutos,
      );

      if (!disponivel) {
        throw new Error('Horário já está bloqueado no calendário do prestador');
      }

      // Cria evento no calendário
      const fim = new Date(dataHora.getTime() + duracaoMinutos * 60000);

      const event = await this.calendarClient.events.insert({
        calendarId: providerCalendarId,
        requestBody: {
          summary: titulo,
          start: {
            dateTime: dataHora.toISOString(),
            timeZone: 'America/Sao_Paulo',
          },
          end: {
            dateTime: fim.toISOString(),
            timeZone: 'America/Sao_Paulo',
          },
          description: 'Agendamento feito via Agendador Autônomo',
          transparency: 'busy',
        },
      });

      return event.data.id;
    } catch (error) {
      console.error('Erro ao bloquear horário no Google Calendar:', error);
      throw new Error('Falha ao bloquear horário no calendário do prestador');
    }
  }

  /**
   * Desbloqueia um horário (cancela evento)
   *
   * @param providerCalendarId - ID do calendário do prestador
   * @param eventId - ID do evento a cancelar
   * @returns Promise<void>
   * @throws Error se falha na API ou evento não encontrado
   */
  async desbloquearHorarioAgenda(
    providerCalendarId: string,
    eventId: string,
  ): Promise<void> {
    try {
      await this.calendarClient.events.delete({
        calendarId: providerCalendarId,
        eventId: eventId,
      });
    } catch (error) {
      console.error('Erro ao liberar horário no Google Calendar:', error);
      throw new Error('Falha ao liberar horário no calendário do prestador');
    }
  }
}
