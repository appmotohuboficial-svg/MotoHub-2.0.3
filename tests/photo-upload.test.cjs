const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
function fixture({size=100,bytes=new Uint8Array([255,216,255]),exists=true,fail=false,privado=false}={}) {
  const uploads=[],writes=[],deletes=[];
  const deps={
    'firebase/firestore':{doc:(_db,c,id)=>({c,id}),serverTimestamp:()=> 'SERVER',runTransaction:async(_db,cb)=>cb({get:async ref=>({exists:()=> ref.c === 'participacoesApoiadores' ? privado : ref.c === 'apoiadores' ? !privado : true,data:()=>({})}),update:(ref,data)=>writes.push({ref,data})})},
    './firebase':{auth:{currentUser:{uid:'owner'}},db:{},storage:{}},
    './imageUpload':{deleteUploadedImage:async p=>deletes.push(p)},
    'expo-crypto':{randomUUID:()=> 'uuid'},
    'expo-file-system':{File:class {exists=exists;size=size;async bytes(){return bytes;}}},
    'firebase/storage':{ref:(_s,p)=>p,uploadBytes:async(ref,data,meta)=>{uploads.push({ref,data,meta});if(fail)throw Object.assign(Error('denied'),{code:'storage/unauthorized'});},getDownloadURL:async()=> 'https://example.test/photo.jpg'}
  };
  const code=ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname,'../src/services/fotoPerfil.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const mod={exports:{}};class XHR { response={type:'image/jpeg',size:100,close(){}}; open(){} send(){this.onload();} }
  new Function('require','module','exports','XMLHttpRequest',code)(id=>deps[id],mod,mod.exports,XHR);
  return {api:mod.exports,uploads,writes,deletes};
}
test('foto envia Blob JPEG nativo e atualiza perfil e apoiador na mesma transação',async()=>{
 const f=fixture();await f.api.salvarFotoPerfil('file:///foto.jpg');assert.equal(f.uploads.length,1);assert.equal(f.uploads[0].data.type,'image/jpeg');assert.equal(f.uploads[0].meta.contentType,'image/jpeg');assert.equal(f.writes.length,2);assert.equal(f.deletes.length,0);
});
test('foto rejeita arquivo ausente, grande e formato errado antes de enviar',async()=>{
 for(const options of [{exists:false},{size:2097153},{bytes:new Uint8Array([1,2])}]){const f=fixture(options);await assert.rejects(f.api.salvarFotoPerfil('file:///foto.jpg'));assert.equal(f.uploads.length,0);assert.equal(f.writes.length,0);}
});
test('falha no upload mantém documentos e preserva código de permissão',async()=>{
 const f=fixture({fail:true});await assert.rejects(f.api.salvarFotoPerfil('file:///foto.jpg'),e=>e.code==='storage/unauthorized'&&e.etapa==='envio ao armazenamento');assert.equal(f.writes.length,0);
});

test('foto atualiza cadastro privado sem recriar perfil público', async () => {
 const f=fixture({privado:true});
 await f.api.salvarFotoPerfil('file:///foto.jpg');
 assert.deepEqual(f.writes.map(w=>w.ref.c), ['usuarios','participacoesApoiadores']);
 assert.equal(f.writes[1].data.fotoUrl,'https://example.test/photo.jpg');
});
