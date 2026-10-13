import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { deleteUploadedImage } from './imageUpload';
import { File } from 'expo-file-system';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';
import * as Crypto from 'expo-crypto';

async function lerBlobNativo(uri: string): Promise<Blob & { close?: () => void }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.timeout = 15000;
    xhr.onload = () => xhr.response ? resolve(xhr.response) : reject(Object.assign(new Error('Imagem não pôde ser lida.'), { code: 'foto/leitura' }));
    xhr.onerror = () => reject(Object.assign(new Error('Imagem não pôde ser lida.'), { code: 'foto/leitura' }));
    xhr.ontimeout = () => reject(Object.assign(new Error('Leitura expirou.'), { code: 'foto/leitura-timeout' }));
    xhr.open('GET', uri, true);
    xhr.send();
  });
}

export async function salvarFotoPerfil(uri: string): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Entre na sua conta para salvar a foto.');
  const remotePath = 'usuarios/' + uid + '/perfil/' + Crypto.randomUUID() + '.jpg';
  let etapa = 'leitura da foto JPEG';
  let blob: (Blob & { close?: () => void }) | undefined;
  let committed = false;
  let previousPath: string | undefined;
  try {
    const file = new File(uri);
    if (!file.exists || file.size === 0) throw Object.assign(new Error('Arquivo vazio ou ausente.'), { code: 'foto/arquivo-ausente' });
    if (file.size > 2 * 1024 * 1024) throw Object.assign(new Error('A foto deve ter até 2 MB após o recorte.'), { code: 'foto/tamanho-excedido' });
    const bytes = await file.bytes();
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw Object.assign(new Error('Arquivo não é JPEG.'), { code: 'foto/formato-invalido' });
    blob = await lerBlobNativo(uri);
    etapa = 'envio ao armazenamento';
    const imageRef = ref(storage, remotePath);
    await uploadBytes(imageRef, blob, { contentType: 'image/jpeg' });
    etapa = 'obtenção do endereço da foto';
    const fotoUrl = await getDownloadURL(imageRef);
    etapa = 'atualização do perfil e apoiador';
    await runTransaction(db, async transaction => {
      if (auth.currentUser?.uid !== uid) throw new Error('Sua sessão mudou. Entre novamente.');
      const perfilRef = doc(db, 'usuarios', uid);
      const apoioRef = doc(db, 'apoiadores', uid);
      const privadoRef = doc(db, 'participacoesApoiadores', uid);
      const [perfil, apoio, privado] = await Promise.all([transaction.get(perfilRef), transaction.get(apoioRef), transaction.get(privadoRef)]);
      if (!perfil.exists()) throw new Error('Não foi possível encontrar seu perfil.');
      previousPath = perfil.data().fotoPath;
      transaction.update(perfilRef, { fotoUrl, fotoPath: remotePath, updatedAt: serverTimestamp() });
      if (apoio.exists()) transaction.update(apoioRef, { fotoUrl, updatedAt: serverTimestamp() });
      if (privado.exists()) transaction.update(privadoRef, { fotoUrl, updatedAt: serverTimestamp() });
    });
    committed = true;
    if (previousPath?.startsWith('usuarios/' + uid + '/perfil/')) await deleteUploadedImage(previousPath).catch(() => {});
    return fotoUrl;
  } catch (error: any) {
    const message = String(error?.message || 'Não foi possível salvar a foto.').replace(/https?:\/\/[^\s]+/g, '[endereço omitido]').slice(0, 250);
    const failure = new Error(message) as Error & { code: string; etapa: string };
    failure.code = error?.code || 'foto/falha';
    failure.etapa = etapa;
    throw failure;
  } finally {
    try { blob?.close?.(); } catch {}
    if (!committed) await deleteUploadedImage(remotePath).catch(() => {});
  }
}

