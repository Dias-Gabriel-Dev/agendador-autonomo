import axios from "axios";
import {
  extrairDadosDeAgendamento,
  classificarServico,
  extrairEndereco,
} from "../../api/src/services/aiServices.js";
import {
  extrairEFormatarData,
  extrairHorario,
  calcularHoraFim,
} from "../utils/dateUtils.js";

const sessoesAtivas = {};

// --- FUNÇÕES ATÔMICAS DE FLUXO ---

async function fluxoBoasVindas(ctx, usuarioId) {
  sessoesAtivas[usuarioId] = {
    passoAtual: "PERGUNTAR_NOME",
    dadosColetados: {
      nome: null,
      telefone: null,
      endereco: null,
      problema: null,
    },
  };
  return ctx.reply(
    "Olá! Sou seu Assistente Virtual de Agendamentos. 📅\nPara começarmos, qual é o seu nome?",
  );
}

async function fluxoNome(ctx, sessao) {
  sessao.dadosColetados.nome = ctx.message.text;
  sessao.passoAtual = "PERGUNTAR_TELEFONE";
  return ctx.reply(
    `Prazer, ${sessao.dadosColetados.nome}! Qual é o seu telefone para contato (com DDD)?`,
  );
}

async function fluxoTelefone(ctx, sessao) {
  sessao.dadosColetados.telefone = ctx.message.text;
  sessao.passoAtual = "PERGUNTAR_ENDERECO";
  return ctx.reply(
    `Tudo anotado! ✅\nPara localizarmos o profissional ideal, em qual cidade e bairro que você está localizado?`,
  );
}

async function fluxoEndereco(ctx, sessao) {
  sessao.dadosColetados.endereco = ctx.message.text;
  sessao.passoAtual = "PERGUNTAR_PROBLEMA";
  return ctx.reply(
    `Certo! Pode me descrever qual o seu problema ou o tipo de serviço que você precisa hoje?`,
  );
}

// 3. Fase de Coleta Bruta: O bot anota o problema e avança para a data sem validar nada ainda (Lazy Match)
async function fluxoProblema(ctx, sessao) {
  sessao.dadosColetados.problema = ctx.message.text;
  sessao.passoAtual = "AGENDAMENTO_DATA";
  return ctx.reply(
    `Entendido. Para qual dia e período você gostaria que o serviço fosse realizado?`,
  );
}

// 4. O Matchmaker Definitivo: Ele extrai a data via IA, envia o pacote de dados pra API Express e ela devolve o Match pronto.
async function fluxoAgendamentoData(ctx, sessao, usuarioId) {
  ctx.reply(
    "Processando o seu pedido e buscando os melhores profissionais livres na sua região...",
  );
  try {
    // A. Extrai data com o Gemini
    const respostaDaIA = await extrairDadosDeAgendamento(ctx.message.text);
    const jsonLimpo = respostaDaIA
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const dados = JSON.parse(jsonLimpo);

    const dataFormatada = extrairEFormatarData(dados.dia);
    const horaInicioFormatada = extrairHorario(dados.turno);

    if (!dataFormatada || !horaInicioFormatada) {
      return ctx.reply(
        "Desculpe, não consegui entender o dia e a hora. Pode repetir de forma mais específica? (Ex: Amanhã às 15h)",
      );
    }

    const horaFimFormatada = calcularHoraFim(horaInicioFormatada);

    // B. Normalizar Endereço com IA
    const respostaEndereco = await extrairEndereco(
      sessao.dadosColetados.endereco,
    );
    const jsonEnderecoLimpo = respostaEndereco
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const enderecoParsed = JSON.parse(jsonEnderecoLimpo);
    const cidadeNormalizada =
      enderecoParsed.cidade || sessao.dadosColetados.endereco;
    const bairroNormalizado = enderecoParsed.bairro || "";

    // C. Buscar Lista de Serviços Disponíveis na Região
    const queryParams = new URLSearchParams();
    if (cidadeNormalizada) queryParams.append("cidade", cidadeNormalizada);
    if (bairroNormalizado) queryParams.append("bairro", bairroNormalizado);

    const searchResponse = await axios.get(
      `http://localhost:3000/api/providers/search?${queryParams}`,
    );
    const listaDeServiços = searchResponse.data.servicosDisponiveisAqui || [];

    // D. Classificar Serviço com IA
    let servicoClassificado = sessao.dadosColetados.problema;
    if (listaDeServiços.length > 0) {
      const respostaClassificacao = await classificarServico(
        sessao.dadosColetados.problema,
        listaDeServiços,
      );
      const jsonClassificacaoLimpo = respostaClassificacao
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const classificacao = JSON.parse(jsonClassificacaoLimpo);
      servicoClassificado =
        classificacao.servicosEncontrados?.[0] ||
        sessao.dadosColetados.problema;
    }

    // E. Montar Payload com Dados Normalizados
    const payloadParaAPI = {
      cliente: {
        nome: sessao.dadosColetados.nome,
        telefone: sessao.dadosColetados.telefone,
        enderecoBruto: sessao.dadosColetados.endereco,
      },
      servicoBuscado: servicoClassificado,
      agendamento: {
        dia: dataFormatada,
        horaInicio: horaInicioFormatada,
        horaFim: horaFimFormatada,
      },
    };

    // Chamada à API de Match (A API criará a regra de negócio do Calendar lá e retornará o link pronto!)
    const matchResponse = await axios.post(
      "http://localhost:3000/api/providers/match",
      payloadParaAPI,
    );

    ctx.reply(
      `Achei o profissional perfeito: ${matchResponse.data.profissionalSelecionado}! ✅\n\n` +
        `O agendamento já foi confirmado na agenda dele.\nLink: ${matchResponse.data.linkEvento}`,
    );

    delete sessoesAtivas[usuarioId];
  } catch (erro) {
    console.error(
      "Erro no Matchmaking via API:",
      erro.response?.data || erro.message,
    );
    const mensagemErro =
      erro.response?.data?.erro ||
      "Desculpe, tive um problema inesperado ao processar o seu agendamento. Pode tentar de novo?";
    ctx.reply(mensagemErro);
    delete sessoesAtivas[usuarioId];
  }
}

// --- ROTEADOR PRINCIPAL ---

export async function handleUserMessage(ctx) {
  const usuarioId = ctx.from.id;
  const texto = ctx.message.text;

  if (!sessoesAtivas[usuarioId] || texto === "/start") {
    return fluxoBoasVindas(ctx, usuarioId);
  }

  const sessao = sessoesAtivas[usuarioId];

  switch (sessao.passoAtual) {
    case "PERGUNTAR_NOME":
      return fluxoNome(ctx, sessao);
    case "PERGUNTAR_TELEFONE":
      return fluxoTelefone(ctx, sessao);
    case "PERGUNTAR_ENDERECO":
      return fluxoEndereco(ctx, sessao);
    case "PERGUNTAR_PROBLEMA":
      return fluxoProblema(ctx, sessao);
    case "AGENDAMENTO_DATA":
      return fluxoAgendamentoData(ctx, sessao, usuarioId);
    default:
      ctx.reply("Oops, me perdi! Vamos recomeçar? (Digite /start)");
      delete sessoesAtivas[usuarioId];
      break;
  }
}
