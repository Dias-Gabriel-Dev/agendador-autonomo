const { google } = require('googleapis');
require('dotenv').config();

// Configurações e credenciais
// Importante: O caminho para o arquivo JSON da Service Account precisa estar na variável GOOGLE_APPLICATION_CREDENTIALS
// e o ID do calendário precisa estar em GOOGLE_CALENDAR_ID
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const calendarId = process.env.GOOGLE_CALENDAR_ID;

// Inicializa o cliente de autenticação da Service Account
const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: SCOPES,
});

// Inicializa a API do Google Calendar
const calendar = google.calendar({ version: 'v3', auth });

/**
 * Insere um evento de teste na agenda
 * @param {string} dia Data do evento (ex: '2023-10-25')
 * @param {string} horaInicio Hora de início (ex: '15:00:00')
 * @param {string} horaFim Hora de fim (ex: '16:00:00')
 * @param {string} nomeCliente Nome do cliente extraído pelo formulário
 * @param {string} telefoneCliente Telefone do cliente extraído pelo formulário
 * @param {string} servicoNome O serviço escolhido pelo usuário na lista
 */
async function inserirEventoTeste(dia, horaInicio, horaFim, nomeCliente = 'Cliente', telefoneCliente = 'N/A', servicoNome = 'Serviço Geral') {
  try {
    if (!keyFilePath || !calendarId) {
      throw new Error('As variáveis GOOGLE_APPLICATION_CREDENTIALS ou GOOGLE_CALENDAR_ID não estão definidas no .env');
    }

    console.log(`Tentando agendar ${servicoNome} para ${nomeCliente} no Google Calendar...`);
    
    // Constrói as datas de início e fim no formato ISO
    // Assumindo o fuso horário America/Sao_Paulo
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
      calendarId: calendarId,
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

// Se o arquivo for executado diretamente, roda a função de teste
if (require.main === module) {
  console.log("Executando teste isolado do calendário...");
  
  // Usaremos uma data de amanhã para o teste
  const dataDeAmanha = new Date();
  dataDeAmanha.setDate(dataDeAmanha.getDate() + 1);
  const ano = dataDeAmanha.getFullYear();
  const mes = String(dataDeAmanha.getMonth() + 1).padStart(2, '0');
  const dia = String(dataDeAmanha.getDate()).padStart(2, '0');
  const diaFormatado = `${ano}-${mes}-${dia}`;
  
  // Horário fixo: 10:00 as 11:00
  inserirEventoTeste(diaFormatado, '10:00:00', '11:00:00')
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { inserirEventoTeste };
