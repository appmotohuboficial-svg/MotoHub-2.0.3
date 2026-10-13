import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db, storage } from './firebase';
import { listAll, ref, deleteObject } from 'firebase/storage';

async function deleteOwnedCollection(collectionName: string, userId: string) {
  const snapshot = await getDocs(
    query(collection(db, collectionName), where('userId', '==', userId)),
  );
  await Promise.all(snapshot.docs.map((item) => deleteDoc(item.ref)));
}

export async function deleteAccountData(userId: string) {
  const motos = await getDocs(
    query(collection(db, 'motos'), where('userId', '==', userId)),
  );

  for (const moto of motos.docs) {
    const manutencoes = await getDocs(collection(db, 'motos', moto.id, 'manutencoes'));
    await Promise.all(manutencoes.docs.map((item) => deleteDoc(item.ref)));
    await deleteDoc(moto.ref);
  }

  await Promise.all([
    deleteOwnedCollection('abastecimentos', userId),
    deleteOwnedCollection('viagens', userId),
    deleteOwnedCollection('eventos', userId),
  ]);
  await deleteDoc(doc(db, 'apoiadores', userId));
  await deleteDoc(doc(db, 'participacoesApoiadores', userId));
  const fotos = await listAll(ref(storage, 'usuarios/' + userId + '/perfil'));
  await Promise.all(fotos.items.map(item => deleteObject(item)));
  await deleteDoc(doc(db, 'usuarios', userId));
}

