const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(relative, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../src', relative + '.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const mod = { exports: {} };
  new Function('require','module','exports', code)(id => { if (!(id in dependencies)) throw Error(id); return dependencies[id]; }, mod, mod.exports);
  return mod.exports;
}
const utils = load('utils/apoiadores');
const valid = { nome: 'Piloto', cidade: 'Cascavel', uf: 'PR', contato: '(045) 999-669-251', descricao: 'Combine antes de chegar.', tipos: ['Garagem', 'Ferramentas'] };
test('cadastro aceita vários apoios; rejeita contato inválido, campos grandes, UF e tipos desconhecidos', () => {
  assert.equal(utils.validarApoiador(valid), null);
  assert.equal(utils.validarApoiador({ ...valid, contato: 'pessoa@example.com' }), null);
  for (const change of [{ nome: ' ' }, { cidade: 'x'.repeat(81) }, { uf: 'XX' }, { tipos: [] }, { tipos: ['Garagem','Garagem'] }, { tipos: ['Moto Peças'] }, { descricao: 'x'.repeat(1001) }, { contato: '123' }, { contato: 'qualquer texto 45999669251' }]) assert.ok(utils.validarApoiador({ ...valid, ...change }));
});
test('busca combina nome, cidade/UF e tipo, ignora acentos e diferencia ausência de resultados', () => {
  const lista = [{ ...valid, id: '1', userId: '1', nome: 'Pajé' }, { ...valid, id: '2', userId: '2', nome: 'Ana', cidade: 'Foz do Iguaçu', tipos: ['Banho'] }];
  assert.deepEqual(utils.filtrarApoiadores(lista, 'PAJE CASCAVEL PR', 'Garagem').map(x => x.id), ['1']);
  assert.deepEqual(utils.filtrarApoiadores(lista, 'iguacu', 'Banho').map(x => x.id), ['2']);
  assert.equal(utils.filtrarApoiadores(lista, 'Cascavel', 'Banho').length, 0);
  assert.equal(utils.filtrarApoiadores(lista, '', 'Todos').length, 2);
});
test('telefone de exibição vira contato internacional sem o zero decorativo; e-mail é codificado', () => {
  assert.equal(utils.linksContato(valid.contato).whatsapp, 'https://wa.me/5545999669251');
  assert.equal(utils.linksContato('+55 45 99966-9251').telefone, 'tel:+5545999669251');
  assert.equal(utils.linksContato('ana+apoio@example.com').email, 'mailto:ana%2Bapoio%40example.com');
  assert.deepEqual(utils.linksContato('não é telefone'), {});
});
function fixture() {
  const auth = { currentUser: { uid: 'eu' } }, db = {}, docs = new Map(), writes = [];
  const ref = (_db, collection, id) => ({ key: collection + '/' + id, id });
  const snap = key => ({ id: key.split('/')[1], exists: () => docs.has(key), data: () => docs.get(key) });
  const sdk = { doc: ref, getDoc: async ref => snap(ref.key), serverTimestamp: () => 'SERVER', runTransaction: async (_db, callback) => callback({ get: async ref => snap(ref.key), delete: ref => docs.delete(ref.key), set: (ref, data) => { writes.push({ ref, data }); docs.set(ref.key, data); } }) };
  return { auth, docs, writes, service: load('services/apoiadores', { 'firebase/firestore': sdk, './firebase': { auth, db }, '../utils/apoiadores': utils }) };
}
test('criar e editar usa o mesmo documento do titular e preserva criação e apenas campos permitidos', async () => {
  const f = fixture();
  await f.service.salvarMeuApoiador({ ...valid, userId: 'outro', role: 'admin' });
  assert.equal(f.writes[0].ref.key, 'apoiadores/eu');
  assert.equal(f.writes[0].data.userId, 'eu');
  assert.ok(!('role' in f.writes[0].data));
  f.docs.get('apoiadores/eu').createdAt = 'original';
  await f.service.salvarMeuApoiador({ ...valid, descricao: 'Atualizado' });
  assert.equal(f.docs.size, 1);
  assert.equal(f.writes[1].data.createdAt, 'original');
  assert.equal((await f.service.buscarMeuApoiador()).descricao, 'Atualizado');
});
test('sem login ou dados inválidos não há gravação nem falso sucesso', async () => {
  const f = fixture();
  await assert.rejects(f.service.salvarMeuApoiador({ ...valid, tipos: [] }));
  f.auth.currentUser = null;
  await assert.rejects(f.service.salvarMeuApoiador(valid));
  await assert.rejects(f.service.buscarMeuApoiador());
  assert.equal(f.writes.length, 0);
});

test('carregar, criar e editar não acessa a coleção privada da regressão', async () => {
  const auth = { currentUser: { uid: 'eu' } }, docs = new Map(), reads = [];
  const snapshot = ref => ({ id: ref.id, exists: () => docs.has(ref.key), data: () => docs.get(ref.key) });
  const read = async ref => { reads.push(ref.key); if (ref.key.startsWith('participacoesApoiadores/')) throw Error('permission-denied'); return snapshot(ref); };
  const sdk = { doc: (_db, collection, id) => ({ key: collection + '/' + id, id }), getDoc: read, serverTimestamp: () => 'SERVER', runTransaction: async (_db, callback) => callback({ get: read, set: (ref, data) => docs.set(ref.key, data) }) };
  const service = load('services/apoiadores', { 'firebase/firestore': sdk, './firebase': { auth, db: {} }, '../utils/apoiadores': utils });
  assert.equal(await service.buscarMeuApoiador(), null);
  await service.salvarMeuApoiador(valid);
  docs.get('apoiadores/eu').createdAt = 'original';
  assert.equal((await service.buscarMeuApoiador()).nome, valid.nome);
  await service.salvarMeuApoiador({ ...valid, descricao: 'Alteração' });
  assert.equal((await service.buscarMeuApoiador()).descricao, 'Alteração');
  assert.equal(docs.get('apoiadores/eu').createdAt, 'original');
  assert.ok(reads.every(key => !key.startsWith('participacoesApoiadores/')));
});
