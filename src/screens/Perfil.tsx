import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ImageBackground,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomNav } from '../components/BottomNav';
import { BottomSheetMenu } from '../components/BottomSheetMenu';
import { deleteUser, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useFocusEffect } from '@react-navigation/native';
import { buscarMeuApoiador } from '../services/apoiadores';
import { FotoPerfil } from '../components/FotoPerfil';
import { deleteAccountData } from '../services/account';

export function Perfil({ navigation }: any) {
  const [temCadastroApoiador, setTemCadastroApoiador] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    buscarMeuApoiador().then(cadastro => { if (active) setTemCadastroApoiador(!!cadastro); }).catch(() => { if (active) setTemCadastroApoiador(false); });
    return () => { active = false; };
  }, []));
  const [isVerificado, setIsVerificado] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [fotoUrl, setFotoUrl] = useState('');
  const [nome, setNome] = useState('');
  const [apelido, setApelido] = useState('');
  const [email, setEmail] = useState(auth.currentUser?.email ?? '');

  useFocusEffect(useCallback(() => {
    let active = true;
    const carregarPerfil = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const snapshot = await getDoc(doc(db, 'usuarios', user.uid));
        if (!active) return;
        const dados = snapshot.data();
        setFotoUrl(dados?.fotoUrl ?? '');
        setNome(dados?.nomeCompleto ?? user.displayName ?? 'Motociclista');
        setApelido(dados?.apelido ?? '');
        setEmail(dados?.email ?? user.email ?? '');
        setIsVerificado(user.emailVerified);
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar seu perfil.');
      }
    };
    carregarPerfil();
    return () => { active = false; };
  }, []));

  const handleAlterarInformacoes = () => {
    navigation?.navigate('EditarPerfil');
  };

  const handleVerificarConta = () => {
    Alert.alert('Em desenvolvimento', 'A verificação por prova de vida ainda não está disponível.');
  };

  const handleTermosEPrivacidade = () => {
    navigation?.navigate('DocumentacaoLegal');
  };

  const handleApagarConta = () => {
    Alert.alert(
      'Apagar conta',
      'Deseja realmente apagar sua conta? Esta ação não poderá ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            const user = auth.currentUser;
            if (!user) return;
            try {
              await deleteAccountData(user.uid);
              await deleteUser(user);
            } catch (error: any) {
              Alert.alert(
                'Não foi possível apagar',
                error?.code === 'auth/requires-recent-login'
                  ? 'Por segurança, saia, entre novamente e repita a exclusão.'
                  : 'Tente novamente. Alguns dados podem já ter sido removidos.',
              );
            }
          },
        },
      ],
    );
  };

  const handleSairConta = async () => {
    try {
      await signOut(auth);
    } catch {
      Alert.alert('Erro', 'Não foi possível sair da conta.');
    }
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
            <View style={{ flex: 1 }} />
          </View>

          <View style={styles.headerTexts}>
            <Text style={styles.title}>Meu Perfil</Text>
            <View style={styles.redLine} />
            <Text style={styles.subtitle}>Piloto verificado</Text>
          </View>
        </View>
      </ImageBackground>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* User Info Card */}
        <View style={styles.profileCard}>
          <FotoPerfil uri={fotoUrl} size={64} />
          
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{nome || 'Motociclista'}</Text>
            {!!apelido && <Text style={styles.userNickname}>@{apelido}</Text>}
            <Text style={styles.userEmail}>{email}</Text>
          </View>

          {isVerificado && (
            <MaterialCommunityIcons name="check-decagram" size={24} color="#E53935" />
          )}
        </View>

        <Text style={styles.sectionTitle}>CONFIGURAÇÕES DA CONTA</Text>

        <TouchableOpacity
          style={styles.btnOutline}
          onPress={() => navigation.navigate('Garagem')}
          accessibilityRole="button"
          accessibilityLabel="Minha Garagem"
        >
          <MaterialCommunityIcons name="motorbike" size={20} color="#FFFFFF" style={styles.btnIcon} />
          <Text style={styles.btnOutlineText}>Minha Garagem</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.navigate('CadastroApoiador')} accessibilityRole="button">
          <MaterialCommunityIcons name="handshake-outline" size={20} color="#FFFFFF" style={styles.btnIcon} />
          <Text style={styles.btnOutlineText}>{temCadastroApoiador ? 'Meu cadastro de Apoiador' : 'Torne-se um Apoiador'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnOutline} onPress={handleAlterarInformacoes}>
          <MaterialCommunityIcons name="pencil-outline" size={20} color="#FFFFFF" style={styles.btnIcon} />
          <Text style={styles.btnOutlineText}>Alterar Informações</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnOutline} onPress={handleVerificarConta}>
          <MaterialCommunityIcons name="camera-outline" size={20} color="#FFFFFF" style={styles.btnIcon} />
          <Text style={styles.btnOutlineText}>Verificar Conta (Prova de Vida)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnOutline} onPress={handleTermosEPrivacidade}>
          <MaterialCommunityIcons name="shield-account-outline" size={20} color="#FFFFFF" style={styles.btnIcon} />
          <Text style={styles.btnOutlineText}>Termos e Privacidade</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btnOutline, styles.btnDelete]} onPress={handleApagarConta}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#E53935" style={styles.btnIcon} />
          <Text style={styles.btnDeleteText}>Apagar Minha Conta</Text>
        </TouchableOpacity>

        <Text style={styles.warningText}>
          Atenção: Esta ação é irreversível e apagará todos os seus dados de manutenção, viagens e motos.
        </Text>

        <TouchableOpacity style={styles.btnLogout} onPress={handleSairConta}>
          <Text style={styles.btnLogoutText}>SAIR DA CONTA</Text>
        </TouchableOpacity>

      </ScrollView>

      <BottomNav 
        state={{ routes: [{ name: 'PerfilTab' }], index: 0 }} 
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
  container: { flex: 1, backgroundColor: '#121212' },
  header: { height: 220, width: '100%' },
  headerOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'space-between', paddingTop: 10 },
  topBar: { flexDirection: 'row', paddingHorizontal: 16, height: 48 },
  headerTexts: { paddingHorizontal: 24, paddingBottom: 32 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  redLine: { width: 32, height: 3, backgroundColor: '#E53935', marginTop: 8 },
  subtitle: { color: '#AAAAAA', fontSize: 14, marginTop: 8 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },
  profileCard: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20, alignItems: 'center', marginTop: 24, borderWidth: 1, borderColor: '#2C2C2C' },
  profileImage: { width: 64, height: 64, borderRadius: 32 },
  profileInfo: { flex: 1, marginLeft: 16 },
  userName: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  userNickname: { color: '#E53935', fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  userEmail: { color: '#AAAAAA', fontSize: 13, marginTop: 4 },
  sectionTitle: { color: '#E53935', fontSize: 12, fontWeight: 'bold', marginTop: 32, marginBottom: 16 },
  btnOutline: { flexDirection: 'row', height: 56, borderWidth: 1, borderColor: '#4A4A4A', borderRadius: 8, alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, backgroundColor: 'transparent' },
  btnIcon: { marginRight: 12 },
  btnOutlineText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  btnDelete: { borderColor: '#E53935', marginTop: 20, marginBottom: 8 },
  btnDeleteText: { color: '#E53935', fontSize: 14, fontWeight: '500' },
  warningText: { color: '#777777', fontSize: 11, paddingHorizontal: 8, textAlign: 'center' },
  btnLogout: { height: 64, backgroundColor: '#E53935', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  btnLogoutText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
});
