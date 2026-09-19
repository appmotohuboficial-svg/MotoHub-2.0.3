import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { CoordenadaRota, coordenadaValida, criarUrlGoogleMaps, regiaoDaRota } from '../utils/roteiro';

const REGIAO_BRASIL = { latitude: -14.2, longitude: -51.9, latitudeDelta: 40, longitudeDelta: 40 };
const NO_EXPO_GO = Constants.appOwnership === 'expo';

interface Props {
  coordenadas: CoordenadaRota[];
  pontos?: CoordenadaRota[];
  origem: string;
  destino: string;
  passagens: string[];
  tiposIntermediarios?: Array<'parada' | 'passagem'>;
  carregando?: boolean;
  erro?: string;
  tentarNovamente?: () => void;
}
function MapaNativo({ coordenadas, pontos = [], origem, destino, passagens, tiposIntermediarios = [] }: Props) {
  const ref = useRef<MapView | null>(null);
  const [pronto, setPronto] = useState(false);
  const [layout, setLayout] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const [demorou, setDemorou] = useState(false);
  const [instancia, setInstancia] = useState(0);
  useEffect(() => {
    if (carregado) return;
    const timer = setTimeout(() => setDemorou(true), 15000);
    return () => clearTimeout(timer);
  }, [carregado, instancia]);
  const recarregar = () => {
    setPronto(false); setLayout(false); setCarregado(false); setDemorou(false);
    setInstancia((valor) => valor + 1);
  };
  useEffect(() => {
    if (pronto && layout && coordenadas.length >= 2) {
      // Executa após o layout nativo, sem aguardar os blocos de imagem do Google.
      const frame = requestAnimationFrame(() => ref.current?.fitToCoordinates(coordenadas, {
        edgePadding: { top: 48, right: 48, bottom: 60, left: 48 }, animated: false,
      }));
      return () => cancelAnimationFrame(frame);
    }
  }, [pronto, layout, coordenadas]);
  const primeiro = coordenadas[0];
  return <View style={styles.superficie} collapsable={false}><MapView
    key={instancia}
    ref={ref}
    provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
    style={styles.superficie}
    initialRegion={coordenadas.length >= 2 ? regiaoDaRota(coordenadas) : REGIAO_BRASIL}
    mapType="standard"
    onMapReady={() => setPronto(true)}
    onMapLoaded={() => { setCarregado(true); setDemorou(false); }}
    onLayout={({ nativeEvent }) => setLayout(nativeEvent.layout.width > 0 && nativeEvent.layout.height > 0)}
    loadingEnabled={false}
    zoomControlEnabled
    toolbarEnabled={false}
  >
    {coordenadas.length >= 2 && <Polyline coordinates={coordenadas} strokeColor="#4285F4" strokeWidth={5} />}
    {primeiro && <Marker coordinate={primeiro} title="Origem" description={origem} pinColor="#4285F4" />}
    {pontos.length === passagens.length + 2 && pontos.slice(1, -1).map((ponto, index) =>
      coordenadaValida(ponto) ? <Marker key={index} coordinate={ponto} title={(tiposIntermediarios[index] === 'parada' ? 'Parada ' : 'Passagem ') + (index + 1)} description={passagens[index]} pinColor="#F9A825" /> : null
    )}
    {coordenadas.length >= 2 && <Marker coordinate={coordenadas[coordenadas.length - 1]} title="Destino" description={destino} pinColor="#E53935" />}
  </MapView>
    {demorou && !carregado && <View style={styles.statusMapa}>
      <Text style={styles.texto}>{NO_EXPO_GO
        ? 'O Google Maps não respondeu no Expo Go. Reabra o projeto ou teste o APK do MotoHub.'
        : 'O Google Maps não respondeu. Tente recarregar ou abra o roteiro no Google Maps.'}</Text>
      <TouchableOpacity accessibilityRole="button" style={styles.botao} onPress={recarregar}>
        <Text style={styles.botaoTexto}>RECARREGAR MAPA</Text>
      </TouchableOpacity>
    </View>}
  </View>;
}

