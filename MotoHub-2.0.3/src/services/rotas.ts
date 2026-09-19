import { identificarMunicipio, criarConsultaMunicipio, selecionarMunicipio } from '../utils/municipio';
import { CoordenadaRota, coordenadaValida, normalizarPassagens, MAX_PASSAGENS } from '../utils/roteiro';
export { CoordenadaRota, formatarDuracao } from '../utils/roteiro';

export interface ResultadoRota {
  coordenadas: CoordenadaRota[];
  pontos: CoordenadaRota[];
  distanciaKm: number;
  duracaoSegundos: number;
}
const cache = new Map<string, CoordenadaRota>();
let fila: Promise<unknown> = Promise.resolve();
let ultimaConsulta = 0;
async function obterJson(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const resposta = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'MotoHub/2.0.3 (Fotos e Moto)' },
    });
    if (!resposta.ok) throw new Error('Serviço de mapas indisponível. Tente novamente mais tarde.');
    return await resposta.json();
  } catch (erro: any) {
    if (erro?.name === 'AbortError') throw new Error('O serviço de mapas demorou para responder. Tente novamente.');
    throw erro;
  } finally { clearTimeout(timer); }
}
function geocodificar(endereco: string): Promise<CoordenadaRota> {
  const local = identificarMunicipio(endereco);
  const chave = local.chave;
  const executar = async () => {
    const salvo = cache.get(chave);
    if (salvo) return salvo;
    // Serializa também chamadas de telas distintas nesta instância do aplicativo.
    // Produção multiusuário requer limite global/proxy; ver docs/VERSAO_2.0.2.md.
    const espera = Math.max(0, 1100 - (Date.now() - ultimaConsulta));
    if (espera) await new Promise((resolve) => setTimeout(resolve, espera));
    ultimaConsulta = Date.now();
    const dados = await obterJson(criarConsultaMunicipio(local));
    const ponto = selecionarMunicipio(dados, local);
    if (cache.size >= 200) cache.clear();
    cache.set(chave, ponto);
    return ponto;
  };
  const resultado = fila.then(executar);
  fila = resultado.catch(() => undefined);
  return resultado;
}
export async function tracarRota(origem: string, destino: string, passagens: unknown = []): Promise<ResultadoRota> {
  if (!origem?.trim() || !destino?.trim()) throw new Error('Informe origem e destino.');
  const intermediarios = normalizarPassagens(passagens);
  if (intermediarios.length > MAX_PASSAGENS) throw new Error('Informe no máximo três passagens.');
  const pontos: CoordenadaRota[] = [];
  for (const endereco of [origem, ...intermediarios, destino]) pontos.push(await geocodificar(endereco));
  const caminho = pontos.map((ponto) => ponto.longitude + ',' + ponto.latitude).join(';');
  const dados = await obterJson('https://router.project-osrm.org/route/v1/driving/' + caminho + '?overview=full&geometries=geojson');
  const rota = dados?.routes?.[0];
  if (dados?.code !== 'Ok' || !Array.isArray(rota?.geometry?.coordinates) || rota.geometry.coordinates.length < 2
    || !Number.isFinite(rota.distance) || rota.distance < 0 || !Number.isFinite(rota.duration) || rota.duration < 0) {
    throw new Error('Não foi possível calcular o roteiro com esses locais.');
  }
  const coordenadas = rota.geometry.coordinates.map((p: any) => ({ latitude: p?.[1], longitude: p?.[0] }));
  if (!coordenadas.every(coordenadaValida)) throw new Error('O serviço retornou uma rota inválida.');
  return { coordenadas, pontos, distanciaKm: rota.distance / 1000, duracaoSegundos: rota.duration };
}
