/**
 * Extrai data padrão (DD/MM/AAAA) da string do Gemini e formata para (AAAA-MM-DD)
 */
function extrairEFormatarData(dataString) {
  if (!dataString || dataString === 'null') return null;

  const match = dataString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [_, dia, mes, ano] = match;
    return `${ano}-${mes}-${dia}`;
  }
  return null;
}

/**
 * Extrai padrão (HH:MM) da string do Gemini e adiciona formato compatível com API (:SS)
 */
function extrairHorario(turnoString) {
  if (!turnoString || turnoString === 'null') return null;

  const match = turnoString.match(/(\d{1,2}:\d{2})/);
  if (match) {
    let horario = match[1];
    if (horario.length === 4) horario = "0" + horario;
    return `${horario}:00`;
  }
  return null;
}

/**
 * Calcula hora final assumindo uma (1) hora fixa de duração de serviço ou visita.
 */
function calcularHoraFim(horaInicio) {
  if (!horaInicio) return null;
  
  const partes = horaInicio.split(':');
  let hora = parseInt(partes[0]) + 1;
  const horaFimStr = String(hora).padStart(2, '0');
  
  return `${horaFimStr}:${partes[1]}:${partes[2]}`;
}

export {
  extrairEFormatarData,
  extrairHorario,
  calcularHoraFim
};
