import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { ResultadoRota, tracarRota } from '../services/rotas';
import { codificarRota, formatarDuracao, normalizarPassagens, normalizarPontosIntermediarios } from '../utils/roteiro';
import { MapaRoteiro } from '../components/MapaRoteiro';

export function ResumoRoteiro({ navigation, route }: any) {
  const dados = route?.params || {};
  const { origem = '', destino = '', consumoMedio = '', localEncontro = '', dataPartida = '',
    dataRetorno = '', observacoes = '', isPublica = false, motoId = '', motoNome = '' } = dados;
  const pontosChave = JSON.stringify(normalizarPontosIntermediarios(dados.pontosIntermediarios, dados.passagens));
  const pontosIntermediarios = useMemo(() => normalizarPontosIntermediarios(JSON.parse(pontosChave)), [pontosChave]);
  const passagens: string[] = useMemo(() => normalizarPassagens(pontosIntermediarios), [pontosChave]);
  const [resultado, setResultado] = useState<ResultadoRota | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [tentativa, setTentativa] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const trava = useRef(false);
  const documento = useRef<ReturnType<typeof doc> | null>(null);
  const consultaChave = JSON.stringify([origem, destino, passagens]);
  const [calculadoPara, setCalculadoPara] = useState('');
  useEffect(() => {
    let ativo = true;
    setResultado(null); setErro(''); setCarregando(true); setSalvo(false);
    documento.current = null;
    tracarRota(origem, destino, passagens).then((rota) => {
      if (ativo) { setResultado(rota); setCalculadoPara(consultaChave); }
    }).catch((error) => {
      if (ativo) setErro(error?.message || 'Não foi possível calcular a rota.');
    }).finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [consultaChave, tentativa]);
  const consumo = Number(String(consumoMedio).replace(',', '.'));
  const distancia = resultado ? Math.round(resultado.distanciaKm) + ' km' : '-- km';
  const tempo = resultado ? formatarDuracao(resultado.duracaoSegundos) : '--';
  const combustivel = resultado && consumo > 0 && Number.isFinite(consumo)
    ? (resultado.distanciaKm / consumo).toFixed(1).replace('.', ',') + ' L' : '-- L';
  const podeSalvar = !!resultado && calculadoPara === consultaChave && !carregando && !erro
    && Number.isFinite(consumo) && consumo > 0 && !salvando && !salvo;
  const concluir = async () => {
    if (!podeSalvar || trava.current || !resultado) return;
    const user = auth.currentUser;
    if (!user) { Alert.alert('Sessão expirada', 'Entre novamente para salvar a viagem.'); return; }
    trava.current = true; setSalvando(true);
    try {
      const novaViagem = {
        userId: user.uid, motoId, motoNome, origem, destino, consumoMedio,
        distancia, tempoEstimado: tempo, combustivelEstimado: combustivel, localEncontro,
        passagens, pontosIntermediarios, rotaPolyline: codificarRota(resultado.coordenadas), pontosRota: resultado.pontos,
        distanciaKm: resultado.distanciaKm, duracaoSegundos: resultado.duracaoSegundos,
        dataPartida, dataRetorno, observacoes, isPublica, createdAt: serverTimestamp(),
      };
      // Mesmo ID em uma tentativa repetida evita viagens duplicadas após falha de rede.
      documento.current ??= doc(collection(db, 'viagens'));
      await setDoc(documento.current, novaViagem);
      setSalvo(true);
      Alert.alert('Sucesso', 'Roteiro salvo!', [{ text: 'OK', onPress: () => navigation.navigate('Viagens') }]);
    } catch (error: any) { Alert.alert('Erro ao salvar', error?.message || 'Tente novamente.'); }
    finally { trava.current = false; setSalvando(false); }
  };
  return <SafeAreaView style={styles.container}>
    <StatusBar barStyle="light-content" />
    <View style={styles.header}>
      <Text style={styles.titulo}>Resumo do Roteiro</Text>
      <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()} disabled={salvando}>
        <Text style={styles.link}>VOLTAR</Text>
      </TouchableOpacity>
    </View>
    <MapaRoteiro coordenadas={resultado?.coordenadas || []} pontos={resultado?.pontos}
      origem={origem} destino={destino} passagens={passagens} tiposIntermediarios={pontosIntermediarios.map((p) => p.tipo)} carregando={carregando} erro={erro}
      tentarNovamente={() => setTentativa((n) => n + 1)} />
    <ScrollView style={styles.painel} contentContainerStyle={styles.card}>
      <Text style={styles.rota}>De: {origem}</Text>
      {pontosIntermediarios.map((p, i) => <Text key={i} style={styles.texto}>{p.tipo === 'parada' ? 'Parada' : 'Passagem'} {i + 1}: {p.local}</Text>)}
      <Text style={styles.rota}>Para: {destino}</Text>
      {carregando ? <ActivityIndicator color="#E53935" style={{ margin: 16 }} /> : <>
        {!!erro && <Text style={styles.erro}>{erro}</Text>}
        <View style={styles.stats}>
          <View><Text style={styles.label}>Distância</Text><Text style={styles.valor}>{distancia}</Text></View>
          <View><Text style={styles.label}>Tempo</Text><Text style={styles.valor}>{tempo}</Text></View>
          <View><Text style={styles.label}>Combustível</Text><Text style={styles.valor}>{combustivel}</Text></View>
        </View>
      </>}
      <Text style={styles.texto}>Confira os locais e o traçado antes de salvar. Estimativas podem variar.</Text>
      <TouchableOpacity style={[styles.botao, !podeSalvar && styles.desabilitado]} onPress={concluir} disabled={!podeSalvar}>
        {salvando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.botaoTexto}>{salvo ? 'ROTEIRO SALVO' : 'CONCLUIR E SALVAR'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { minHeight: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { color: '#FFF', fontSize: 19, fontWeight: 'bold', flex: 1 },
  voltar: { padding: 12, minHeight: 44, justifyContent: 'center' },
  link: { color: '#F76B67', fontWeight: 'bold', fontSize: 12 },
  painel: { maxHeight: '46%', flexGrow: 0, backgroundColor: '#1C1C1E' },
  card: { padding: 20, paddingBottom: 28 },
  rota: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  texto: { color: '#BBB', fontSize: 13, marginBottom: 8 },
  erro: { color: '#FF8A80', marginVertical: 10 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 18 },
  label: { color: '#AAA', fontSize: 12 }, valor: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  botao: { minHeight: 52, backgroundColor: '#E53935', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  botaoTexto: { color: '#FFF', fontWeight: 'bold' }, desabilitado: { opacity: 0.45 },
});
