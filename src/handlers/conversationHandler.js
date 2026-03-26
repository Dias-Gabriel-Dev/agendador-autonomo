import axios from 'axios';
import { extrairDadosDeAgendamento, classificarServico } from '../services/aiService.js';
import { inserirEventoTeste } from '../services/calendarService.js';
import { extrairEFormatarData, extrairHorario, calcularHoraFim } from '../utils/dateUtils.js';

const sessoesAtivas = {};

/**
 * Função responsável por rotear todas as interações de texto do usuário no Telegram.
 * Funciona como uma Máquina de Estados (FSM) gravando os dados na memória até o agendamento final.
 */
export async function handleUserMessage(ctx) {
  const usuarioId = ctx.from.id;
  const textoRecebido = ctx.message.text;

  // 1. Inicializa o estado se for a primeira mensagem ou comando /start
  if (!sessoesAtivas[usuarioId] || textoRecebido === '/start') {
    sessoesAtivas[usuarioId] = {
      passoAtual: 'PERGUNTAR_NOME',
      dadosColetados: {
        nome: null,
        telefone: null,
        endereco: null,
        servico: null,
        opcoesDeServico: [],
        profissionaisDaRegiao: []
      }
    };
    
    return ctx.reply(
      "Olá! Sou seu Assistente Virtual de Agendamentos. 📅\n" +
      "Para começarmos, qual é o seu nome?"
    );
  }

  const sessaoDoUsuario = sessoesAtivas[usuarioId];

  // 2. Roteador de Estados (Switch/Case)
  switch (sessaoDoUsuario.passoAtual) {

    case 'PERGUNTAR_NOME':
      sessaoDoUsuario.dadosColetados.nome = textoRecebido;
      sessaoDoUsuario.passoAtual = 'PERGUNTAR_TELEFONE';
      return ctx.reply(`Prazer, ${sessaoDoUsuario.dadosColetados.nome}! Qual é o seu telefone para contato (com DDD)?`);

    case 'PERGUNTAR_TELEFONE':
      sessaoDoUsuario.dadosColetados.telefone = textoRecebido;
      sessaoDoUsuario.passoAtual = 'PERGUNTAR_ENDERECO';
      return ctx.reply(`Tudo anotado! ✅\nPara localizarmos o profissional ideal, em qual cidade e bairro você está localizado?`);

    case 'PERGUNTAR_ENDERECO':
      sessaoDoUsuario.dadosColetados.endereco = textoRecebido;
      sessaoDoUsuario.passoAtual = 'PERGUNTAR_PROBLEMA';
      return ctx.reply(`Certo! Pode me descrever qual o seu problema ou o tipo de serviço que você precisa hoje?`);

    case 'PERGUNTAR_PROBLEMA':
      ctx.reply("Estou buscando profissionais perto de você...");
      try {
        // Busca na API os profissionais que atendem à localização do usuário
        const cidadeQuery = encodeURIComponent(sessaoDoUsuario.dadosColetados.endereco);
        const apiResposta = await axios.get(`http://localhost:3000/api/providers/search?cidade=${cidadeQuery}`);
        
        const profissionais = apiResposta.data.profissionais;
        sessaoDoUsuario.dadosColetados.profissionaisDaRegiao = profissionais;
        
        const servicosDaRegiao = apiResposta.data.servicosDisponiveisAqui;

        if (!servicosDaRegiao || servicosDaRegiao.length === 0) {
          return ctx.reply("Puxa, infelizmente não encontrei profissionais disponíveis na sua região no momento. Tente novamente mais tarde.");
        }

        // Pede ao LLM (Gemini) para interpretar o serviço baseado na lista filtrada
        const respostaSemantica = await classificarServico(textoRecebido, servicosDaRegiao);
        const jsonServicoLimpo = respostaSemantica.replace(/```json/g, '').replace(/```/g, '').trim();
        const busca = JSON.parse(jsonServicoLimpo);
        const encontrados = busca.servicosEncontrados || [];

        if (encontrados.length === 0) {
          return ctx.reply("Desculpe, não oferecemos esse serviço. Por favor, digite outro ou tente ser mais específico.");
        }

        if (encontrados.length === 1) {
          sessaoDoUsuario.dadosColetados.servico = encontrados[0];
          sessaoDoUsuario.passoAtual = 'AGENDAMENTO_VIA_IA';
          return ctx.reply(`Entendido: ${encontrados[0]}.\nAgora me diga, para qual dia e período você gostaria de agendar?`);
        }

        // Caso haja mais de uma opção (ambiguidade de intenção)
        if (encontrados.length > 1) {
          sessaoDoUsuario.dadosColetados.opcoesDeServico = encontrados;
          sessaoDoUsuario.passoAtual = 'ESCOLHER_SERVICO_NUMERO';
          
          let menuNumerado = "Achei algumas opções parecidas. Por favor, digite o NÚMERO da opção desejada:\n\n";
          encontrados.forEach((servico, index) => {
            menuNumerado += `${index + 1} - ${servico}\n`;
          });
          return ctx.reply(menuNumerado);
        }

      } catch (error) {
        console.error("Erro na classificação de serviço:", error);
        return ctx.reply("Ops, tive um problema ao buscar os serviços. Pode digitar o nome do serviço de novo?");
      }
      break;

    case 'ESCOLHER_SERVICO_NUMERO':
      const numeroEscolhido = parseInt(textoRecebido);
      const opcoesRestantes = sessaoDoUsuario.dadosColetados.opcoesDeServico;

      if (isNaN(numeroEscolhido) || numeroEscolhido < 1 || numeroEscolhido > opcoesRestantes.length) {
        return ctx.reply("Número inválido. Por favor, digite apenas o número de uma das opções mostradas acima.");
      }

      const servicoFinalEscolhido = opcoesRestantes[numeroEscolhido - 1];
      sessaoDoUsuario.dadosColetados.servico = servicoFinalEscolhido;
      sessaoDoUsuario.passoAtual = 'AGENDAMENTO_VIA_IA';
      return ctx.reply(`Entendido: ${servicoFinalEscolhido}.\nAgora me diga, para qual dia e período você gostaria de agendar?`);

    case 'AGENDAMENTO_VIA_IA':
      ctx.reply("Entendi! Deixa eu verificar a minha agenda...");

      try {
        // Pede ao LLM para processar a linguagem natural de tempo ("amanhã às 15h")
        const respostaDaIA = await extrairDadosDeAgendamento(textoRecebido);
        const jsonLimpo = respostaDaIA.replace(/```json/g, '').replace(/```/g, '').trim();
        const dados = JSON.parse(jsonLimpo);

        const dataFormatada = extrairEFormatarData(dados.dia);
        const horaInicioFormatada = extrairHorario(dados.turno);

        // Validação defensiva (Early Return)
        if (!dataFormatada) return ctx.reply("Desculpe, não consegui entender o *dia* que você quer. Pode repetir de outra forma?");
        if (!horaInicioFormatada) return ctx.reply(`Entendi que você quer agendar para ${dados.dia} no período da ${dados.turno || 'manhã/tarde'}. Qual horário exatamente você prefere?`);

        const horaFimFormatada = calcularHoraFim(horaInicioFormatada);
        ctx.reply(`Perfeito! Vou agendar para ${dados.dia} das ${horaInicioFormatada} até às ${horaFimFormatada}...`);

        // Matchmaking Final: Procurar no array de região qual prestador fornece esse serviço e puxar a chave dele
        const servicoEscolhido = sessaoDoUsuario.dadosColetados.servico;
        const listaProfissionais = sessaoDoUsuario.dadosColetados.profissionaisDaRegiao;
        const profissionalIdeal = listaProfissionais.find(prof => prof.servicosOferecidos.includes(servicoEscolhido));
        
        const nomeProfissional = profissionalIdeal ? profissionalIdeal.nomeFantasia : "Profissional Local";
        const emailCalendario = (profissionalIdeal && profissionalIdeal.googleCalendarId) ? profissionalIdeal.googleCalendarId : process.env.GOOGLE_CALENDAR_ID;
        
        ctx.reply(`Achei o(a) profissional perfeito: ${nomeProfissional}! Agendando na agenda dele(a)...`);

        // Inserção no Google Agenda do Prestador via API Node
        const eventoCriado = await inserirEventoTeste(
          dataFormatada, 
          horaInicioFormatada, 
          horaFimFormatada,
          sessaoDoUsuario.dadosColetados.nome,
          sessaoDoUsuario.dadosColetados.telefone,
          servicoEscolhido,
          emailCalendario
        );

        ctx.reply(`✅ Agendamento Confirmado no Google Agenda!\nAqui está o link: ${eventoCriado.htmlLink}`);
        
        // Limpa a sessão da memória do servidor e encerra o fluxo do usuário
        delete sessoesAtivas[usuarioId];

      } catch (erro) {
        console.error("Erro no processamento da IA:", erro);
        ctx.reply("Desculpe, tive um problema inesperado ao processar o seu agendamento. Pode tentar de novo?");
      }
      break;

    default:
      ctx.reply("Oops, me perdi! Vamos recomeçar? (Digite /start)");
      delete sessoesAtivas[usuarioId];
      break;
  }
}
