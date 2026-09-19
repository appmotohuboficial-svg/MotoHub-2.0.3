import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ImageBackground,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { deleteUploadedImage } from '../services/imageUpload';

export function DetalhesEvento({ navigation, route }: any) {
  const evento = route?.params?.evento;
  const isOrganizador = !!evento?.userId && evento.userId === auth.currentUser?.uid;

  const handleAbrirMapas = () => {
    const endereco = [evento?.local, evento?.cidade, evento?.uf].filter(Boolean).join(', ');
    const url = `https://maps.google.com/?q=${encodeURIComponent(endereco)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir os mapas.');
    });
  };

  const handleExcluirEvento = () => {
    Alert.alert(
      'Excluir Evento',
      'Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!evento?.id || !isOrganizador) throw new Error();
              await deleteUploadedImage(evento.flyerPath);
              await deleteDoc(doc(db, 'eventos', evento.id));
              navigation?.goBack();
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir este evento.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Flyer Header (Imagem Grande) */}
        <ImageBackground 
          source={evento?.flyerUri ? { uri: evento.flyerUri } : require('../../assets/banner.webp')}
          style={styles.headerFlyer}
          resizeMode="cover"
        >
          <View style={styles.headerOverlay}>
            
            {/* Botão Voltar */}
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation?.goBack()}
            >
              <Text style={styles.backButtonText}>&lt;</Text>
            </TouchableOpacity>

            {/* Textos sobre a imagem */}
            <View style={styles.headerTexts}>
              <Text style={styles.eventName}>{evento?.nomeEvento ?? 'Evento'}</Text>
              <Text style={styles.eventCity}>{[evento?.cidade, evento?.uf].filter(Boolean).join(' - ')}</Text>
            </View>

          </View>
        </ImageBackground>

        {/* Info Section */}
        <View style={styles.infoSection}>
          
          {/* Data e Hora */}
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar-clock" size={24} color="#E53935" />
            <Text style={styles.infoText}>Início: {evento?.dataInicio ?? 'Data não informada'}{evento?.horarioInicio ? ` às ${evento.horarioInicio}` : ''}{'\n'}Término: {evento?.dataFim || evento?.dataInicio || 'Data não informada'}{evento?.horarioFim ? ` às ${evento.horarioFim}` : ''}</Text>
          </View>

          {/* Endereço */}
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker" size={24} color="#E53935" />
            <Text style={styles.infoText}>{evento?.local || 'Local não informado'}</Text>
          </View>

          {/* Organizador */}
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account-group" size={24} color="#E53935" />
            <Text style={styles.organizerText}>Organizado por: {evento?.organizador || 'Não informado'}</Text>
          </View>

          {/* Linha Divisória */}
          <View style={styles.divider} />

          {/* Sobre o Evento */}
          <Text style={styles.sectionTitle}>SOBRE O EVENTO</Text>
          <Text style={styles.description}>{evento?.outros || 'Nenhuma informação adicional.'}</Text>

          {/* Botão Ver no Maps */}
          {!!evento?.local && <TouchableOpacity style={styles.btnOutline} onPress={handleAbrirMapas}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color="#FFFFFF" style={{ marginRight: 12 }} />
            <Text style={styles.btnOutlineText}>VER NO GOOGLE MAPS</Text>
          </TouchableOpacity>}

          {/* Botão Excluir (Só aparece se for o organizador) */}
          {isOrganizador && (
            <TouchableOpacity style={styles.btnRed} onPress={handleExcluirEvento}>
              <Text style={styles.btnRedText}>EXCLUIR EVENTO</Text>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerFlyer: {
    width: '100%',
    height: 450,
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  backButtonText: {
    color: '#E53935',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerTexts: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  eventName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  eventCity: {
    color: '#E53935',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  infoSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 12,
  },
  organizerText: {
    color: '#AAAAAA',
    fontSize: 14,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2C',
    marginVertical: 24,
  },
  sectionTitle: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    color: '#AAAAAA',
    fontSize: 15,
    lineHeight: 22,
  },
  btnOutline: {
    flexDirection: 'row',
    height: 64,
    borderWidth: 1,
    borderColor: '#4A4A4A',
    backgroundColor: 'transparent',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  btnOutlineText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  btnRed: {
    height: 64,
    backgroundColor: '#E53935',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  btnRedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
