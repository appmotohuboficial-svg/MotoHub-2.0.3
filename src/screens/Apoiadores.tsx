import { FotoPerfil } from '../components/FotoPerfil';
import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ImageBackground, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomNav } from '../components/BottomNav';
import { BottomSheetMenu } from '../components/BottomSheetMenu';
import { useFocusEffect } from '@react-navigation/native';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { TIPOS_APOIO, Apoiador, filtrarApoiadores } from '../utils/apoiadores';

export function Apoiadores({ navigation }: any) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('Todos');
  const [lista, setLista] = useState<Apoiador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  useFocusEffect(useCallback(() => {
    setCarregando(true); setErro(false); setLista([]);
    if (!auth.currentUser) { setCarregando(false); setErro(true); return; }
    return onSnapshot(collection(db, 'apoiadores'), snapshot => {
      setLista(snapshot.docs.map(item => ({ ...item.data(), id: item.id } as Apoiador)));
      setCarregando(false);
    }, () => { setLista([]); setCarregando(false); setErro(true); });
  }, [tentativa]));
  const resultados = filtrarApoiadores(lista, busca, tipo);
  const meuCadastro = lista.some(item => item.userId === auth.currentUser?.uid);
  const insets = useSafeAreaInsets();
  const emBreve = (titulo: string) => Alert.alert(titulo, 'Este recurso está em preparação. Nenhum pedido ou alerta será enviado nesta etapa.');
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <ImageBackground source={require('../../assets/banner.webp')} style={styles.banner}>
          <View style={styles.overlay}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Voltar">
                <MaterialCommunityIcons name="chevron-left" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Perfil')} accessibilityRole="button" accessibilityLabel="Meu Perfil">
                <MaterialCommunityIcons name="account-circle-outline" size={28} color="#E53935" />
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>Apoiadores</Text>
            <View style={styles.redLine} />
            <Text style={styles.subtitle}>Motociclistas ajudando motociclistas</Text>
          </View>
        </ImageBackground>
        <View style={styles.body}>
          <TouchableOpacity style={styles.request} onPress={() => emBreve('Pedir apoio')} accessibilityRole="button">
            <MaterialCommunityIcons name="handshake-outline" size={38} color="#121212" />
            <View style={styles.requestTexts}>
              <Text style={styles.requestTitle}>PEDIR APOIO</Text>
              <Text style={styles.requestDescription}>Encontre ajuda para seguir sua viagem.</Text>
              <Text style={styles.requestSoon}>Em breve</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={28} color="#121212" />
          </TouchableOpacity>
          <View style={styles.tabs}>
            <View style={[styles.tab, styles.tabActive]}><MaterialCommunityIcons name="format-list-bulleted" size={22} color="#FFFFFF" /><Text style={styles.tabText}>Lista</Text></View>
            <TouchableOpacity style={styles.tab} onPress={() => emBreve('Mapa')} accessibilityRole="button" accessibilityLabel="Mapa, em breve"><MaterialCommunityIcons name="map-marker-outline" size={22} color="#AAAAAA" /><Text style={styles.tabText}>Mapa · em breve</Text></TouchableOpacity>
          </View>
          <View style={styles.search}>
            <MaterialCommunityIcons name="magnify" size={26} color="#AAAAAA" />
            <TextInput value={busca} onChangeText={setBusca} placeholder="Buscar por cidade ou nome..." placeholderTextColor="#888888" style={styles.searchInput} accessibilityLabel="Buscar apoiadores por cidade ou nome" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {['Todos', ...TIPOS_APOIO.map(item => item.nome)].map(nome => {
              const option = TIPOS_APOIO.find(item => item.nome === nome);
              return <TouchableOpacity key={nome} style={[styles.filter, tipo === nome && styles.filterActive]} onPress={() => setTipo(nome)} accessibilityRole="button" accessibilityState={{ selected: tipo === nome }}><Text style={styles.filterText}>{option ? `${option.emoji} ` : ''}{nome}</Text></TouchableOpacity>;
            })}
          </ScrollView>
          {carregando ? <ActivityIndicator color="#E53935" style={{ margin: 24 }} /> : erro ? <View style={styles.empty}><Text style={styles.emptyTitle}>Não foi possível carregar a rede</Text><Text style={styles.muted}>Confira a conexão e tente novamente.</Text><TouchableOpacity style={styles.register} onPress={() => setTentativa(value => value + 1)}><Text style={styles.registerText}>Tentar novamente</Text></TouchableOpacity></View> : resultados.length === 0 ? <View style={styles.empty}>
            <MaterialCommunityIcons name="handshake-outline" size={48} color="#E53935" />
            <Text style={styles.emptyTitle}>{lista.length ? 'Nenhum apoiador encontrado' : 'Seja um dos primeiros apoiadores'}</Text>
            <Text style={styles.muted}>{lista.length ? 'Experimente outra cidade, nome ou tipo de apoio.' : 'Cadastre os apoios que você pode oferecer à comunidade.'}</Text>
            {!!lista.length && <TouchableOpacity style={styles.register} onPress={() => { setBusca(''); setTipo('Todos'); }}><Text style={styles.registerText}>Limpar busca e filtros</Text></TouchableOpacity>}
          </View> : resultados.map(item => <TouchableOpacity key={item.id} style={styles.supporterCard} onPress={() => navigation.navigate('PerfilApoiador', { apoiadorId: item.id })} accessibilityRole="button" accessibilityLabel={'Ver perfil de ' + item.nome}>
            <View style={styles.supporterHeader}><FotoPerfil uri={item.fotoUrl} size={56} /><View style={{ flex: 1 }}><Text style={styles.supporterName}>{item.nome}</Text><Text style={styles.supporterLocation}>{item.cidade} – {item.uf}</Text></View><MaterialCommunityIcons name="chevron-right" size={26} color="#AAAAAA" /></View>
            <View style={styles.supporterTypes}>{item.tipos.map(apoio => <Text key={apoio} style={styles.supporterTag}>{TIPOS_APOIO.find(option => option.nome === apoio)?.emoji} {apoio}</Text>)}</View>
            <Text style={styles.contactNote}>Disponibilidade por contato</Text><Text style={styles.profileLink}>Ver perfil</Text>
          </TouchableOpacity>)}
          <TouchableOpacity style={styles.register} onPress={() => navigation.navigate('CadastroApoiador')} accessibilityRole="button"><Text style={styles.registerText}>{meuCadastro ? 'Meu cadastro de Apoiador' : 'Torne-se um Apoiador'}</Text><MaterialCommunityIcons name="chevron-right" size={22} color="#FFFFFF" /></TouchableOpacity>
          <View style={styles.emergency}>
            <MaterialCommunityIcons name="alert-outline" size={32} color="#FFFFFF" />
            <View style={{ flex: 1 }}><Text style={styles.emergencyTitle}>EMERGÊNCIA</Text><Text style={styles.emergencyText}>Em uma situação grave, procure os serviços de emergência da sua região.</Text><Text style={styles.emergencySoon}>Alertas para apoiadores: em breve</Text></View>
          </View>
        </View>
      </ScrollView>
      <BottomNav state={{ routes: [{ name: 'Apoiadores' }], index: 0 }} navigation={navigation} onPressFab={() => setMenuVisible(true)} />
      <BottomSheetMenu visible={menuVisible} onClose={() => setMenuVisible(false)} onSelectNovaManutencao={() => navigation.navigate('Manutencao')} onSelectNovoEvento={() => navigation.navigate('Eventos')} onSelectNovaViagem={() => navigation.navigate('Viagens')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  supporterCard: { backgroundColor: '#1A1A1A', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#333333' },
  supporterHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  supporterName: { color: '#FFFFFF', fontSize: 19, fontWeight: 'bold' },
  supporterLocation: { color: '#AAAAAA', fontSize: 14, marginTop: 4 },
  supporterTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  supporterTag: { color: '#FFFFFF', fontSize: 12, backgroundColor: '#252525', padding: 8, borderRadius: 8 },
  profileLink: { color: '#E53935', fontSize: 14, fontWeight: 'bold', marginTop: 12, textAlign: 'right' },
  container: { flex: 1, backgroundColor: '#121212' },
  banner: { height: 220 },
  overlay: { flex: 1, padding: 20, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  topBar: { position: 'absolute', top: 12, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  iconButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900' },
  redLine: { width: 32, height: 3, backgroundColor: '#E53935', marginVertical: 8 },
  subtitle: { color: '#CCCCCC', fontSize: 15 },
  body: { padding: 16, gap: 16 },
  request: { backgroundColor: '#FFCA28', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  requestTexts: { flex: 1 },
  requestTitle: { color: '#121212', fontSize: 20, fontWeight: '900' },
  requestDescription: { color: '#222222', fontSize: 13, marginTop: 4 },
  requestSoon: { color: '#333333', fontWeight: 'bold', fontSize: 11, marginTop: 6 },
  tabs: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 12, overflow: 'hidden' },
  tab: { flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabActive: { backgroundColor: '#E53935', borderRadius: 12 },
  tabText: { color: '#FFFFFF', fontSize: 13 },
  search: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333333', borderRadius: 12 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 14, minHeight: 52, marginLeft: 8 },
  filters: { gap: 8 },
  filter: { minHeight: 44, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#252525', justifyContent: 'center' },
  filterActive: { backgroundColor: '#E53935' },
  filterText: { color: '#FFFFFF', fontSize: 13 },
  empty: { padding: 24, alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 16, borderWidth: 1, borderColor: '#333333' },
  emptyTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
  muted: { color: '#AAAAAA', fontSize: 14, lineHeight: 21, marginTop: 12, textAlign: 'center' },
  contactNote: { color: '#CCCCCC', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 16 },
  register: { backgroundColor: '#E53935', borderRadius: 10, minHeight: 52, paddingHorizontal: 16, marginTop: 20, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  registerText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', flexShrink: 1 },
  emergency: { padding: 16, borderRadius: 16, backgroundColor: '#B71C1C', flexDirection: 'row', gap: 12, alignItems: 'center' },
  emergencyTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  emergencyText: { color: '#FFFFFF', fontSize: 13, lineHeight: 20, marginTop: 4 },
  emergencySoon: { color: '#FFCDD2', fontSize: 11, marginTop: 8 },
});
