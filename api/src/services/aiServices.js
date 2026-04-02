import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Garante que as credenciais do .env do Bot sejam carregadas
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Extrai dados de agendamento em JSON via Gemini.
 * @param {string} mensagemDoCliente O texto enviado pelo cliente no Telegram
 * @returns {string} JSON contendo as chaves "dia" e "turno"
 */
async function extrairDadosDeAgendamento(mensagemDoCliente) {
  try {
    if (!mensagemDoCliente || mensagemDoCliente.trim() === "") {
      throw new Error("A mensagem do cliente vazia ou inválida.");
    }

    const modelo = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
    
      const resultado = await modelo.generateContent(instrucao);
      const resposta = resultado.response.text();

      return resposta.trim();

  } catch (erro) {
    console.error("Erro em extratir dados de agendamento:", erro.message);
    throw erro;
  }
}

/**
 * Classifica a intenção do serviço usando busca semântica no Gemini.
 * @param {string} textoDoCliente Texto do cliente
 * @param {Array<string>} listaDeServicos Lista base de serviços para correlacionar
 * @returns {string} JSON contendo "servicosEncontrados" (Array)
 */
async function classificarServico(textoDoCliente, listaDeServicos) {
  try {
    if (!textoDoCliente || textoDoCliente.trim() === "") {
      throw new Error("O texto do cliente está vazio ou inválido.");
    }

    if (!listaDeServicos || listaDeServicos.length === 0) {
      throw new Error("A lista de serviços vazia");

    } 
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
      const resposta = resultado.response.text();

      return resposta.trim();
  } catch (erro) {
    console.error("Erro em classificar serviço:", erro.message);
    throw erro;
  }
  
}

/**Extrai cidade e bairro de uma frase do usuário usando IA
 * @param {string} textoDoCliente Texto do cliente(ex: "Osasco - Veloso" ou "nomeCidade NomeBairro")
 * @return {string} JSON contendo "cidade" e "bairro"
 */
async function extrairEndereco(textoDoCliente) {
  try {
    if (!textoDoCliente || textoDoCliente.trim() === "") {
      throw new Error("O texto do cliente está vazio ou inválido.");
    }
    const modelo = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const instrucao = `
    Você é um extrator de endereços .
    Leia a seguinte mensagem do usuário: "${textoDoCliente}"

    Extraia a cidade e o bairro informados.
    Se não encontrar a cidade, deixe como null.
    Se não encontrar o bairro, deixe como null.

    Responda APENAS com um objeto JSON válido contendo as chaves:
    - "cidade" (string)
    - "bairro" (string)
    Não escreva mais nada além do JSON (nem aspas, nem markdown).`;

    const resultado = await modelo.generateContent(instrucao);
    const resposta = resultado.response.text();
    return resposta.trim();
} catch (erro) {
    console.error("Erro em extrair endereço:", erro.message);
    throw erro;
  }
}

export {
  extrairDadosDeAgendamento,
  classificarServico,
  extrairEndereco
};