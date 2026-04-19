import 'dotenv/config';
import { google } from 'googleapis';

const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const calendarId = process.env.GOOGLE_CALENDAR_ID;
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const auth = new google.auth.GoogleAuth({ keyFile: keyFilePath, scopes: SCOPES });
const calendar = google.calendar({ version: 'v3', auth });

/**
 * Script de utilidade: Varre a agenda listada no .env e exclui eventos futuros com tags de agendamento automático.
 */
async function faxinaNaAgenda() {
  try {
    console.log(`🧹 Iniciando faxina na agenda: ${calendarId}`);
    const tempoAtual = new Date().toISOString();
    
    const respostaListagem = await calendar.events.list({
      calendarId: calendarId,
      timeMin: tempoAtual,
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const eventos = respostaListagem.data.items;
    
    if (!eventos || eventos.length === 0) {
      return console.log('✅ Nenhum evento futuro encontrado na sua agenda.');
    }

    console.log(`Encontrados ${eventos.length} eventos totais. Filtrando...`);
    let deletadosCount = 0;

    for (const evento of eventos) {
      const titulo = evento.summary || '';
      const descricao = evento.description || '';
      
      const ehDoBot = titulo.includes('Agendamento de Teste') || 
                      titulo.includes('Agendamento -') ||
                      descricao.includes('Agendamento automático via Telegram') ||
                      titulo.includes('Marcenaria -') ||
                      titulo.includes('Serralheria -') ||
                      titulo.includes('Encanador -') ||
                      titulo.includes('Serviços de Alvenaria / Pedreiro -') ||
                      titulo.includes('Eletricista -');

      if (ehDoBot) {
        console.log(`🗑️  Deletando: "${titulo}" (Data: ${evento.start?.dateTime || evento.start?.date || 'sem data'})`);
        
        await calendar.events.delete({ calendarId: calendarId, eventId: evento.id });
        deletadosCount++;
      }
    }

    if (deletadosCount > 0) {
      console.log(`✨ Faxina concluída! Removemos ${deletadosCount} eventos de teste.`);
    } else {
      console.log('✅ A agenda já está limpa.');
    }

  } catch (erro) {
    console.error('❌ Ocorreu um erro durante a faxina:', erro.message);
  }
}

faxinaNaAgenda();
