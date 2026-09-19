const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function carregar(nome, contexto = {}) {
  const arquivo = path.resolve(__dirname, '../src', nome + '.ts');
  const codigo = ts.transpileModule(fs.readFileSync(arquivo, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const modulo = { exports: {} };
  const nomes = Object.keys(contexto);
  new Function('require', 'module', 'exports', ...nomes, codigo)(
    (id) => carregar(path.posix.normalize(path.posix.join(path.posix.dirname(nome), id)), contexto),
    modulo, modulo.exports, ...Object.values(contexto));
  return modulo.exports;
}
const u = carregar('utils/roteiro');
test('região inicial inclui extremos de todo o roteiro e mantém zoom válido em pontos iguais', () => {
  const pontos = [{latitude:-25,longitude:-53},{latitude:-23,longitude:-54},{latitude:-27,longitude:-48}];
  const r = u.regiaoDaRota(pontos);
  for (const p of pontos) {
    assert.ok(Math.abs(p.latitude-r.latitude) < r.latitudeDelta/2);
    assert.ok(Math.abs(p.longitude-r.longitude) < r.longitudeDelta/2);
  }
  assert.equal(u.regiaoDaRota([pontos[0],pontos[0]]).latitudeDelta,0.02);
  assert.throws(() => u.regiaoDaRota([]));
  assert.throws(() => u.regiaoDaRota([pontos[0],{latitude:NaN,longitude:0}]));
});
test('passagens: normaliza e rejeita mais de três no link, sem descartar locais silenciosamente', () => {
  assert.deepEqual(u.normalizarPassagens([' Toledo - PR ', null, 4, ' ', 'Cascavel - PR']), ['Toledo - PR', 'Cascavel - PR']);
  assert.deepEqual(u.normalizarPassagens(undefined), []);
  assert.throws(() => u.criarUrlGoogleMaps('A', 'B', ['1', '2', '3', '4']), /três/);
});
test('link preserva ordem, acentos, origem e destino; navegação é explícita', () => {
  const url = new URL(u.criarUrlGoogleMaps(' Foz do Iguaçu - PR ', 'Curitiba - PR', ['Cascavel - PR', 'Guarapuava - PR'], true));
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('origin'), 'Foz do Iguaçu - PR');
  assert.equal(url.searchParams.get('destination'), 'Curitiba - PR');
  assert.equal(url.searchParams.get('waypoints'), 'Cascavel - PR|Guarapuava - PR');
  assert.equal(url.searchParams.get('dir_action'), 'navigate');
  assert.ok(!u.criarUrlGoogleMaps('A', 'B').includes('waypoints'));
  assert.throws(() => u.criarUrlGoogleMaps('', 'B'));
  assert.throws(() => u.criarUrlGoogleMaps('A'.repeat(2100), 'B'), /longos/);
});
test('formata o arredondamento de 60 minutos sem exibir 0h 60min', () => {
  assert.equal(u.formatarDuracao(3599), '1h 0min');
  assert.equal(u.formatarDuracao(7199), '2h 0min');
  assert.equal(u.formatarDuracao(31), '1 min');
});
test('polyline: vetor canônico, ida e volta, registros antigos e corrupção', () => {
  const pontos = [{latitude:38.5,longitude:-120.2},{latitude:40.7,longitude:-120.95},{latitude:43.252,longitude:-126.453}];
  const texto = '_p~iF~ps|U_ulLnnqC_mqNvxq' + String.fromCharCode(96) + '@';
  assert.equal(u.codificarRota(pontos), texto);
  assert.deepEqual(u.decodificarRota(texto), pontos);
  assert.deepEqual(u.lerRotaSalva({rotaPolyline:texto}), pontos);
  assert.deepEqual(u.lerRotaSalva({routeCoords:pontos}), pontos);
  assert.deepEqual(u.lerRotaSalva({routeCoords:[{latitude:NaN,longitude:0}]}), []);
  assert.deepEqual(u.decodificarRota('~~~~~'), []);
  assert.deepEqual(u.decodificarRota('??!'), []);
  assert.throws(() => u.codificarRota([{latitude:91,longitude:0}]));
});
function servico(mock) {
  let agora = 100000; const esperas = [];
  const api = carregar('services/rotas', {
    fetch: mock, Date: { now: () => agora }, AbortController,
    setTimeout: (fn, ms) => {
      if (ms === 15000) return {timeout:true};
      esperas.push(ms); agora += ms; queueMicrotask(fn); return {};
    },
    clearTimeout: () => {},
  });
  return { ...api, esperas };
}
test('serviço inclui passagens no OSRM na ordem correta e reutiliza geocodificação', async () => {
  const chamadas = [];
  const api = servico(async (url) => {
    chamadas.push(url);
    if (url.includes('nominatim')) {
      const q = new URL(url).searchParams.get('city');
      const n = q.startsWith('Origem') ? 1 : q.startsWith('Passagem') ? 2 : 3;
      return { ok:true, json:async () => [municipio(q, 'PR', -20-n, -40-n)] };
    }
    return {ok:true,json:async () => ({code:'Ok',routes:[{
      geometry:{coordinates:[[-41,-21],[-42,-22],[-43,-23]]},distance:123400,duration:3600,
    }]})};
  });
  const r = await api.tracarRota('Origem - PR', 'Destino - PR', ['Passagem PR']);
  assert.match(chamadas[3], /-41,-21;-42,-22;-43,-23/);
  assert.equal(r.distanciaKm,123.4);
  assert.equal(r.pontos.length,3);
  assert.deepEqual(api.esperas, [1100,1100]);
  await api.tracarRota('Origem - PR', 'Destino - PR', ['Passagem PR']);
  assert.equal(chamadas.filter((url) => url.includes('nominatim')).length,3);
});
test('serviço propaga cidade não encontrada, HTTP e geometria inválida', async () => {
  await assert.rejects(servico(async () => ({ok:true,json:async()=>[]})).tracarRota('A - PR','B - PR'), /não encontrada/);
  await assert.rejects(servico(async () => ({ok:false})).tracarRota('A - PR','B - PR'), /indisponível/);
  const api = servico(async (url) => url.includes('nominatim')
    ? {ok:true,json:async()=>[municipio(new URL(url).searchParams.get('city'))]}
    : {ok:true,json:async()=>({code:'NoRoute'})});
  await assert.rejects(api.tracarRota('A - PR','B - PR'), /Não foi possível/);
});
test('fila recupera após erro; timeout não deixa spinner sem fim', async () => {
  const api = servico(async () => { const e = new Error('timeout'); e.name='AbortError'; throw e; });
  await assert.rejects(api.tracarRota('A - PR','B - PR'), /demorou/);
  await assert.rejects(api.tracarRota('C - PR','D - PR'), /demorou/);
});
test('versão, assets PNG e perfis mantêm IDs remotos de build', () => {
  const root = path.resolve(__dirname, '..');
  const app = require('../app.json').expo;
  assert.equal(app.version,'2.0.3');
  assert.equal(require('../package.json').version,'2.0.3');
  assert.equal(require('../package-lock.json').version,'2.0.3');
  assert.equal(require('../package-lock.json').packages[''].version,'2.0.3');
  assert.equal(require('../eas.json').cli.appVersionSource,'remote');
  assert.equal(require('../eas.json').build.preview.android.buildType,'apk');
  assert.ok(!('versionCode' in app.android));
  for (const p of [app.icon, app.android.adaptiveIcon.foregroundImage]) {
    const b = fs.readFileSync(path.join(root,p));
    assert.equal(b.subarray(1,4).toString(),'PNG');
    assert.equal(b.readUInt32BE(16),1024); assert.equal(b.readUInt32BE(20),1024);
  }
});
test('configuração distingue build com e sem Maps sem expor chave em extra', () => {
  const configFn = require('../app.config.js'), app = require('../app.json').expo;
  const anterior = process.env.GOOGLE_MAPS_API_KEY;
  try {
    delete process.env.GOOGLE_MAPS_API_KEY;
    assert.equal(configFn({config:app}).extra.androidMapsConfigured,false);
    process.env.GOOGLE_MAPS_API_KEY='test-only-not-a-key';
    const c = configFn({config:app});
    assert.equal(c.extra.androidMapsConfigured,true);
    assert.equal(c.plugins.filter(p=>Array.isArray(p)&&p[0]==='react-native-maps').length,1);
    assert.ok(!JSON.stringify(c.extra).includes('test-only-not-a-key'));
    assert.equal(c.extra.eas.projectId,app.extra.eas.projectId);
  } finally { if (anterior === undefined) delete process.env.GOOGLE_MAPS_API_KEY; else process.env.GOOGLE_MAPS_API_KEY=anterior; }
});
test('fluxo persiste traçado e passagens; mapa ocupa painel próprio com modal e retorno Android', () => {
  const resumo=fs.readFileSync(path.join(__dirname,'../src/screens/ResumoRoteiro.tsx'),'utf8');
  const mapa=fs.readFileSync(path.join(__dirname,'../src/components/MapaRoteiro.tsx'),'utf8');
  assert.match(resumo,/rotaPolyline: codificarRota/);
  assert.match(resumo,/passagens,/);
  assert.match(resumo,/if \(!podeSalvar \|\| trava.current/);
  assert.match(mapa,/onRequestClose=/);
  assert.match(mapa,/onMapReady=/);
  assert.ok(!mapa.includes('gradientOverlay'));
});

function municipio(nome, uf = 'PR', lat = -25, lon = -49) {
  return {name:nome,addresstype:'municipality',lat:String(lat),lon:String(lon),
    address:{municipality:nome,country_code:'br','ISO3166-2-lvl4':'BR-'+uf}};
}
const geo = carregar('utils/municipio');
test('busca separa cidade e UF, preserva nome composto e rejeita UF inválida', () => {
  for (const entrada of ['Penha - SC','Penha SC','Penha, SC','Penha/SC']) {
    const url = new URL(geo.criarConsultaMunicipio(geo.identificarMunicipio(entrada)));
    assert.equal(url.searchParams.get('city'),'Penha');
    assert.equal(url.searchParams.get('state'),'Santa Catarina');
    assert.equal(url.searchParams.get('featureType'),'city');
    assert.equal(url.searchParams.get('q'),null);
  }
  assert.equal(geo.identificarMunicipio('São Tomé das Letras - MG').cidade,'São Tomé das Letras');
  assert.equal(geo.identificarMunicipio('Entre-Ijuís - RS').cidade,'Entre-Ijuís');
  assert.throws(()=>geo.identificarMunicipio('Penha'),/UF válida/);
  assert.throws(()=>geo.identificarMunicipio('Penha - XX'),/UF válida/);
});
test('Penha rejeita rua do bairro em Lages, estado e homônimo de outra UF', () => {
  const local=geo.identificarMunicipio('Penha - SC');
  const errados=[
    {name:'Rua Vital Brasil',addresstype:'road',lat:'-27.8109331',lon:'-50.2862769',
      address:{suburb:'Penha',city:'Lages',country_code:'br','ISO3166-2-lvl4':'BR-SC'}},
    {...municipio('Penha','SC'),addresstype:'suburb',address:{city:'Lages',country_code:'br','ISO3166-2-lvl4':'BR-SC'}},
    {...municipio('Santa Catarina','SC'),addresstype:'state'},
    municipio('Penha','RS'),municipio('Lages','SC')
  ];
  for(const item of errados) assert.throws(()=>geo.selecionarMunicipio([item],local),/não encontrada/);
  assert.deepEqual(geo.selecionarMunicipio([...errados,municipio('Penha','SC',-26.775418,-48.6465251)],local),
    {latitude:-26.775418,longitude:-48.6465251});
});
test('valida município com acentos, UF pelo nome e coordenadas inválidas', () => {
  const local=geo.identificarMunicipio('Sao Tome das Letras - MG');
  const item=municipio('São Tomé das Letras','MG');
  delete item.address['ISO3166-2-lvl4']; item.address.state='Minas Gerais';
  assert.deepEqual(geo.selecionarMunicipio([item],local),{latitude:-25,longitude:-49});
  for(const valor of [null,'', 'NaN','-100']) {
    assert.throws(()=>geo.selecionarMunicipio([{...item,lat:valor}],local),/não encontrada/);
  }
});
test('resposta errada não chama OSRM nem entra no cache; nova tentativa aceita Penha correta', async () => {
  let corrigido=false;let consultas=0;let roteamentos=0;
  const api=servico(async url=>{
    if(url.includes('nominatim')) {
      consultas++;
      return {ok:true,json:async()=>[municipio(corrigido?'Penha':'Lages','SC',-26.775418,-48.6465251)]};
    }
    roteamentos++;
    assert.match(url,/-48.6465251,-26.775418;-48.6465251,-26.775418/);
    return {ok:true,json:async()=>({code:'Ok',routes:[{geometry:{coordinates:[[-48.6465251,-26.775418],[-48.6465251,-26.775418]]},distance:0,duration:0}]})};
  });
  await assert.rejects(api.tracarRota('Penha - SC','Penha - SC'),/não encontrada/);
  assert.equal(roteamentos,0);
  corrigido=true;
  await api.tracarRota('Penha - SC','penha SC');
  assert.equal(consultas,2);assert.equal(roteamentos,1);
});
