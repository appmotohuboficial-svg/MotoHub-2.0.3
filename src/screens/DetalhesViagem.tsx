import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { tracarRota } from '../services/rotas';
import { CoordenadaRota, criarUrlGoogleMaps, lerRotaSalva, normalizarPassagens, normalizarPontosIntermediarios } from '../utils/roteiro';
import { MapaRoteiro } from '../components/MapaRoteiro';

export function DetalhesViagem({ route, navigation }: any) {
  const viagem = route?.params?.viagem || {};
  const [coordenadas, setCoordenadas] = useState<CoordenadaRota[]>([]);
  const [pontos, setPontos] = useState<CoordenadaRota[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const excluindo = useRef(false);
  const pontosChave = JSON.stringify(normalizarPontosIntermediarios(viagem.pontosIntermediarios, viagem.passagens));
  const pontosIntermediarios = useMemo(() => normalizarPontosIntermediarios(JSON.parse(pontosChave)), [pontosChave]);
  const passagens: string[] = useMemo(() => normalizarPassagens(pontosIntermediarios), [pontosChave]);
  const passagensChave = JSON.stringify(passagens);
  const isCriador = !!auth.currentUser && viagem.userId === auth.currentUser.uid;
  useEffect(() => {
    let ativo = true;
    const salvas = lerRotaSalva(viagem);
    setCoordenadas(salvas); setPontos(Array.isArray(viagem.pontosRota) ? viagem.pontosRota : []);
    setErro(''); setCarregando(!salvas.length);
    if (salvas.length) return;
    tracarRota(viagem.origem, viagem.destino, passagens).then((resultado) => {
      if (ativo) { setCoordenadas(resultado.coordenadas); setPontos(resultado.pontos); }
    }).catch((error) => { if (ativo) setErro(error?.message || 'Não foi possível carregar a rota.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [viagem.id, viagem.origem, viagem.destino, viagem.rotaPolyline, viagem.routeCoords, passagensChave, tentativa]);

  const handleExcluir = () => {
    if (!isCriador || !viagem.id) return;
    Alert.alert('Excluir Roteiro', 'Tem certeza que deseja apagar esta viagem?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        if (excluindo.current || auth.currentUser?.uid !== viagem.userId) return;
        excluindo.current = true;
        try { await deleteDoc(doc(db, 'viagens', viagem.id)); navigation.goBack(); }
        catch (error: any) { Alert.alert('Erro ao excluir', error?.message || 'Tente novamente.'); }
        finally { excluindo.current = false; }
      } },
    ]);
  };
  const handleIniciar = async () => {
    try { await Linking.openURL(criarUrlGoogleMaps(viagem.origem, viagem.destino, passagens, true)); }
    catch (error: any) { Alert.alert('Navegação', error?.message || 'Não foi possível abrir o Google Maps.'); }
  };
  return <SafeAreaView style={styles.container}>
    <StatusBar barStyle="light-content" />
    <View style={styles.header}>
      <Text style={styles.titulo}>Detalhes do Roteiro</Text>
      <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}><Text style={styles.link}>VOLTAR</Text></TouchableOpacity>
    </View>
    <MapaRoteiro coordenadas={coordenadas} pontos={pontos} origem={viagem.origem || ''} destino={viagem.destino || ''}
      passagens={passagens} tiposIntermediarios={pontosIntermediarios.map((p) => p.tipo)} carregando={carregando} erro={erro} tentarNovamente={() => setTentativa((n) => n + 1)} />
    <ScrollView style={styles.painel} contentContainerStyle={styles.card}>
      <Text style={styles.rota}>De: {viagem.origem || 'Origem'}</Text>
      {pontosIntermediarios.map((p, i) => <Text key={i} style={styles.texto}>{p.tipo === 'parada' ? 'Parada' : 'Passagem'} {i + 1}: {p.local}</Text>)}
      <Text style={styles.rota}>Para: {viagem.destino || 'Destino'}</Text>
      <Text style={styles.texto}>Encontro: {viagem.localEncontro || 'A definir'}</Text>
      <Text style={styles.texto}>Partida: {viagem.dataPartida || 'A definir'}</Text>
      {!!erro && <Text style={styles.erro}>{erro}</Text>}
      <View style={styles.stats}>
        <View><Text style={styles.texto}>Distância</Text><Text style={styles.valor}>{viagem.distancia || '-- km'}</Text></View>
        <View><Text style={styles.texto}>Tempo</Text><Text style={styles.valor}>{viagem.tempoEstimado || '--'}</Text></View>
      </View>
      <TouchableOpacity style={styles.botao} onPress={handleIniciar}><Text style={styles.botaoTexto}>INICIAR VIAGEM</Text></TouchableOpacity>
      {isCriador && <TouchableOpacity style={styles.excluir} onPress={handleExcluir}><Text style={styles.link}>EXCLUIR ROTEIRO</Text></TouchableOpacity>}
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { minHeight: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { color: '#FFF', fontSize: 19, fontWeight: 'bold', flex: 1 },
  voltar: { padding: 12, minHeight: 44, justifyContent: 'center' },
  link: { color: '#F76B67', fontWeight: 'bold', fontSize: 12 },
  painel: { maxHeight: '46%', flexGrow: 0, backgroundColor: '#1C1C1E' }, card: { padding: 20, paddingBottom: 28 },
  rota: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  texto: { color: '#BBB', fontSize: 13, marginBottom: 8 }, erro: { color: '#FF8A80', marginVertical: 10 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 12 },
  valor: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  botao: { minHeight: 52, backgroundColor: '#E53935', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  botaoTexto: { color: '#FFF', fontWeight: 'bold' }, excluir: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
});
