import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export function NovoCadastroUsuario({ navigation }: any) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [loading, setLoading] = useState(false);

  async function cadastrar() {
    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();
    if (!nomeLimpo || !emailLimpo || !senha || !confirmacao) return Alert.alert('Atenção', 'Preencha todos os campos.');
    if (senha.length < 6) return Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
    if (senha !== confirmacao) return Alert.alert('Atenção', 'As senhas não coincidem.');
    if (!aceitouTermos) return Alert.alert('Atenção', 'Aceite os Termos de Uso e a Política de Privacidade.');

    setLoading(true);
    try {
      const credencial = await createUserWithEmailAndPassword(auth, emailLimpo, senha);
      await updateProfile(credencial.user, { displayName: nomeLimpo });
      await setDoc(doc(db, 'usuarios', credencial.user.uid), { nome: nomeLimpo, email: emailLimpo, criadoEm: serverTimestamp() });
    } catch (error: any) {
      Alert.alert('Erro ao cadastrar', error?.message ?? 'Não foi possível criar sua conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹</Text></TouchableOpacity>
            <Text style={styles.title}>CRIAR CONTA</Text><View style={styles.spacer} />
          </View>
          <Text style={styles.label}>NOME</Text>
          <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome" placeholderTextColor="#777" />
          <Text style={styles.label}>E-MAIL</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="seu@email.com" placeholderTextColor="#777" />
          <Text style={styles.label}>SENHA</Text>
          <TextInput style={styles.input} value={senha} onChangeText={setSenha} secureTextEntry placeholder="Mínimo de 6 caracteres" placeholderTextColor="#777" />
          <Text style={styles.label}>CONFIRME A SENHA</Text>
          <TextInput style={styles.input} value={confirmacao} onChangeText={setConfirmacao} secureTextEntry placeholder="Digite a senha novamente" placeholderTextColor="#777" />
          <View style={styles.termsRow}>
            <Switch value={aceitouTermos} onValueChange={setAceitouTermos} trackColor={{ false: '#444', true: '#8E2422' }} thumbColor={aceitouTermos ? '#E53935' : '#AAA'} />
            <Text style={styles.termsText}>Li e aceito os </Text>
            <TouchableOpacity onPress={() => navigation.navigate('DocumentacaoLegal')}><Text style={styles.link}>Termos e a Política de Privacidade</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.button, loading && styles.disabled]} disabled={loading} onPress={cadastrar}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>CADASTRAR</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' }, content: { flexGrow: 1, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 },
  back: { color: '#E53935', fontSize: 40, lineHeight: 40 }, title: { color: '#FFF', fontSize: 16, fontWeight: '700' }, spacer: { width: 24 },
  label: { color: '#AAA', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 18, marginBottom: 8 },
  input: { height: 54, borderRadius: 8, borderWidth: 1, borderColor: '#2C2C2C', backgroundColor: '#1A1A1A', color: '#FFF', paddingHorizontal: 16 },
  termsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 24 }, termsText: { color: '#AAA', marginLeft: 8 },
  link: { color: '#E53935', fontWeight: '600' }, button: { height: 60, borderRadius: 8, backgroundColor: '#E53935', alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  disabled: { opacity: 0.6 }, buttonText: { color: '#FFF', fontWeight: '700' },
});
