export const TIPOS_APOIO = [
  { nome: 'Hospedagem', emoji: '🛏️' },
  { nome: 'Banho', emoji: '🚿' },
  { nome: 'Alimentação', emoji: '🍽️' },
  { nome: 'Garagem', emoji: '🏍️' },
  { nome: 'Ferramentas', emoji: '🧰' },
  { nome: 'Outros', emoji: '🤝' },
] as const;

export const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export interface DadosApoiador {
  nome: string;
  cidade: string;
  uf: string;
  contato: string;
  descricao: string;
  tipos: string[];
}
export type EstadoParticipacao = 'ativo' | 'oculto' | 'pausado';
export interface Apoiador extends DadosApoiador { id: string; userId: string; fotoUrl?: string; estado?: EstadoParticipacao; }

export function telefoneContato(valor: string): string {
  let numero = valor.replace(/\D/g, '');
  if (numero.startsWith('55') && (numero.length === 12 || numero.length === 13)) numero = numero.slice(2);
  if (numero.startsWith('0')) numero = numero.slice(1);
  return numero;
}

export function validarApoiador(dados: DadosApoiador): string | null {
  if (!dados.nome.trim() || dados.nome.trim().length > 80) return 'Informe um nome com até 80 caracteres.';
  if (!dados.cidade.trim() || dados.cidade.trim().length > 80) return 'Informe uma cidade com até 80 caracteres.';
  if (!UFS.includes(dados.uf)) return 'Informe uma UF válida.';
  if (!dados.tipos.length || dados.tipos.length > 6 || new Set(dados.tipos).size !== dados.tipos.length || dados.tipos.some(tipo => !TIPOS_APOIO.some(item => item.nome === tipo))) return 'Selecione pelo menos um dos tipos de apoio disponíveis.';
  if (dados.descricao.length > 1000) return 'Use até 1.000 caracteres na descrição.';
  const contato = dados.contato.trim();
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contato);
  const telefone = /^[\d\s()+-]+$/.test(contato) && /^[1-9]\d{9,10}$/.test(telefoneContato(contato));
  if (contato.length > 120 || (!email && !telefone)) return 'Informe um telefone com DDD ou um e-mail válido.';
  return null;
}

export function normalizarBusca(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function filtrarApoiadores(lista: Apoiador[], busca: string, tipo: string): Apoiador[] {
  const termos = normalizarBusca(busca).split(/\s+/).filter(Boolean);
  return lista.filter(item => {
    if (item.estado && item.estado !== 'ativo') return false;
    const texto = normalizarBusca(`${item.nome} ${item.cidade} ${item.uf}`);
    return (tipo === 'Todos' || item.tipos.includes(tipo)) && termos.every(termo => texto.includes(termo));
  }).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export function linksContato(contato: string): { email?: string; telefone?: string; whatsapp?: string } {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contato)) return { email: `mailto:${encodeURIComponent(contato)}` };
  const numero = telefoneContato(contato);
  if (!/^[1-9]\d{9,10}$/.test(numero)) return {};
  return { telefone: `tel:+55${numero}`, whatsapp: `https://wa.me/55${numero}` };
}
