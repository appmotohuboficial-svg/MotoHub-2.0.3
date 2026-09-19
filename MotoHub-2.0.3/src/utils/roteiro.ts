export interface CoordenadaRota { latitude: number; longitude: number }

// Enquadra todo o roteiro já na montagem, mesmo antes dos eventos nativos do mapa.
export function regiaoDaRota(pontos: CoordenadaRota[]) {
  if (pontos.length < 2 || !pontos.every(coordenadaValida)) throw new Error('Rota inválida.');
  let sul = 90, norte = -90, oeste = 180, leste = -180;
  for (const ponto of pontos) {
    sul = Math.min(sul, ponto.latitude); norte = Math.max(norte, ponto.latitude);
    oeste = Math.min(oeste, ponto.longitude); leste = Math.max(leste, ponto.longitude);
  }
  return { latitude: (sul + norte) / 2, longitude: (oeste + leste) / 2,
    latitudeDelta: Math.max(0.02, (norte - sul) * 1.3),
    longitudeDelta: Math.max(0.02, (leste - oeste) * 1.3) };
}

export type TipoPontoIntermediario = 'parada' | 'passagem';
export interface PontoIntermediario {
  local: string;
  tipo: TipoPontoIntermediario;
}

// Compatível com o limite do Google Maps em navegadores móveis.
export const MAX_PASSAGENS = 3;

export function normalizarPontosIntermediarios(valor: unknown, legado: unknown = []): PontoIntermediario[] {
  const origem = Array.isArray(valor) && valor.length ? valor : legado;
  if (!Array.isArray(origem)) return [];
  return origem
    .map((item): PontoIntermediario | null => {
      if (typeof item === 'string') {
        const local = item.trim();
        return local ? { local, tipo: 'passagem' } : null;
      }
      if (!item || typeof item !== 'object') return null;
      const bruto = item as any;
      const local = typeof bruto.local === 'string'
        ? bruto.local.trim()
        : [bruto.cidade, bruto.uf].filter((parte) => typeof parte === 'string' && parte.trim()).map((parte) => parte.trim()).join(' - ');
      if (!local) return null;
      return { local, tipo: bruto.tipo === 'parada' ? 'parada' : 'passagem' };
    })
    .filter((item): item is PontoIntermediario => !!item);
}

export function normalizarPassagens(valor: unknown): string[] {
  return normalizarPontosIntermediarios(valor).map((item) => item.local);
}
export function coordenadaValida(ponto: any): ponto is CoordenadaRota {
  return ponto != null && Number.isFinite(ponto.latitude) && Number.isFinite(ponto.longitude)
    && Math.abs(ponto.latitude) <= 90 && Math.abs(ponto.longitude) <= 180;
}
export function criarUrlGoogleMaps(origem: string, destino: string, passagens: unknown = [], navegar = false): string {
  if (!origem?.trim() || !destino?.trim()) throw new Error('Informe origem e destino.');
  const pontos = normalizarPassagens(passagens);
  if (pontos.length > MAX_PASSAGENS) throw new Error('Use até três passagens para abrir o roteiro no navegador móvel.');
  const parametros = [
    'api=1', 'origin=' + encodeURIComponent(origem.trim()), 'destination=' + encodeURIComponent(destino.trim()), 'travelmode=driving',
  ];
  if (pontos.length) parametros.push('waypoints=' + encodeURIComponent(pontos.join('|')));
  if (navegar) parametros.push('dir_action=navigate');
  const url = 'https://www.google.com/maps/dir/?' + parametros.join('&');
  if (url.length > 2048) throw new Error('Os endereços estão muito longos. Abrevie-os antes de abrir o mapa.');
  return url;
}
export function formatarDuracao(segundos: number): string {
  const total = Math.max(0, Math.round(segundos / 60));
  const horas = Math.floor(total / 60);
  return horas ? horas + 'h ' + total % 60 + 'min' : total + ' min';
}
// Polyline E5 reduz o documento Firestore, preservando a rota completa.
export function codificarRota(pontos: CoordenadaRota[]): string {
  let lat = 0, lon = 0, resultado = '';
  const codificar = (delta: number) => {
    let valor = delta < 0 ? ~(delta << 1) : delta << 1;
    let texto = '';
    while (valor >= 32) { texto += String.fromCharCode((32 | (valor & 31)) + 63); valor >>>= 5; }
    return texto + String.fromCharCode(valor + 63);
  };
  for (const ponto of pontos) {
    if (!coordenadaValida(ponto)) throw new Error('Coordenada inválida.');
    const novaLat = Math.round(ponto.latitude * 1e5), novaLon = Math.round(ponto.longitude * 1e5);
    resultado += codificar(novaLat - lat) + codificar(novaLon - lon);
    lat = novaLat; lon = novaLon;
  }
  if (resultado.length > 500000) throw new Error('Roteiro muito extenso para salvar. Divida a viagem em trechos.');
  return resultado;
}
export function decodificarRota(valor: unknown): CoordenadaRota[] {
  if (typeof valor !== 'string' || valor.length > 500000) return [];
  let index = 0, lat = 0, lon = 0;
  const pontos: CoordenadaRota[] = [];
  const ler = () => {
    let resultado = 0, shift = 0, parte: number;
    do {
      if (index >= valor.length || shift > 30) throw new Error('Polyline inválida.');
      parte = valor.charCodeAt(index++) - 63;
      if (parte < 0 || parte > 63) throw new Error('Polyline inválida.');
      resultado |= (parte & 31) << shift; shift += 5;
    } while (parte >= 32);
    return resultado & 1 ? ~(resultado >> 1) : resultado >> 1;
  };
  try {
    while (index < valor.length) {
      lat += ler(); lon += ler();
      const ponto = { latitude: lat / 1e5, longitude: lon / 1e5 };
      if (!coordenadaValida(ponto)) return [];
      pontos.push(ponto);
    }
    return pontos.length >= 2 ? pontos : [];
  } catch { return []; }
}
export function lerRotaSalva(viagem: any): CoordenadaRota[] {
  const pontos = decodificarRota(viagem?.rotaPolyline);
  if (pontos.length) return pontos;
  const legado = viagem?.routeCoords;
  return Array.isArray(legado) && legado.length >= 2 && legado.every(coordenadaValida) ? legado : [];
}
