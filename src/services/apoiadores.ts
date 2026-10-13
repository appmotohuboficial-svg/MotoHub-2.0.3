import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Apoiador, DadosApoiador, validarApoiador } from '../utils/apoiadores';

export async function buscarMeuApoiador(): Promise<Apoiador | null> {
  const user = auth.currentUser;
  if (!user) throw new Error('Entre na sua conta para acessar o cadastro.');
  const snapshot = await getDoc(doc(db, 'apoiadores', user.uid));
  if (auth.currentUser?.uid !== user.uid) throw new Error('Sua sessão mudou. Abra novamente o cadastro.');
  return snapshot.exists() ? { ...snapshot.data(), id: snapshot.id, estado: 'ativo' } as Apoiador : null;
}

export async function salvarMeuApoiador(dados: DadosApoiador): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Entre na sua conta para salvar.');
  const erro = validarApoiador(dados);
  if (erro) throw new Error(erro);
  const ref = doc(db, 'apoiadores', user.uid);
  await runTransaction(db, async transaction => {
    const anterior = await transaction.get(ref);
    const perfil = await transaction.get(doc(db, 'usuarios', user.uid));
    const fotoUrl = perfil.data()?.fotoUrl;
    if (auth.currentUser?.uid !== user.uid) throw new Error('Sua sessão mudou. Entre novamente.');
    transaction.set(ref, {
      nome: dados.nome.trim(), cidade: dados.cidade.trim(), uf: dados.uf,
      contato: dados.contato.trim(), descricao: dados.descricao.trim(), tipos: [...dados.tipos],
      ...(fotoUrl ? { fotoUrl } : {}),
      userId: user.uid,
      createdAt: anterior.exists() ? anterior.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

