import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ImageBackground, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../services/firebase';
import { doc, getDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { BottomNav } from '../components/BottomNav';
import { BottomSheetMenu } from '../components/BottomSheetMenu';
import { eventoAindaAtivo } from '../utils/eventos';
import { compararDatas } from '../utils/datas';

export default function HomeLogada({ navigation }: any) {
  const [apelido, setApelido] = useState('Piloto');
  const [menuVisible, setMenuVisible] = useState(false);
  const [eventosRecentes, setEventosRecentes] = useState<any[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);

  useEffect(() => {
    const buscarDadosUsuario = async () => {
      if (auth.currentUser) {
        try {
          const userRef = doc(db, 'usuarios', auth.currentUser.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists() && userDoc.data().apelido) {
            setApelido(userDoc.data().apelido);
          }
        } catch (error) {
          console.log('Erro ao buscar apelido do usuário:', error);
        }
      }
    };

    buscarDadosUsuario();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'eventos')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const listaEventos: any[] = [];
      querySnapshot.forEach((doc) => {
        listaEventos.push({ id: doc.id, ...doc.data() });
      });
      setEventosRecentes(listaEventos.filter(eventoAindaAtivo).sort((a, b) => compararDatas(a.dataInicio, b.dataInicio, a.horarioInicio, b.horarioInicio)).slice(0, 5));
      setLoadingEventos(false);
    }, () => setLoadingEventos(false));

    return () => unsubscribe();
  }, []);

  const navegarParaDetalhes = (evento: any) => {
    navigation.navigate('DetalhesEvento', { evento });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        bounces={false}
        contentContainerStyle={{ paddingBottom: 100 }} 
      >
        
        <ImageBackground
          source={require('../../assets/banner.webp')}
          style={styles.header}
        >
          <View style={styles.overlay}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Olá, {apelido}</Text>
              <View style={styles.redDash} />
              <Text style={styles.subtitle}>Pronto para acelerar hoje?</Text>
            </View>
          </View>
        </ImageBackground>

        <TouchableOpacity style={styles.assistantCard} activeOpacity={0.8}>
          <View style={styles.assistantInfo}>
            <View style={styles.assistantHeaderRow}>
              <Text style={styles.assistantTitleWhite}>MotoHub </Text>
              <Text style={styles.assistantTitleRed}>Assistente</Text>
              <View style={styles.betaBadge}>
                <Text style={styles.betaText}>BETA</Text>
              </View>
            </View>
            <Text style={styles.assistantStatus}>Status: Analisando sua máquina...</Text>
            <Text style={styles.assistantMsg}>Toque para ver o diagnóstico completo.</Text>
            <Text style={styles.assistantDisclaimer}>* Gratuito para versão de teste</Text>
          </View>
          <Ionicons name="hardware-chip" size={60} color="#E31C1C" style={styles.assistantIcon} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.btnQuickAction} 
          activeOpacity={0.7}
          onPress={() => navigation?.navigate('RegistrarAbastecimento')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#E31C1C" style={{ marginRight: 8 }} />
          <Text style={styles.btnQuickActionText}>Registrar Abastecimento</Text>
        </TouchableOpacity>

        {/* ÚLTIMOS EVENTOS COM O MESMO LAYOUT DA TELA EVENTOS */}
        <View style={styles.newsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>| ÚLTIMOS EVENTOS</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Eventos')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {loadingEventos ? (
            <ActivityIndicator size="small" color="#E31C1C" style={{ marginTop: 20 }} />
          ) : eventosRecentes.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum evento próximo. Divulgue o seu!</Text>
          ) : (
            <View style={{ paddingHorizontal: 16 }}>
              {eventosRecentes.map((evento) => (
                <TouchableOpacity 
                  key={evento.id} 
                  style={styles.card} 
                  activeOpacity={0.8}
                  onPress={() => navegarParaDetalhes(evento)}
                >
                  <View style={styles.flyerContainer}>
                    {evento.flyerUri ? (
                      <Image source={{ uri: evento.flyerUri }} style={styles.flyerImage} resizeMode="cover" />
                    ) : (
                      <MaterialCommunityIcons name="calendar-multiselect" size={28} color="#E53935" />
                    )}
                  </View>

                  <View style={styles.infoContainer}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{evento.nomeEvento}</Text>
                    <Text style={styles.cardDate}>{evento.dataInicio}{evento.horarioInicio ? ` às ${evento.horarioInicio}` : ''}</Text>
                    <Text style={styles.cardLocation} numberOfLines={1}>
                      {evento.cidade} - {evento.uf}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      <BottomNav 
        state={{ routes: [{ name: 'HomeTab' }], index: 0 }} 
        navigation={navigation} 
        onPressFab={() => setMenuVisible(true)} 
      />

      <BottomSheetMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSelectNovaManutencao={() => navigation.navigate('Manutencao')}
        onSelectNovoEvento={() => navigation.navigate('Eventos')}
        onSelectNovaViagem={() => navigation.navigate('Viagens')}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { width: '100%', height: 220 },
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'flex-end' },
  headerTextContainer: { paddingHorizontal: 24, paddingBottom: 32 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  redDash: { width: 32, height: 3, backgroundColor: '#E31C1C', marginTop: 8 },
  subtitle: { color: '#A3A3A3', fontSize: 14, marginTop: 8 },
  assistantCard: { marginHorizontal: 16, marginTop: -20, backgroundColor: '#1A1A1A', borderRadius: 12, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#333333' },
  assistantInfo: { flex: 1, marginRight: 16 },
  assistantHeaderRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  assistantTitleWhite: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  assistantTitleRed: { color: '#E31C1C', fontSize: 18, fontWeight: 'bold' },
  betaBadge: { backgroundColor: '#E31C1C', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  betaText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  assistantStatus: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginTop: 8 },
  assistantMsg: { color: '#A3A3A3', fontSize: 12, marginTop: 4 },
  assistantDisclaimer: { color: '#E31C1C', fontSize: 10, fontStyle: 'italic', marginTop: 12 },
  assistantIcon: { opacity: 0.9 },
  btnQuickAction: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, height: 56, borderRadius: 8, borderWidth: 1.5, borderColor: '#333333', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  btnQuickActionText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  newsSection: { marginTop: 24 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16, marginBottom: 12 },
  sectionTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginLeft: 16 },
  seeAllText: { color: '#E31C1C', fontSize: 12, fontWeight: 'bold' },
  emptyText: { color: '#A3A3A3', fontSize: 13, marginLeft: 16, fontStyle: 'italic' },
  
  // Novo estilo de card padrão idêntico à tela de Eventos
  card: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#2C2C2C', alignItems: 'center' },
  flyerContainer: { width: 60, height: 75, borderRadius: 6, backgroundColor: '#252525', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  flyerImage: { width: '100%', height: '100%' },
  infoContainer: { flex: 1, justifyContent: 'center' },
  cardTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  cardDate: { color: '#E53935', fontSize: 12, fontWeight: '500', marginBottom: 2 },
  cardLocation: { color: '#AAAAAA', fontSize: 11 },
});
