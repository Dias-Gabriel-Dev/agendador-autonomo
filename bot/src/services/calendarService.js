import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Garante que as credenciais do .env do Bot sejam carregadas
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const auth = new google.auth.GoogleAuth({ keyFile: keyFilePath, scopes: SCOPES });
const calendar = google.calendar({ version: 'v3', auth });

/**
 * Cria um evento agendado no Google Calendar do prestador escolhido.
 */
async function inserirEventoTeste(
  dia, 
  horaInicio, 
  horaFim, 
  nomeCliente = 'Cliente', 
  telefoneCliente = 'N/A', 
  servicoNome = 'Serviço Geral',
  calendarId // ID dinâmico vindo da requisição (do banco de dados!)
) {
  try {
    const calendarFinal = calendarId || process.env.GOOGLE_CALENDAR_ID;
    
    if (!keyFilePath || !calendarFinal) {
      throw new Error('Credenciais GOOGLE_APPLICATION_CREDENTIALS ausentes ou CalendarID inválido.');
    }

    console.log(`Agendando ${servicoNome} para ${nomeCliente} no calendário: ${calendarFinal}...`);
    
    // Converte e normaliza as datas para o padrão ISO-8601 c/ fuso de SP
    const startDateTime = `${dia}T${horaInicio}-03:00`;
    const endDateTime = `${dia}T${horaFim}-03:00`;

    const evento = {
      summary: `${servicoNome} - ${nomeCliente}`,
      description: `Agendamento automático via Telegram.\n\nServiço: ${servicoNome}\nNome: ${nomeCliente}\nTelefone: ${telefoneCliente}`,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Sao_Paulo',
      },
    };

    console.log(`Inserindo evento para ${startDateTime}...`);

    const response = await calendar.events.insert({
      calendarId: calendarFinal, // Usa o Calendar do prestador (ou fallback)
      resource: evento,
    });

    console.log('✅ Evento criado com sucesso!');
    console.log(`Link para o evento: ${response.data.htmlLink}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao criar evento no Google Calendar:');
    if (error.response && error.response.data && error.response.data.error) {
      console.error(error.response.data.error.message);
    } else {
      console.error(error.message);
    }
    throw error;
  }
}

// No ESM, a verificação de script executado diretamente muda de require.main para um check manual, ou podemos omiti-la no escopo do projeto.
export { inserirEventoTeste };
