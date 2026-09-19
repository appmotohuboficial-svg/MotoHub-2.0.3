import { dataLocal } from './datas';

interface EventoComExpiracao {
  dataFim?: string;
  horarioFim?: string;
  expiresAt?: { toDate?: () => Date };
}

export function eventoAindaAtivo(evento: EventoComExpiracao) {
  const fim = dataLocal(evento.dataFim, evento.horarioFim || '23:59');
  if (fim && !evento.horarioFim) fim.setSeconds(59, 999);
  const expiracao = evento.expiresAt?.toDate?.() ?? fim;
  return !expiracao || expiracao.getTime() >= Date.now();
}
