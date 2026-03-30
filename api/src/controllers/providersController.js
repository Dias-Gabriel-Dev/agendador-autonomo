import { PrismaClient } from "@prisma/client";
import { extrairEndereco } from "../../../bot/src/services/aiService.js";

const prisma = new PrismaClient();

/**
 * Realiza query dinâmica de prestadores por região e agrupa seus serviços em um array (Set) de Strings não repetidas.
 */
async function searchProviders(req, res) {
  try {
    const { cidade, bairro } = req.query;
    let filtros = {};

    if (cidade) filtros.cidade = { contains: cidade, mode: "insensitive" };
    if (bairro) filtros.bairro = { contains: bairro, mode: "insensitive" };

    const prestadores = await prisma.perfilPrestador.findMany({
      where: filtros,
      select: {
        id: true,
        nomeFantasia: true,
        googleCalendarId: true,
        telefoneContato: true,
        servicosOferecidos: true,
        cidade: true,
        bairro: true,
      },
    });

    let todosOsServicos = new Set();
    prestadores.forEach((prestador) =>
      prestador.servicosOferecidos.forEach((servico) =>
        todosOsServicos.add(servico),
      ),
    );

    return res.status(200).json({
      totalPrestadoresNaRegiao: prestadores.length,
      servicosDisponiveisAqui: Array.from(todosOsServicos),
      profissionais: prestadores,
    });
  } catch (erro) {
    console.error("Erro na busca de provedores:", erro);
    return res
      .status(500)
      .json({ erro: "Erro interno ao buscar prestadores." });
  }
}

async function matchProviders(req, res) {
  try {
    // Corpo da requisição que o bot mandou via rota POST
    const { cliente, servicoBuscado, agendamento } = req.body;

    console.log(
      `Novo de pedido de Match recebido para o serviço: ${servicoBuscado}`,
    );

    // Lógica do Prisma e da API para encontrar os prestadores que oferecem o serviço buscado
    // Normalizar endereço bruto usando IA
    const respostaEndereco = await extrairEndereco(cliente.enderecoBruto);
    const jsonEnderecoLimpo = respostaEndereco
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const enderecoParsed = JSON.parse(jsonEnderecoLimpo);
    const cidadeNormalizada = enderecoParsed.cidade || "";
    const bairroNormalizado = enderecoParsed.bairro || "";

    // Construir filtros dinâmicos baseado nos dados normalizados
    const filtrosLocacao = [];
    if (cidadeNormalizada) {
      filtrosLocacao.push({
        cidade: { contains: cidadeNormalizada, mode: "insensitive" },
      });
    }
    if (bairroNormalizado) {
      filtrosLocacao.push({
        bairro: { contains: bairroNormalizado, mode: "insensitive" },
      });
    }

    const profissionaisEncontrados = await prisma.perfilPrestador.findMany({
      where: {
        servicosOferecidos: {
          has: servicoBuscado,
        },
        ...(filtrosLocacao.length > 0 && { OR: filtrosLocacao }),
      },
      select: {
        id: true,
        nomeFantasia: true,
        googleCalendarId: true,
        telefoneContato: true,
        servicosOferecidos: true,
      },
    });

    if (profissionaisEncontrados.length === 0) {
      return res.status(404).json({
        erro: "Nenhum profissional encontrado para o serviço e localização fornecidos.",
      });
    }

    const profissionalIdeal = profissionaisEncontrados[0];

    console.log(`Match feito com sucesso: ${profissionalIdeal.nomeFantasia}`);

    return res.status(200).json({
      profissionalSelecionado: profissionalIdeal.nomeFantasia,
      emailCalendario: profissionalIdeal.googleCalendarId || null,
      telefone: profissionalIdeal.telefoneContato,
    });
  } catch (erro) {
    console.error("Erro no Matchmaking:", erro);
    return res.status(500).json({ erro: "Falha na central de agendamentos." });
  }
}

export { searchProviders, matchProviders };
