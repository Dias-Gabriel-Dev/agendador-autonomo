/**
 * data/servicosMock.js
 * 
 * Este arquivo simula um Banco de Dados (Model) contendo
 * a lista de serviços oferecidos pelo prestador autônomo.
 */

// Lista de serviços oferecidos
const servicosDisponiveis = [
  "Marcenaria",
  "Serralheria",
  "Encanador",
  "Serviços de Alvenaria / Pedreiro",
  "Eletricista"
];

/**
 * Faz uma busca simples no nosso "Banco de Dados".
 * Ele não faz distinção entre maiúsculas/minúsculas.
 * @param {string} nomeDigitado O que o cliente digitou no Telegram
 * @returns {string | undefined} O nome oficial do serviço, ou undefined se não achar
 */
function buscarServico(nomeDigitado) {
  if (!nomeDigitado) return undefined;
  
  const busca = nomeDigitado.toLowerCase();

  return servicosDisponiveis.find(servicoDb => 
    servicoDb.toLowerCase().includes(busca)
  );
}

module.exports = {
  servicosDisponiveis,
  buscarServico
};
