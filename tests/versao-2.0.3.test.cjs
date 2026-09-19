const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(file, dependencies = {}, globals = {}) {
  const text = fs.readFileSync(path.join(__dirname, '../src', file + '.ts'), 'utf8');
  const code = ts.transpileModule(text, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
  const module = {exports:{}};
  new Function('require','module','exports',...Object.keys(globals),code)(id => {
    if (!(id in dependencies)) throw Error('Dependência não simulada: '+id);
    return dependencies[id];
  },module,module.exports,...Object.values(globals));
  return module.exports;
}
const cache = 'file:///private/app/cache/';
function temporaryFixture() {
  const files = new Map(), removed = [];
  const disk = {
    cacheDirectory:cache,
    getInfoAsync:async uri => files.get(uri) ?? {exists:false,isDirectory:false},
    readDirectoryAsync:async folder => [...files.keys()].filter(x=>x.startsWith(folder)).map(x=>x.slice(folder.length)),
    deleteAsync:async uri => {removed.push(uri);files.delete(uri)},
  };
  return {files,removed,disk,api:load('services/temporaryImages',{'expo-file-system/legacy':disk})};
}
const settle = () => new Promise(resolve=>setImmediate(resolve));
test('limpeza aceita apenas imagens privadas conhecidas e rejeita documentos, galeria, diretórios e travessia', async () => {
  const {api,files,removed} = temporaryFixture();
  const unsafe = [cache+'asset.png',cache+'ImagePicker/../session.json',cache+'ImagePicker/%2e%2e/x.jpg',cache+'ImagePicker/folder/x.jpg',cache+'ImagePicker/session.json','file:///storage/emulated/0/motohub-opening-22.png','file:///private/app/documents/moto.jpg','content://gallery/photo',cache+'ImagePicker/folder.jpg'];
  for(const uri of unsafe) files.set(uri,{exists:true,isDirectory:uri.endsWith('folder.jpg')});
  for(const uri of unsafe) await api.removeTemporaryImage(uri);
  assert.deepEqual(removed,[]);
  const allowed=cache+'ImageManipulator/uuid-1.jpg';
  files.set(allowed,{exists:true,isDirectory:false});
  await api.removeTemporaryImage(allowed);
  assert.deepEqual(removed,[allowed]);
});
test('sair da tela durante upload preserva imagem até finalizar; liberação dupla é inofensiva', async () => {
  const {api,files,removed}=temporaryFixture();
  const uri=cache+'ImagePicker/event.jpg';
  files.set(uri,{exists:true,isDirectory:false});
  const screen=api.retainTemporaryImage(uri), upload=api.retainTemporaryImage(uri);
  screen();screen();await api.removeTemporaryImage(uri);
  assert.deepEqual(removed,[]);
  upload();await settle();
  assert.deepEqual(removed,[uri]);
});
test('varredura remove somente temporários antigos e preserva ativos, recentes e datas desconhecidas',async()=>{
  const {api,files,removed}=temporaryFixture(),now=200000000;
  const add=(name,time)=>{const uri=cache+'ImagePicker/'+name;files.set(uri,{exists:true,isDirectory:false,modificationTime:time});return uri};
  const stale=add('old.jpg',1),active=add('active.jpg',1);
  add('new.jpg',now/1000);add('unknown.jpg',undefined);add('session.json',1);
  api.retainTemporaryImage(active);
  await api.cleanStaleTemporaryImages(now);
  assert.deepEqual(removed,[stale]);
});
test('erro de acesso a cache não interrompe o aplicativo', async()=>{
  const api=load('services/temporaryImages',{'expo-file-system/legacy':{cacheDirectory:cache,getInfoAsync:async()=>{throw Error('denied')},readDirectoryAsync:async()=>{throw Error('denied')}}});
  await api.removeTemporaryImage(cache+'ImagePicker/photo.jpg');
  await api.cleanStaleTemporaryImages();
});
test('upload libera blob e temporário no sucesso e na falha, preservando seleção para tentar novamente',async()=>{
  for(const fail of [false,true]) {
    const {api,files,removed}=temporaryFixture();
    const uri=cache+'ImagePicker/photo.jpg';files.set(uri,{exists:true,isDirectory:false});
    const releaseScreen=api.retainTemporaryImage(uri);
    let closed=0;
    const upload=load('services/imageUpload',{
      './firebase':{storage:{}},'./temporaryImages':api,
      'firebase/storage':{ref:()=>({}),uploadBytes:async()=>{if(fail)throw Error('offline')},getDownloadURL:async()=> 'https://example.test/image.jpg',deleteObject:async()=>{}},
    },{fetch:async()=>({ok:true,blob:async()=>({type:'image/jpeg',close:()=>closed++})})});
    if(fail)await assert.rejects(upload.uploadLocalImage(uri,'test/path'),/offline/);
    else assert.equal(await upload.uploadLocalImage(uri,'test/path'),'https://example.test/image.jpg');
    assert.equal(closed,1);assert.deepEqual(removed,[]);
    releaseScreen();await settle();assert.deepEqual(removed,[uri]);
  }
});
test('Firebase nativo usa AsyncStorage e mantém dados entre instâncias do adaptador real',async()=>{
  const sdk=require(path.join(path.dirname(require.resolve('@firebase/auth/package.json')),'dist/rn/index.js'));
  const values=new Map();
  const storage={getItem:async k=>values.get(k)??null,setItem:async(k,v)=>{values.set(k,v)},removeItem:async k=>{values.delete(k)}};
  let persistence, fallback=0, failure;
  const expected={id:'auth'};
  const auth=load('services/auth.native',{
    '@react-native-async-storage/async-storage':storage,
    'firebase/auth':{getReactNativePersistence:sdk.getReactNativePersistence,initializeAuth:(_app,deps)=>{if(failure)throw failure;persistence=deps.persistence;return expected},getAuth:()=>{fallback++;return expected}},
  });
  assert.equal(auth.initializePlatformAuth({}),expected);
  const first=new persistence();
  assert.equal(await first._isAvailable(),true);
  await first._set('session-test',{uid:'test-user'});
  const restarted=new persistence();
  assert.deepEqual(await restarted._get('session-test'),{uid:'test-user'});
  await restarted._remove('session-test');assert.equal(await first._get('session-test'),null);
  failure={code:'auth/already-initialized'};assert.equal(auth.initializePlatformAuth({}),expected);assert.equal(fallback,1);
  failure=Error('disk failure');assert.throws(()=>auth.initializePlatformAuth({}),/disk failure/);assert.equal(fallback,1);
});
