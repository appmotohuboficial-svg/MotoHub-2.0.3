/** Datas legadas são locais, no formato dd/MM/aaaa. Datas ausentes ficam no fim. */
export function dataLocal(valor?: string, horario = '00:00'): Date | null {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor || '');
  const hora = /^(\d{2}):(\d{2})$/.exec(horario);
  if (!partes || !hora) return null;
  const [, dia, mes, ano] = partes.map(Number);
  const [, horas, minutos] = hora.map(Number);
  if (horas > 23 || minutos > 59) return null;
  const data = new Date(ano, mes - 1, dia, horas, minutos);
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia ? data : null;
}

export function compararDatas(a?: string, b?: string, horaA?: string, horaB?: string) {
  const inicioA = dataLocal(a, horaA)?.getTime() ?? Infinity;
  const inicioB = dataLocal(b, horaB)?.getTime() ?? Infinity;
  return inicioA === inicioB ? 0 : inicioA < inicioB ? -1 : 1;
}

export function formatarHorario(data: Date) {
  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
}
