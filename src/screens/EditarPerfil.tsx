import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { salvarFotoPerfil } from '../services/fotoPerfil';
import { removeTemporaryImage } from '../services/temporaryImages';
import { formatarTelefoneApoiador } from '../utils/telefoneApoiador';
import { FotoPerfil } from '../components/FotoPerfil';
import { auth, db } from '../services/firebase';

export function EditarPerfil({ navigation }: any) {
  const [fotoUrl, setFotoUrl] = useState('');
  const [salvandoFoto, setSalvandoFoto] = useState(false);
  const escolherFoto = async () => {
    if (salvandoFoto || isLoading) return;
    let selecionada: string | undefined;
    let processada: string | undefined;
    setSalvandoFoto(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { Alert.alert('Permissão necessária', 'Permita o acesso à galeria para escolher sua foto.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (result.canceled) return;
      selecionada = result.assets[0].uri;
      const image = await ImageManipulator.manipulateAsync(selecionada, [{ resize: { width: 512 } }], { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG });
      processada = image.uri;
      const url = await salvarFotoPerfil(processada);
      setFotoUrl(url);
      Alert.alert('Foto salva', 'Sua foto foi atualizada no perfil e no cadastro de Apoiador.');
    } catch (error: any) {
      const code = error?.code || 'foto/selecionar-ou-processar';
      const etapa = error?.etapa || 'seleção ou processamento';
      console.warn('Falha foto de perfil:', etapa, code, error?.message);
      const detalhe = code === 'foto/tamanho-excedido' ? 'A foto deve ter até 2 MB após o recorte.'
        : code === 'foto/formato-invalido' ? 'Não foi possível converter a imagem para JPEG.'
        : code === 'foto/arquivo-ausente' ? 'A imagem selecionada não pôde ser lida. Escolha a foto novamente.'
        : code === 'permission-denied' || code === 'storage/unauthorized'
        ? 'O Firebase recusou a permissão para salvar a foto.'
        : code === 'storage/object-not-found' || code === 'storage/bucket-not-found'
        ? 'O armazenamento da foto não foi encontrado.'
        : code === 'storage/retry-limit-exceeded' || code === 'unavailable'
        ? 'Não foi possível concluir a conexão com o Firebase.'
        : 'Não foi possível concluir a foto nesta etapa.';
      Alert.alert('Não foi possível salvar a foto', detalhe + '\nEtapa: ' + etapa + '\nCódigo: ' + code + '\nSua foto anterior foi preservada.');
    }
    finally {
      if (processada) await removeTemporaryImage(processada);
      if (selecionada) await removeTemporaryImage(selecionada);
      setSalvandoFoto(false);
    }
  };
  // Estados para os campos do formulário
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [apelido, setApelido] = useState('');
  const [telefone, setTelefone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const snapshot = await getDoc(doc(db, 'usuarios', user.uid));
        const dados = snapshot.data();
        setNomeCompleto(dados?.nomeCompleto ?? '');
        setApelido(dados?.apelido ?? '');
        setTelefone(formatarTelefoneApoiador(dados?.telefone ?? ''));
        setFotoUrl(dados?.fotoUrl ?? '');
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar seus dados.');
      }
    };
    carregar();
  }, []);

  const handleSalvarAlteracoes = async () => {
    if (!nomeCompleto.trim() || !apelido.trim() || !telefone.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos para salvar.');
      return;
    }

    setIsLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuário não autenticado.');
      await updateDoc(doc(db, 'usuarios', user.uid), {
        nomeCompleto: nomeCompleto.trim(),
        apelido: apelido.trim(),
        telefone: telefone.trim(),
        updatedAt: new Date(),
      });
      setIsLoading(false);
      Alert.alert('Sucesso', 'Dados alterados com sucesso!', [
        { text: 'OK', onPress: () => navigation?.goBack() }
      ]);
    } catch {
      setIsLoading(false);
      Alert.alert('Erro', 'Não foi possível salvar seus dados.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.backButtonText}>&lt;</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>ALTERAR DADOS</Text>
        
        {/* View vazia para manter o título perfeitamente centralizado usando flex */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <TouchableOpacity onPress={escolherFoto} disabled={salvandoFoto || isLoading} accessibilityRole="button" accessibilityLabel="Alterar foto do perfil" style={{ alignItems: 'center', marginBottom: 28 }}>
          <FotoPerfil uri={fotoUrl} size={100} />
          <Text style={{ color: '#E53935', marginTop: 12, fontWeight: 'bold' }}>{salvandoFoto ? 'Salvando foto...' : 'Escolher foto do perfil'}</Text>
          <Text style={{ color: '#AAAAAA', marginTop: 6, textAlign: 'center' }}>Sua foto também aparece em Apoiadores.</Text>
        </TouchableOpacity>
        {/* Nome Completo */}
        <Text style={styles.label}>NOME COMPLETO</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu nome completo"
          placeholderTextColor="#777"
          value={nomeCompleto}
          onChangeText={setNomeCompleto}
        />

        {/* Apelido */}
        <Text style={[styles.label, { marginTop: 20 }]}>APELIDO (ÚNICO)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: piloto_01"
          placeholderTextColor="#777"
          autoCapitalize="none"
          value={apelido}
          onChangeText={setApelido}
        />

        {/* Telefone */}
        <Text style={[styles.label, { marginTop: 20 }]}>TELEFONE / WHATSAPP</Text>
        <TextInput
          style={styles.input}
          placeholder="(045) 999-669-251"
          placeholderTextColor="#777"
          keyboardType="phone-pad"
          value={telefone}
          onChangeText={value => setTelefone(formatarTelefoneApoiador(value))}
        />

        {/* Botão Salvar */}
        <TouchableOpacity 
          style={[styles.btnPrimary, isLoading && styles.btnDisabled]} 
          onPress={handleSalvarAlteracoes}
          disabled={isLoading || salvandoFoto}
        >
          <Text style={styles.btnPrimaryText}>SALVAR ALTERAÇÕES</Text>
        </TouchableOpacity>

        {/* Feedback de Loading */}
        {isLoading && (
          <Text style={styles.loadingText}>Salvando...</Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    height: 64, // Ajustado para manter o padrão das outras telas do app
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    color: '#E53935',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 48, // Mesma largura do botão de voltar para centralizar o título
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  label: {
    color: '#AAAAAA',
    fontSize: 10,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    height: 56,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  btnPrimary: {
    height: 64,
    backgroundColor: '#E53935',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#E53935',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
  },
});

