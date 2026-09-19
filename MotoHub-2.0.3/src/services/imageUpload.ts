import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';
import { retainTemporaryImage } from './temporaryImages';

export async function uploadLocalImage(
  localUri: string,
  remotePath: string,
): Promise<string> {
  const release = retainTemporaryImage(localUri);
  let blob: (Blob & { close?: () => void }) | undefined;
  try {
    const response = await fetch(localUri);
    if (!response.ok) throw new Error('Não foi possível ler a imagem selecionada.');
    blob = await response.blob();
    const imageRef = ref(storage, remotePath);
    await uploadBytes(imageRef, blob, { contentType: blob.type || 'image/jpeg' });
    return await getDownloadURL(imageRef);
  } finally {
    try { blob?.close?.(); } finally { release(); }
  }
}

export async function deleteUploadedImage(remotePath: string): Promise<void> {
  if (!remotePath) return;
  await deleteObject(ref(storage, remotePath));
}
