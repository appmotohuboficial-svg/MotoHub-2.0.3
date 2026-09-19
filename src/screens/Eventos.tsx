import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ImageBackground,
  FlatList,
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { eventoAindaAtivo } from '../utils/eventos';
import { compararDatas } from '../utils/datas';

interface Evento {
  id: string;
  nomeEvento: string;
  dataInicio: string;
  dataFim: string;
  horarioInicio?: string;
  horarioFim?: string;
  cidade: string;
  uf: string;
  local: string;
  flyerUri?: string;
  organizador?: string;
  contato?: string;
  estruturas?: string[];
  outros?: string;
  flyerPath?: string;
  dataInicioTimestamp?: Timestamp;
  dataFimTimestamp?: Timestamp;
  expiresAt?: Timestamp;
}

export function Eventos({ navigation }: any) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'eventos'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const listaEventos: Evento[] = [];
      querySnapshot.forEach((doc) => {
        listaEventos.push({ id: doc.id, ...doc.data() } as Evento);
      });
      setEventos(listaEventos.filter(eventoAindaAtivo).sort((a, b) => compararDatas(a.dataInicio, b.dataInicio, a.horarioInicio, b.horarioInicio)));
      setLoading(false);
    }, () => setLoading(false));

    return () => unsubscribe();
  }, []);

  const handleDivulgarEvento = () => {
    navigation?.navigate('NovoEvento');
  };

  const navegarParaDetalhes = (item: Evento) => {
    navigation?.navigate('DetalhesEvento', { evento: item });
  };

  const renderEvento = ({ item }: { item: Evento }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => navegarParaDetalhes(item)}
    >
      <View style={styles.flyerContainer}>
        {item.flyerUri ? (
          <Image source={{ uri: item.flyerUri }} style={styles.flyerImage} resizeMode="cover" />
        ) : (
          <MaterialCommunityIcons name="calendar-multiselect" size={32} color="#E53935" />
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.nomeEvento}</Text>
        <Text style={styles.cardDate}>
          {item.dataInicio}{item.horarioInicio ? ` às ${item.horarioInicio}` : ''}{item.dataFim && item.dataFim !== item.dataInicio ? ` a ${item.dataFim}` : ''}{item.horarioFim ? ` até ${item.horarioFim}` : ''}
        </Text>
        <Text style={styles.cardLocation} numberOfLines={2}>
          {item.cidade} - {item.uf} | {item.local}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <TouchableOpacity 
        style={styles.btnVoltar} 
        onPress={() => navigation?.goBack()}
        activeOpacity={0.7}
      >
        <Text style={styles.btnVoltarText}>&lt;</Text>
      </TouchableOpacity>

      <ImageBackground 
        source={require('../../assets/banner.webp')} 
        style={styles.header}
        imageStyle={{ opacity: 0.8 }}
      >
        <View style={styles.headerOverlay}>
          <View style={styles.headerContent}>
            
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Eventos</Text>
              <View style={styles.redLine} />
              <Text style={styles.subtitle}>Encontros e muito mais</Text>
            </View>

            <TouchableOpacity style={styles.btnNewEvent} onPress={handleDivulgarEvento} activeOpacity={0.8}>
              <Text style={styles.btnNewEventText}>Divulgar Evento</Text>
            </TouchableOpacity>

          </View>
        </View>
      </ImageBackground>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#E53935" />
        </View>
      ) : eventos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nenhum evento programado.</Text>
          <Text style={styles.emptySubtext}>Seja o primeiro a divulgar um encontro!</Text>
        </View>
      ) : (
        <FlatList
          data={eventos}
          keyExtractor={(item) => item.id}
          renderItem={renderEvento}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  btnVoltar: { position: 'absolute', top: 48, right: 16, zIndex: 99, width: 48, height: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: 24 },
  btnVoltarText: { color: '#E53935', fontSize: 28, fontWeight: 'bold' },
  header: { height: 220, width: '100%' },
  headerOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end', paddingBottom: 32, paddingHorizontal: 16 },
  headerContent: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingLeft: 8 },
  titleContainer: { flex: 1 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  redLine: { width: 32, height: 3, backgroundColor: '#E53935', marginTop: 8 },
  subtitle: { color: '#AAAAAA', fontSize: 14, marginTop: 8 },
  btnNewEvent: { height: 44, backgroundColor: '#E53935', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', marginLeft: 16 },
  btnNewEventText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  listContent: { padding: 16, paddingBottom: 40 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { color: '#AAAAAA', fontSize: 14, textAlign: 'center' },
  card: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#2C2C2C', alignItems: 'center' },
  flyerContainer: { width: 80, height: 100, borderRadius: 8, backgroundColor: '#252525', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  flyerImage: { width: '100%', height: '100%' },
  infoContainer: { flex: 1, justifyContent: 'center' },
  cardTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  cardDate: { color: '#E53935', fontSize: 13, fontWeight: '500', marginBottom: 4 },
  cardLocation: { color: '#AAAAAA', fontSize: 12, lineHeight: 16 },
});
