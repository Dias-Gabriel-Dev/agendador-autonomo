import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Realiza query dinâmica de prestadores por região e agrupa seus serviços em um array (Set) de Strings não repetidas.
 */
async function searchProviders(req, res) {
  try {
    const { cidade, bairro } = req.query;
    let filtros = {};

    if (cidade) filtros.cidade = { contains: cidade, mode: 'insensitive' };
    if (bairro) filtros.bairro = { contains: bairro, mode: 'insensitive' };

    const prestadores = await prisma.perfilPrestador.findMany({
      where: filtros,
      select: { id: true, nomeFantasia: true, servicosOferecidos: true, cidade: true, bairro: true }
    });

    let todosOsServicos = new Set();
    prestadores.forEach(prestador => prestador.servicosOferecidos.forEach(servico => todosOsServicos.add(servico)));

    return res.status(200).json({
      totalPrestadoresNaRegiao: prestadores.length,
      servicosDisponiveisAqui: Array.from(todosOsServicos),
      profissionais: prestadores
    });

  } catch (erro) {
    console.error('Erro na busca de provedores:', erro);
    return res.status(500).json({ erro: 'Erro interno ao buscar prestadores.' });
  }
}

export {
  searchProviders
};
