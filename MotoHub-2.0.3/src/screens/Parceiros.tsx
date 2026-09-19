import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ImageBackground,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '../components/BottomNav';
import { BottomSheetMenu } from '../components/BottomSheetMenu';

export function Parceiros({ navigation }: any) {
  // Estado para controlar o menu do botão +
  const [menuVisible, setMenuVisible] = useState(false);

  const handleFalarComEquipe = () => {
    // Altere 'contato@motohub.com' para o e-mail real do projeto
    const email = 'contato@motohub.com';
    const assunto = 'Interesse em Parceria - MotoHub';
    const url = `mailto:${email}?subject=${encodeURIComponent(assunto)}`;

    Linking.openURL(url).catch(() => {
      Alert.alert(
        'Erro ao abrir o e-mail',
        `Não foi possível abrir o aplicativo de e-mail. Por favor, envie uma mensagem para ${email}.`
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header Padronizado */}
      <ImageBackground 
        source={require('../../assets/banner.webp')} 
        style={styles.header}
        imageStyle={{ opacity: 0.8 }}
      >
        <View style={styles.headerOverlay}>
          
          <View style={styles.topBar}>
            {/* Espaço mantido para não quebrar o layout, mas botão de voltar foi removido */}
          </View>

          <View style={styles.headerTexts}>
            <Text style={styles.title}>Parceiros</Text>
            <View style={styles.redLine} />
            <Text style={styles.subtitle}>Cresça com a comunidade</Text>
          </View>

        </View>
      </ImageBackground>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Seção 1: Por que anunciar */}
        <Text style={styles.sectionTitle}>POR QUE ANUNCIAR NO MOTOHUB?</Text>
        <Text style={styles.paragraph}>
          Conecte sua empresa diretamente com milhares de motociclistas apaixonados em todo o Brasil. 
          O MotoHub é a plataforma ideal para oficinas, lojas de acessórios, seguradoras e organizadores de eventos.
        </Text>

        {/* Seção 2: Benefícios */}
        <Text style={styles.sectionTitle}>BENEFÍCIOS</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text> Visibilidade segmentada para o público motociclista.
          </Text>
          <Text style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text> Divulgação de ofertas exclusivas no feed de notícias.
          </Text>
          <Text style={styles.bulletItem}>
            <Text style={styles.bulletPoint}>•</Text> Canal direto de comunicação com potenciais clientes.
          </Text>
        </View>

        {/* Seção 3: Como se tornar um parceiro */}
        <Text style={styles.sectionTitle}>COMO SE TORNAR UM PARCEIRO?</Text>
        <Text style={styles.paragraph}>
          Esta é uma funcionalidade que será implementada em breve. Se você já tem interesse em ser 
          um de nossos parceiros pioneiros, entre em contato através do nosso e-mail oficial.
        </Text>

        {/* Botão de Contato */}
        <TouchableOpacity style={styles.btnOutline} onPress={handleFalarComEquipe} activeOpacity={0.7}>
          <Text style={styles.btnOutlineText}>Falar com a Equipe</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* BARRA INFERIOR - Aba 'ParceirosTab' ativa */}
      <BottomNav 
        state={{ routes: [{ name: 'ParceirosTab' }], index: 0 }} 
        navigation={navigation} 
        onPressFab={() => setMenuVisible(true)} 
      />

      {/* MENU DO BOTÃO + */}
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
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    height: 220,
    width: '100%',
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    height: 48, // Altura fixa para manter o layout idêntico mesmo sem o botão
  },
  headerTexts: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  redLine: {
    width: 32,
    height: 3,
    backgroundColor: '#E53935',
    marginTop: 8,
  },
  subtitle: {
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120, // Aumentado de 40 para 120 para não cobrir o botão Falar com a Equipe
  },
  sectionTitle: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 22,
  },
  bulletList: {
    marginTop: 8,
  },
  bulletItem: {
    color: '#AAAAAA',
    fontSize: 14,
    paddingVertical: 4,
    lineHeight: 20,
  },
  bulletPoint: {
    color: '#E53935',
    fontWeight: 'bold',
  },
  btnOutline: {
    height: 56,
    borderWidth: 1,
    borderColor: '#4A4A4A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    backgroundColor: 'transparent',
  },
  btnOutlineText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});