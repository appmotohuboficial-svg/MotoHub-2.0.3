// O zero antes do DDD é apenas parte da apresentação escolhida pelo usuário.
export function formatarTelefoneApoiador(valor: string): string {
  if (/[a-zA-Z@]/.test(valor)) return valor;
  let digitos = valor.replace(/\D/g, '');
  if (digitos.startsWith('55') && digitos.length === 13) digitos = digitos.slice(2);
  if (digitos.length === 11 && !digitos.startsWith('0')) digitos = `0${digitos}`;
  digitos = digitos.slice(0, 12);
  if (!digitos) return '';
  if (digitos.length <= 3) return `(${digitos}`;
  return `(${digitos.slice(0, 3)}) ${digitos.slice(3).match(/.{1,3}/g)?.join('-') ?? ''}`;
}