export function MapaRoteiro(props: Props) {
  const [ampliado, setAmpliado] = useState(false);
  const [modalPronto, setModalPronto] = useState(false);
  const fecharMapa = () => { setModalPronto(false); setAmpliado(false); };
  const configurado = Platform.OS === 'ios' || NO_EXPO_GO
    || Constants.expoConfig?.extra?.androidMapsConfigured === true;
  // Carrega o mapa em paralelo ao cálculo, mantendo a mesma instância ao receber a rota.
  const visivel = Platform.OS !== 'web' && configurado;
  const abrirExterno = async () => {
    try { await Linking.openURL(criarUrlGoogleMaps(props.origem, props.destino, props.passagens)); }
    catch (erro: any) { Alert.alert('Mapa', erro?.message || 'Não foi possível abrir o Google Maps.'); }
  };
  return <View style={styles.container}>
    <View style={styles.mapa}>
      {visivel ? (!ampliado && <MapaNativo {...props} />) : <View style={styles.aviso}>
        {props.carregando ? <><ActivityIndicator color="#E53935" /><Text style={styles.texto}>Traçando roteiro…</Text></>
          : <Text style={styles.texto}>{!configurado
            ? 'Mapa interno não configurado neste aplicativo. Você pode abrir o roteiro no Google Maps.'
            : props.erro || 'Mapa indisponível. Abra o roteiro no Google Maps.'}</Text>}
      </View>}
    </View>
    {visivel && props.carregando && <View style={styles.calculo}>
      <ActivityIndicator color="#E53935" /><Text style={styles.texto}>Traçando roteiro…</Text>
    </View>}
    <View style={styles.acoes}>
      {visivel && <TouchableOpacity accessibilityRole="button" style={styles.botao} onPress={() => setAmpliado(true)}>
        <Text style={styles.botaoTexto}>VER MAPA EM TELA CHEIA</Text>
      </TouchableOpacity>}
      <TouchableOpacity accessibilityRole="button" style={styles.botao} onPress={abrirExterno}>
        <Text style={styles.botaoTexto}>ABRIR NO GOOGLE MAPS</Text>
      </TouchableOpacity>
      {!!props.erro && props.tentarNovamente && <TouchableOpacity style={styles.botao} onPress={props.tentarNovamente} disabled={props.carregando}>
        <Text style={styles.botaoTexto}>TENTAR NOVAMENTE</Text>
      </TouchableOpacity>}
    </View>
    <Text style={styles.creditos}>Roteiro: © OpenStreetMap contributors • OSRM</Text>
    <Modal visible={ampliado} animationType="slide" onShow={() => setModalPronto(true)} onRequestClose={fecharMapa}>
      <SafeAreaView style={styles.modal}>
        <View style={styles.modalBar}>
          <Text style={styles.titulo}>Mapa do roteiro</Text>
          <TouchableOpacity accessibilityRole="button" style={styles.botao} onPress={fecharMapa}>
            <Text style={styles.botaoTexto}>FECHAR</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.mapa}>{visivel && ampliado && modalPronto && <MapaNativo {...props} />}</View>
        <TouchableOpacity accessibilityRole="button" style={styles.botao} onPress={abrirExterno}>
          <Text style={styles.botaoTexto}>ABRIR NO GOOGLE MAPS</Text>
        </TouchableOpacity>
        <Text style={styles.creditos}>Roteiro: © OpenStreetMap contributors • OSRM</Text>
      </SafeAreaView>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 230, backgroundColor: '#1A1A1A' },
  mapa: { flex: 1, minHeight: 150 },
  superficie: { flex: 1, minHeight: 150 },
  statusMapa: { backgroundColor: '#1C1C1E', padding: 10 },
  calculo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 8 },
  aviso: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  texto: { color: '#DDD', textAlign: 'center', marginTop: 8 },
  acoes: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  botao: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
  botaoTexto: { color: '#F76B67', fontSize: 11, fontWeight: 'bold' },
  creditos: { color: '#AAA', textAlign: 'center', fontSize: 10, paddingBottom: 6 },
  modal: { flex: 1, backgroundColor: '#121212' },
  modalBar: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  titulo: { fontSize: 18, color: '#FFF', fontWeight: 'bold' },
});
