const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function fixture({ platform = 'android', environment = 'bare', fail = false } = {}) {
  const events = [];
  let nativeLoads = 0;
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/services/analytics.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  const load = id => {
    if (id === 'react-native') return { Platform: { OS: platform } };
    if (id === 'expo-constants') return { default: { executionEnvironment: environment }, ExecutionEnvironment: { StoreClient: 'storeClient' }, __esModule: true };
    if (id === '@react-native-firebase/analytics') {
      nativeLoads++;
      if (fail) throw new Error('native module unavailable');
      return { getAnalytics: () => 'native', logScreenView: async (instance, params) => events.push({ instance, params }) };
    }
    throw new Error(`Unexpected dependency: ${id}`);
  };
  new Function('require', 'module', 'exports', '__DEV__', code)(load, mod, mod.exports, false);
  return { api: mod.exports, events, nativeLoads: () => nativeLoads };
}

test('Android envia apenas nome e classe da tela', async () => {
  const f = fixture(); await f.api.registrarTelaAnalytics('Garagem');
  assert.deepEqual(f.events, [{ instance: 'native', params: { screen_name: 'Garagem', screen_class: 'Garagem' } }]);
});
test('Expo Go não carrega o módulo nativo', async () => {
  const f = fixture({ environment: 'storeClient' }); await f.api.registrarTelaAnalytics('Garagem');
  assert.equal(f.nativeLoads(), 0); assert.equal(f.events.length, 0);
});
test('web e iOS não configurado não carregam Analytics', async () => {
  for (const platform of ['web', 'ios']) {
    const f = fixture({ platform }); await f.api.registrarTelaAnalytics('Garagem'); assert.equal(f.nativeLoads(), 0);
  }
});
test('falha nativa não interrompe o aplicativo', async () => {
  const f = fixture({ fail: true }); await assert.doesNotReject(f.api.registrarTelaAnalytics('Garagem'));
  assert.equal(f.events.length, 0);
});
test('nome vazio ou acima do limite não envia evento', async () => {
  const f = fixture(); await f.api.registrarTelaAnalytics(''); await f.api.registrarTelaAnalytics('a'.repeat(101));
  assert.equal(f.nativeLoads(), 0);
});
