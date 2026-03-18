require("dotenv").config();

const { Telegraf } = require("telegraf");

// -------------------------------------------------------------
// ARQUITETURA MODULAR (CLEAN CODE)
// -------------------------------------------------------------
// Aqui o index.js delega tarefas. Importamos tudo que precisamos:
const { extrairDadosDeAgendamento, classificarServico } = require('./src/services/aiService');
const { inserirEventoTeste } = require('./src/services/calendarService');
const { extrairEFormatarData, extrairHorario, calcularHoraFim } = require('./src/utils/dateUtils');
const { servicosDisponiveis } = require('./src/data/servicosMock');

// O index.js cuida apenas de ligar e controlar o Telegram
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// -------------------------------------------------------------
// MÁQUINA DE ESTADOS (STATE MACHINE) DO BOT
// -------------------------------------------------------------
// O bot precisa saber em qual "passo" o usuário está conversando.
// Criamos um objeto complexo em vez de apenas "true" ou "false".
const sessoesAtivas = {};

bot.on("text", async (ctx) => {
  const usuarioId = ctx.from.id;
  const textoRecebido = ctx.message.text;

  // Se for a primeira vez do usuário, ou se ele forçar o /start (querendo reiniciar tudo)
  if (!sessoesAtivas[usuarioId] || textoRecebido === '/start') {
    // Inicializa a MÁQUINA DE ESTADOS para esse cliente
    sessoesAtivas[usuarioId] = {
      passoAtual: 'PERGUNTAR_NOME', // Ele começa no passo 1
      dadosColetados: {
        nome: null,
        telefone: null,
        servico: null,
        opcoesDeServico: [] // Guarda as opções em caso de ambiguidade
      }
    };
    
    return ctx.reply(
      "Olá! Sou seu Assistente Virtual de Agendamentos. 📅\n" +
      "Para começarmos, qual é o seu nome?"
    );
  }

  // Pega a sessão do usuário que já começou a conversar
  const sessaoDoUsuario = sessoesAtivas[usuarioId];

  // SWITCH/CASE: O "Cérebro" que decide o que fazer baseado no passo atual
  switch (sessaoDoUsuario.passoAtual) {

    // ----------------------------------------------------
    case 'PERGUNTAR_NOME':
      // A mensagem que ele digitou AGORA é o nome dele!
      sessaoDoUsuario.dadosColetados.nome = textoRecebido;
      
      // Muda de estado (avança de nível)
      sessaoDoUsuario.passoAtual = 'PERGUNTAR_TELEFONE';
      
      return ctx.reply(`Prazer, ${sessaoDoUsuario.dadosColetados.nome}! Qual é o seu telefone para contato (com DDD)?`);

    // ----------------------------------------------------
    case 'PERGUNTAR_TELEFONE':
      // A mensagem que ele digitou AGORA é o telefone!
      sessaoDoUsuario.dadosColetados.telefone = textoRecebido;
      
      // Muda de estado (agora vai pro passo de escolher o serviço)
      sessaoDoUsuario.passoAtual = 'PERGUNTAR_SERVICO';
      
      // Cria uma string bonita com todos os serviços em tópicos (ex: "- Manutenção\n- Limpeza")
      const listaServicos = servicosDisponiveis.map(s => `- ${s}`).join("\n");
      
      return ctx.reply(`Tudo anotado! ✅\nQual tipo de serviço você busca? Temos estas opções:\n\n${listaServicos}\n\nDigite o nome de um deles:`);

    // ----------------------------------------------------
    case 'PERGUNTAR_SERVICO':
      ctx.reply("Estou verificando nossos serviços...");
      try {
        // Usamos o Gemini para "adivinhar" o que ele quer, independente de erros de digitação!
        const respostaSemantica = await classificarServico(textoRecebido, servicosDisponiveis);
        const jsonServicoLimpo = respostaSemantica.replace(/```json/g, '').replace(/```/g, '').trim();
        const busca = JSON.parse(jsonServicoLimpo);

        const encontrados = busca.servicosEncontrados || [];

        if (encontrados.length === 0) {
          return ctx.reply("Desculpe, não oferecemos esse serviço. Por favor, digite outro ou tente ser mais específico.");
        }

        if (encontrados.length === 1) {
          // Bingo! A IA achou exatamente UM serviço.
          sessaoDoUsuario.dadosColetados.servico = encontrados[0];
          sessaoDoUsuario.passoAtual = 'AGENDAMENTO_VIA_IA';
          return ctx.reply(`Entendido: ${encontrados[0]}.\nAgora me diga, para qual dia e período você gostaria de agendar?`);
        }

        // Se encontrou MAIS DE UM (ambiguidade), nós pedimos para ele escolher por NÚMERO
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

    // ----------------------------------------------------
    case 'ESCOLHER_SERVICO_NUMERO':
      // Aqui ele deve ter digitado um número, ex: "1" ou "2"
      const numeroEscolhido = parseInt(textoRecebido);
      const opcoesRestantes = sessaoDoUsuario.dadosColetados.opcoesDeServico;

      // Verifica se o que ele digitou é um número válido (1, 2, 3...)
      if (isNaN(numeroEscolhido) || numeroEscolhido < 1 || numeroEscolhido > opcoesRestantes.length) {
        return ctx.reply("Número inválido. Por favor, digite apenas o número de uma das opções mostradas acima.");
      }

      // Arrays em JS começam no índice 0. Se ele digitou 1, o índice é 0.
      const indiceReal = numeroEscolhido - 1;
      const servicoFinalEscolhido = opcoesRestantes[indiceReal];

      sessaoDoUsuario.dadosColetados.servico = servicoFinalEscolhido;
      sessaoDoUsuario.passoAtual = 'AGENDAMENTO_VIA_IA';

      return ctx.reply(`Entendido: ${servicoFinalEscolhido}.\nAgora me diga, para qual dia e período você gostaria de agendar?`);

    // ----------------------------------------------------
    case 'AGENDAMENTO_VIA_IA':
      // O usuário chegou no chefe final. Aqui nós chamamos o serviço de Inteligência Artificial!
      ctx.reply("Entendi! Deixa eu verificar a minha agenda...");

      try {
        const respostaDaIA = await extrairDadosDeAgendamento(textoRecebido);
        const jsonLimpo = respostaDaIA.replace(/```json/g, '').replace(/```/g, '').trim();
        const dados = JSON.parse(jsonLimpo);

        const dataFormatada = extrairEFormatarData(dados.dia);
        const horaInicioFormatada = extrairHorario(dados.turno);

        // Se faltar algum dado, a gente barra e ele TENTA DE NOVO (o estado continua em AGENDAMENTO_VIA_IA)
        if (!dataFormatada) {
          return ctx.reply("Desculpe, não consegui entender o *dia* que você quer. Pode repetir de outra forma?");
        }
        if (!horaInicioFormatada) {
          return ctx.reply(`Entendi que você quer agendar para ${dados.dia} no período da ${dados.turno || 'manhã/tarde'}. Qual horário exatamente você prefere?`);
        }

        const horaFimFormatada = calcularHoraFim(horaInicioFormatada);
        ctx.reply(`Perfeito! Vou agendar para ${dados.dia} das ${horaInicioFormatada} até às ${horaFimFormatada}...`);

        // INSERE O EVENTO NO CALENDAR (agora com data, hora, nome, telefone e o servico)
        const eventoCriado = await inserirEventoTeste(
          dataFormatada, 
          horaInicioFormatada, 
          horaFimFormatada,
          sessaoDoUsuario.dadosColetados.nome,
          sessaoDoUsuario.dadosColetados.telefone,
          sessaoDoUsuario.dadosColetados.servico
        );

        ctx.reply(`✅ Agendamento Confirmado no Google Agenda!\nAqui está o link: ${eventoCriado.htmlLink}`);

        // DELETA a sessão da memória do servidor para o cara poder agendar outra coisa do zero no futuro
        delete sessoesAtivas[usuarioId];

      } catch (erro) {
        console.error("Erro no processamento:", erro);
        ctx.reply("Desculpe, tive um problema inesperado ao processar o seu agendamento. Pode tentar de novo?");
      }
      break;

    // Se o switch quebrar ou perder o estado (erro de lógica)
    default:
      ctx.reply("Oops, me perdi! Vamos recomeçar? (Digite /start)");
      delete sessoesAtivas[usuarioId];
      break;
  }
});

// Inicia o bot e exibe uma mensagem no terminal assim que ele estiver escutando
bot.launch(() => {
  console.log("Bot rodando! Vá para o Telegram e mande um /start");
});

// Configurações para um encerramento seguro (gracioso) do bot ao parar o processo (ex: Ctrl+C)
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
