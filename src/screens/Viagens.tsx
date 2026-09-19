import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ImageBackground, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { compararDatas } from '../utils/datas';

interface Viagem {
  id: string;
  origem: string;
  destino: string;
  dataPartida: string;
  isPublica: boolean;
  userId: string;
  createdAt?: { seconds?: number };
}

type ModoLista = 'publicas' | 'minhas';

export function Viagens({ navigation }: any) {
  const [modo, setModo] = useState<ModoLista>('publicas');
  const [viagens, setViagens] = useState<Viagem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const consulta = modo === 'publicas'
      ? query(collection(db, 'viagens'), where('isPublica', '==', true))
      : query(collection(db, 'viagens'), where('userId', '==', user.uid));

    return onSnapshot(consulta, (snapshot) => {
      const lista = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }) as Viagem)
        .filter((item) => modo === 'publicas' || item.isPublica !== true)
        .sort((a, b) => compararDatas(a.dataPartida, b.dataPartida));
      setViagens(lista);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao carregar viagens:', error);
      setLoading(false);
      Alert.alert('Erro', 'Não foi possível carregar as viagens.');
    });
  }, [modo]);

  const renderCard = ({ item }: { item: Viagem }) => (
    <TouchableOpacity style={styles.cardContainer} activeOpacity={0.8} onPress={() => navigation.navigate('DetalhesViagem', { viagem: item })}>
      <ImageBackground source={require('../../assets/banner.webp')} style={styles.cardImage} imageStyle={{ borderRadius: 16, opacity: 0.42 }}>
        <View style={styles.cardOverlay}>
          <View>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTag}>ROTEIRO</Text>
              <Text style={item.isPublica ? styles.publicTag : styles.privateTag}>{item.isPublica ? 'PÚBLICA' : 'PRIVADA'}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.origem?.split(' - ')[0]} ➜ {item.destino?.split(' - ')[0]}</Text>
          </View>
          <Text style={styles.cardDate}>Partida: {item.dataPartida || 'A definir'}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ImageBackground source={require('../../assets/banner.webp')} style={styles.header}>
        <View style={styles.headerOverlay}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backButtonText}>&lt;</Text></TouchableOpacity>
          </View>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Viagens</Text><View style={styles.redLine} />
              <Text style={styles.subtitle}>{modo === 'publicas' ? 'Explore novas rotas' : 'Seus roteiros privados'}</Text>
            </View>
            <TouchableOpacity style={styles.btnNewTrip} onPress={() => navigation.navigate('NovaViagem')}><Text style={styles.btnNewTripText}>Nova Viagem</Text></TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, modo === 'publicas' && styles.tabActive]} onPress={() => setModo('publicas')}>
          <Text style={[styles.tabText, modo === 'publicas' && styles.tabTextActive]}>Viagens públicas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, modo === 'minhas' && styles.tabActive]} onPress={() => setModo('minhas')}>
          <Text style={[styles.tabText, modo === 'minhas' && styles.tabTextActive]}>Minhas Viagens</Text>
        </TouchableOpacity>
      </View>

      {loading ? <View style={styles.emptyState}><ActivityIndicator size="large" color="#E53935" /></View>
      : viagens.length === 0 ? <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{modo === 'publicas' ? 'Nenhuma viagem pública.' : 'Nenhuma viagem privada.'}</Text>
          <Text style={styles.emptySubtext}>{modo === 'publicas' ? 'As rotas compartilhadas aparecerão aqui.' : 'Crie uma viagem e mantenha a opção pública desativada.'}</Text>
        </View>
      : <FlatList data={viagens} keyExtractor={(item) => item.id} renderItem={renderCard} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' }, header: { height: 220, width: '100%' },
  headerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'space-between', paddingBottom: 30, paddingTop: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16 }, backButton: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' }, backButtonText: { color: '#E53935', fontSize: 32, fontWeight: 'bold' },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 24 }, titleContainer: { flex: 1 }, title: { color: '#FFF', fontSize: 28, fontWeight: '900' }, redLine: { width: 32, height: 3, backgroundColor: '#E53935', marginTop: 8 }, subtitle: { color: '#AAA', fontSize: 14, marginTop: 8 },
  btnNewTrip: { backgroundColor: '#E53935', paddingHorizontal: 16, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginLeft: 16 }, btnNewTripText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  tabs: { flexDirection: 'row', margin: 16, padding: 4, backgroundColor: '#1A1A1A', borderRadius: 10 }, tab: { flex: 1, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }, tabActive: { backgroundColor: '#E53935' }, tabText: { color: '#999', fontSize: 13, fontWeight: 'bold' }, tabTextActive: { color: '#FFF' },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 }, emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }, emptyText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }, emptySubtext: { color: '#AAA', fontSize: 14, textAlign: 'center' },
  cardContainer: { height: 180, marginBottom: 16, borderRadius: 16, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2C2C2C', overflow: 'hidden' }, cardImage: { width: '100%', height: '100%' }, cardOverlay: { flex: 1, justifyContent: 'space-between', padding: 20, backgroundColor: 'rgba(0,0,0,0.28)' }, cardHeader: { flexDirection: 'row', justifyContent: 'space-between' }, cardTag: { color: '#E53935', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  publicTag: { color: '#FFF', fontSize: 10, fontWeight: 'bold', backgroundColor: '#2E7D32', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 }, privateTag: { color: '#FFF', fontSize: 10, fontWeight: 'bold', backgroundColor: '#444', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 }, cardTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', marginTop: 12, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 6 }, cardDate: { color: '#DDD', fontSize: 12, fontWeight: 'bold' },
});
