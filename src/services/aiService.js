/**
 * services/aiService.js
 * 
 * Este serviço é responsável SOMENTE por falar com o Modelo de Inteligência Artificial.
 * Se amanhã trocarmos do Gemini para o ChatGPT, você só mexe neste arquivo!
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Inicializa a IA usando a chave que está no .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Função responsável por enviar a mensagem para a IA e extrair os dados de agendamento em JSON.
 * @param {string} mensagemDoCliente O texto cru enviado pelo cliente no Telegram
 * @returns {string} String no formato JSON com as chaves "dia" e "turno"
 */
async function extrairDadosDeAgendamento(mensagemDoCliente) {
  const modelo = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Captura a data atual formatada (ajuste o timezone se necessário)
  const dataAtual = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  const instrucao = `
  Você é um assistente virtual de agendamentos.
  A data e hora atuais do sistema são: ${dataAtual}. Use esta informação como referência temporal para interpretar a mensagem do cliente.
  Leia a seguinte mensagem do cliente: "${mensagemDoCliente}"
  
  Extraia a intenção de data e horário. Converta datas relativas (como "amanhã", "terça-feira") para a data exata correspondente.
  Responda APENAS com um objeto JSON válido contendo as chaves:
  - "dia" (dia da semana por extenso seguido da data exata no formato DD/MM/AAAA. Ex: "Quarta-feira, 25/10/2023")
  - "turno" (período do dia, ex: "manhã", "tarde" ou "noite", seguido do horário exato se o cliente solicitar. Ex: "manhã", "tarde, 15:00", "noite, 20:00")
  Se não encontrar a informação na frase, use null. Não escreva mais nada além do JSON.`;

  // Envia a instrução para a IA e retorna apenas o texto da resposta
  const resultado = await modelo.generateContent(instrucao);
  return resultado.response.text();
}

/**
 * Função responsável por classificar e fazer "busca semântica" do serviço que o cliente quer.
 * @param {string} textoDoCliente O que o cliente digitou ("eletrica", "pedrero", "fazer uma parede")
 * @param {Array<string>} listaDeServicos O nosso "banco de dados" de serviços disponíveis
 * @returns {string} String no formato JSON com um Array de "servicosEncontrados" que combinam
 */
async function classificarServico(textoDoCliente, listaDeServicos) {
  const modelo = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const listaFormatada = listaDeServicos.join(", ");

  const instrucao = `
  Você é um sistema de busca semântica para um prestador de serviços.
  O usuário digitou o seguinte pedido: "${textoDoCliente}"
  
  O nosso catálogo de serviços oferecidos é composto APENAS por: [${listaFormatada}]
  
  Sua tarefa é encontrar qual ou quais serviços do nosso catálogo mais se aproximam do que o usuário pediu, levando em conta erros de digitação (ex: "eletrica" = "Eletricista", "parede" = "Serviços de Alvenaria / Pedreiro").
  
  Se não houver NENHUM serviço que faça sentido, retorne uma lista vazia.
  Se houver mais de um serviço que possa atender a abstração do usuário, retorne todos eles.
  Se for claro e exato o que ele quer, retorne apenas 1 item exato do catálogo.

  Responda APENAS com um objeto JSON válido contendo a chave:
  - "servicosEncontrados" (Array de strings contendo EXATAMENTE os nomes dos serviços do nosso catálogo que você identificou).
  Não escreva mais nada além do JSON.`;

  const resultado = await modelo.generateContent(instrucao);
  return resultado.response.text();
}

// Exportamos as funções principais do serviço de IA
module.exports = {
  extrairDadosDeAgendamento,
  classificarServico
};
