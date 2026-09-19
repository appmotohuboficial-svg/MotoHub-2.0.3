export const MOEDA_PADRAO = 'BRL';

export function formatarMoeda(valor: number, moeda = MOEDA_PADRAO, locale = 'pt-BR') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: moeda }).format(valor);
}

/** Entrada em centavos; código ISO separado do valor persistido. */
export function lerCentavos(texto: string) {
  const digitos = texto.replace(/\D/g, '');
  return digitos ? Number(digitos) / 100 : 0;
}

export function calcularTotal(litros: number, preco: number) {
  return Math.round((litros * preco + Number.EPSILON) * 100) / 100;
}
