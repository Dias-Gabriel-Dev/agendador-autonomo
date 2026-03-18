/**
 * util/dateUtils.js
 * 
 * Este arquivo concentra toda a lógica matemática ou de formatação de datas.
 * Se houver algum bug de "horário de verão" ou "diferença de 1 hora",
 * você conserta AQUI, e todo o projeto passa a funcionar.
 */

/**
 * Pega a string suja que pode vir do Gemini, ex: "Quarta-feira, 25/10/2023"
 * e tenta arrancar só a data e formatar no estilo americano (AAAA-MM-DD)
 */
function extrairEFormatarData(dataString) {
  if (!dataString || dataString === 'null') return null;

  const match = dataString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  
  if (match) {
    const dia = match[1];
    const mes = match[2];
    const ano = match[3];
    return `${ano}-${mes}-${dia}`;
  }
  
  return null;
}

/**
 * Pega a string suja do turno, ex: "tarde, 15:00" ou apenas "tarde"
 * Tenta encontrar um horário ali no meio no formato HH:MM
 */
function extrairHorario(turnoString) {
  if (!turnoString || turnoString === 'null') return null;

  const match = turnoString.match(/(\d{1,2}:\d{2})/);
  
  if (match) {
    let horario = match[1];
    if (horario.length === 4) {
      horario = "0" + horario;
    }
    return `${horario}:00`;
  }
  
  return null;
}

/**
 * Calcula a hora do fim do evento (adicionando 1 hora de duração padrão)
 * Se começou às 15:00:00, termina às 16:00:00
 */
function calcularHoraFim(horaInicio) {
  if (!horaInicio) return null;
  
  const partes = horaInicio.split(':');
  let hora = parseInt(partes[0]);
  
  hora = hora + 1; // Duração de 1h
  
  const horaFimStr = String(hora).padStart(2, '0');
  
  return `${horaFimStr}:${partes[1]}:${partes[2]}`;
}

// Exporta as funções para que o index.js (ou qualquer outro) possa importá-las
module.exports = {
  extrairEFormatarData,
  extrairHorario,
  calcularHoraFim
};
