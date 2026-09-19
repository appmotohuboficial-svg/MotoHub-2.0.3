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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export function EditarPerfil({ navigation }: any) {
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
        setTelefone(dados?.telefone ?? '');
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
          placeholder="(00) 00000-0000"
          placeholderTextColor="#777"
          keyboardType="phone-pad"
          value={telefone}
          onChangeText={setTelefone}
        />

        {/* Botão Salvar */}
        <TouchableOpacity 
          style={[styles.btnPrimary, isLoading && styles.btnDisabled]} 
          onPress={handleSalvarAlteracoes}
          disabled={isLoading}
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
