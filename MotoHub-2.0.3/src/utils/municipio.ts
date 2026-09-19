import { CoordenadaRota, coordenadaValida } from './roteiro';

const ESTADOS: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão',
  MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará',
  PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima',
  SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};
const normalizar = (valor: string) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR').replace(/[’']/g, '').replace(/\s+/g, ' ').trim();

export function identificarMunicipio(texto: string) {
  // Aceita o formato da tela e pontos intermediários como "Guarapuava PR".
  const partes = texto.trim().match(/^(.+?)(?:\s*[-–—,/]\s*|\s+)([a-z]{2})$/i);
  const cidade = partes?.[1]?.trim();
  const uf = partes?.[2]?.toUpperCase();
  if (!cidade || !uf || !ESTADOS[uf]) {
    throw new Error('Informe a cidade e uma UF válida, por exemplo: Penha - SC. Local: ' + texto);
  }
  return { cidade, uf, estado: ESTADOS[uf], chave: normalizar(cidade) + '|' + uf };
}

export function criarConsultaMunicipio(local: ReturnType<typeof identificarMunicipio>) {
  return 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=br'
    + '&featureType=city&addressdetails=1&accept-language=pt-BR'
    + '&city=' + encodeURIComponent(local.cidade) + '&state=' + encodeURIComponent(local.estado);
}

export function selecionarMunicipio(dados: unknown, local: ReturnType<typeof identificarMunicipio>): CoordenadaRota {
  if (Array.isArray(dados)) {
    for (const item of dados) {
      const endereco = item?.address;
      if (!endereco || endereco.country_code !== 'br') continue;
      if (!['city', 'town', 'village', 'municipality'].includes(item.addresstype)) continue;
      const municipio = endereco.city ?? endereco.town ?? endereco.village ?? endereco.municipality;
      if (typeof municipio !== 'string' || normalizar(municipio) !== normalizar(local.cidade)) continue;
      if (typeof item.name !== 'string' || normalizar(item.name) !== normalizar(local.cidade)) continue;
      const uf = endereco['ISO3166-2-lvl4'];
      if (uf ? uf !== 'BR-' + local.uf
        : typeof endereco.state !== 'string' || normalizar(endereco.state) !== normalizar(local.estado)) continue;
      if (typeof item.lat !== 'string' && typeof item.lat !== 'number') continue;
      if (typeof item.lon !== 'string' && typeof item.lon !== 'number') continue;
      if (String(item.lat).trim() === '' || String(item.lon).trim() === '') continue;
      const ponto = { latitude: Number(item.lat), longitude: Number(item.lon) };
      if (coordenadaValida(ponto)) return ponto;
    }
  }
  throw new Error('Cidade não encontrada com segurança: ' + local.cidade + ' - ' + local.uf
    + '. Confira o nome do município e a UF.');
}
