import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
// import * as Google from 'expo-auth-session/providers/google'; // Comentado no MVP
import { auth, db } from '../services/firebase';
// import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'; // Comentado no MVP
import { doc, setDoc, getDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { makeRedirectUri } from 'expo-auth-session';
import { eventoAindaAtivo } from '../utils/eventos';
import { compararDatas } from '../utils/datas';

WebBrowser.maybeCompleteAuthSession();

export function InicioVisitante({ navigation }: any) {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  
  // Estados dos Eventos do Firebase
  const [eventosRecentes, setEventosRecentes] = useState<any[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(true);

  // Estados para o Alerta Customizado (Padrão MotoHub)
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Exibe os 5 eventos ativos com data/hora de início mais próxima, em ordem crescente.
  useEffect(() => {
    const q = query(collection(db, 'eventos'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const lista: any[] = [];
      querySnapshot.forEach((docSnap) => {
        lista.push({ id: docSnap.id, ...docSnap.data() });
      });
      setEventosRecentes(
        lista
          .filter(eventoAindaAtivo)
          .sort((a, b) => compararDatas(a.dataInicio, b.dataInicio, a.horarioInicio, b.horarioInicio))
          .slice(0, 5)
      );
      setLoadingEventos(false);
    }, () => {
      setLoadingEventos(false);
      showAlert('Conexão indisponível', 'Não foi possível carregar os eventos agora.');
    });

    return () => unsubscribe();
  }, []);

  // --- BLOCO DO GOOGLE COMENTADO TEMPORARIAMENTE (MVP) ---
  /*
  const [request, response, promptAsync] = Google.useAuthRequest({
    // ... seu código google
  });
  */
  // -------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header com Banner */}
        <View style={styles.headerContainer}>
          <Image 
            source={require('../../assets/banner.webp')} 
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.gradientOverlay} />

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Olá, Visitante</Text>
            <View style={styles.redLine} />
            <Text style={styles.headerSubtitle}>Explore a comunidade MotoHub</Text>
          </View>
        </View>

        {/* Seção de Botões de Autenticação */}
        <View style={styles.authSection}>
          <TouchableOpacity 
            style={styles.btnRed} 
            onPress={() => navigation?.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnRedText}>ENTRAR COM E-MAIL</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.btnOutline} 
            onPress={() => navigation?.navigate('NovoCadastroUsuario')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>CRIAR CONTA GRÁTIS</Text>
          </TouchableOpacity>
        </View>

        {/* Seção de Eventos em Destaque (Agora puxando do Firebase com o novo visual) */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>EVENTOS EM DESTAQUE</Text>
          
          {loadingEventos ? (
            <ActivityIndicator size="small" color="#E53935" style={{ marginTop: 20 }} />
          ) : eventosRecentes.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum evento no momento.</Text>
          ) : (
            <View style={{ paddingHorizontal: 16 }}>
              {eventosRecentes.map((evento) => (
                <TouchableOpacity 
                  key={evento.id} 
                  style={styles.card} 
                  activeOpacity={0.8}
                  onPress={() => navigation?.navigate('DetalhesEvento', { evento })}
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
                    <Text style={styles.cardDate}>{evento.dataInicio}</Text>
                    <Text style={styles.cardLocation} numberOfLines={1}>
                      {evento.cidade} - {evento.uf}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de Alerta Customizado */}
      <Modal
        visible={alertVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAlertVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>{alertTitle}</Text>
            <Text style={styles.alertMessage}>{alertMessage}</Text>
            
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setAlertVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { flexGrow: 1 },
  headerContainer: { width: '100%', height: 220, position: 'relative', justifyContent: 'flex-end' },
  bannerImage: { position: 'absolute', width: '100%', height: '100%', opacity: 0.8 },
  gradientOverlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  headerTextContainer: { paddingHorizontal: 24, paddingBottom: 24 },
  headerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  redLine: { width: 32, height: 3, backgroundColor: '#E53935', marginTop: 8 },
  headerSubtitle: { color: '#AAAAAA', fontSize: 14, marginTop: 8 },
  authSection: { paddingHorizontal: 24, paddingTop: 24 },
  btnOutline: { width: '100%', height: 64, backgroundColor: '#1A1A1A', borderRadius: 8, borderWidth: 1, borderColor: '#2C2C2C', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  btnIcon: { marginRight: 8 },
  btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  btnRed: { width: '100%', height: 64, backgroundColor: '#E53935', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  btnRedText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  
  eventsSection: { marginTop: 32 },
  sectionTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginLeft: 16, marginBottom: 16 },
  emptyText: { color: '#A3A3A3', marginLeft: 24, fontStyle: 'italic' },
  
  // Estilo do Novo Card de Evento (Horizontal igual ao do HomeLogada)
  card: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#2C2C2C', alignItems: 'center' },
  flyerContainer: { width: 60, height: 75, borderRadius: 6, backgroundColor: '#252525', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  flyerImage: { width: '100%', height: '100%' },
  infoContainer: { flex: 1, justifyContent: 'center' },
  cardTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  cardDate: { color: '#E53935', fontSize: 12, fontWeight: '500', marginBottom: 2 },
  cardLocation: { color: '#AAAAAA', fontSize: 11 },

  // Estilos do Modal de Alerta
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  alertCard: { width: '100%', backgroundColor: '#1C1C1E', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#2C2C2C', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  alertTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  alertMessage: { color: '#AAAAAA', fontSize: 14, marginBottom: 24, lineHeight: 20 },
  alertButton: { height: 48, backgroundColor: '#E53935', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  alertButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
});
