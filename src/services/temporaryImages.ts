import * as FileSystem from 'expo-file-system/legacy';

const directories = ['ImagePicker', 'ImageManipulator'];
const inUse = new Map<string, number>();
const maxAgeSeconds = 24 * 60 * 60;

export function isTemporaryImage(uri: string): boolean {
  const cache = FileSystem.cacheDirectory;
  if (!cache || !uri.startsWith(cache)) return false;
  // Somente arquivos de imagem diretamente nas duas pastas privadas conhecidas.
  // Não aceita travessia de diretório, documentos, galeria ou armazenamento público.
  return /^(ImagePicker|ImageManipulator)[/][a-zA-Z0-9_-][a-zA-Z0-9_.-]*[.](jpg|jpeg|png|webp|heic|heif|gif|avif|bmp)$/i
    .test(uri.slice(cache.length));
}

export async function removeTemporaryImage(uri: string): Promise<void> {
  if (!isTemporaryImage(uri) || inUse.has(uri)) return;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && !info.isDirectory && !inUse.has(uri)) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch {
    // Falha de limpeza não descarta a seleção nem interrompe cadastro/upload.
  }
}

export function retainTemporaryImage(uri: string): () => void {
  if (!isTemporaryImage(uri)) return () => {};
  inUse.set(uri, (inUse.get(uri) ?? 0) + 1);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const count = (inUse.get(uri) ?? 1) - 1;
    if (count > 0) inUse.set(uri, count);
    else {
      inUse.delete(uri);
      void removeTemporaryImage(uri);
    }
  };
}

export async function cleanStaleTemporaryImages(now = Date.now()): Promise<void> {
  const cache = FileSystem.cacheDirectory;
  if (!cache) return;
  for (const directory of directories) {
    const folder = cache + directory + '/';
    try {
      const names = await FileSystem.readDirectoryAsync(folder);
      for (const name of names) {
        const uri = folder + name;
        if (!isTemporaryImage(uri) || inUse.has(uri)) continue;
        const info = await FileSystem.getInfoAsync(uri);
        if (info.exists && !info.isDirectory && Number.isFinite(info.modificationTime)
          && info.modificationTime < now / 1000 - maxAgeSeconds) {
          await removeTemporaryImage(uri);
        }
      }
    } catch {
      // A pasta pode não existir; o sistema também pode ter removido o cache.
    }
  }
}

