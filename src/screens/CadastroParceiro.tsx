import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';

import { formatarTelefoneApoiador } from '../utils/telefoneApoiador';
import { CATEGORIAS_PARCEIROS } from '../utils/parceiros';

export function CadastroParceiro({ navigation }: any) {
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [contato, setContato] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipos, setTipos] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const uid = auth.currentUser?.uid;
  const draftKey = uid ? `@motohub/parceiro/rascunho/${uid}` : null;

  useEffect(() => {
    let active = true;
    async function carregar() {
      try {
        if (!draftKey) return;
        const raw = await AsyncStorage.getItem(draftKey);
        if (!active || !raw) return;
        const draft = JSON.parse(raw) ?? {};
        setNome(typeof draft.nome === 'string' ? draft.nome : '');
        setCidade(typeof draft.cidade === 'string' ? draft.cidade : '');
        setUf(typeof draft.uf === 'string' ? draft.uf : '');
        setContato(formatarTelefoneApoiador(typeof draft.contato === 'string' ? draft.contato : ''));

        setDescricao(typeof draft.descricao === 'string' ? draft.descricao : '');
        setTipos(Array.isArray(draft.tipos) ? draft.tipos.filter((tipo: unknown) => CATEGORIAS_PARCEIROS.some(item => item.nome === tipo)) : []);
      } catch {
        if (active) Alert.alert('Rascunho', 'Não foi possível carregar o rascunho neste celular.');
      } finally {
        if (active) setCarregando(false);
      }
    }
    carregar();
    return () => { active = false; };
  }, [draftKey]);

  const toggle = (tipo: string) => setTipos(current => current.includes(tipo) ? current.filter(item => item !== tipo) : [...current, tipo]);
  async function salvar() {
    if (!draftKey || auth.currentUser?.uid !== uid) {
      Alert.alert('Entre na sua conta', 'É necessário estar conectado para salvar seu rascunho.');
      return;
    }
    if (!nome.trim() || !cidade.trim() || !contato.trim() || tipos.length === 0) {
      Alert.alert('Complete o cadastro', 'Informe o nome da empresa, cidade, contato e selecione pelo menos um categoria.');
      return;
    }
    const estados = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
    if (!estados.includes(uf.toUpperCase())) {
      Alert.alert('Confira a UF', 'Informe a sigla do seu estado, por exemplo PR.');
      return;
    }
    setSalvando(true);
    try {
      await AsyncStorage.setItem(draftKey, JSON.stringify({ nome: nome.trim(), cidade: cidade.trim(), uf: uf.toUpperCase(), contato: formatarTelefoneApoiador(contato.trim()), descricao: descricao.trim(), tipos }));
      Alert.alert('Rascunho salvo', 'Seu formulário foi salvo apenas neste celular. Ele ainda não está publicado na rede de Empresas Parceiras.');
    } catch {
      Alert.alert('Não foi possível salvar', 'Tente novamente. Seus campos continuam preenchidos nesta tela.');
    } finally { setSalvando(false); }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Voltar"><MaterialCommunityIcons name="chevron-left" size={30} color="#E53935" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Cadastre sua empresa</Text>
      </View>
      {carregando ? <ActivityIndicator style={{ marginTop: 40 }} color="#E53935" /> : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.intro}><MaterialCommunityIcons name="handshake-outline" size={38} color="#E53935" /><Text style={styles.introTitle}>Faça parte da próxima parada</Text><Text style={styles.muted}>Apresente sua empresa e os serviços que oferece aos motociclistas.</Text></View>
            <Text style={styles.label}>Nome da empresa *</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Nome comercial" placeholderTextColor="#777777" maxLength={80} accessibilityLabel="Nome da empresa" />
            <View style={styles.row}>
              <View style={{ flex: 1 }}><Text style={styles.label}>Cidade *</Text><TextInput style={styles.input} value={cidade} onChangeText={setCidade} placeholder="Sua cidade" placeholderTextColor="#777777" maxLength={80} accessibilityLabel="Cidade" /></View>
              <View style={{ width: 76 }}><Text style={styles.label}>UF *</Text><TextInput style={styles.input} value={uf} onChangeText={value => setUf(value.replace(/[^a-zA-Z]/g, '').toUpperCase())} placeholder="PR" placeholderTextColor="#777777" autoCapitalize="characters" maxLength={2} accessibilityLabel="UF" /></View>
            </View>
            <Text style={styles.label}>Categorias da empresa *</Text>
            <Text style={styles.hint}>Marque todas as categorias da sua empresa.</Text>
            <View style={styles.options}>
              {CATEGORIAS_PARCEIROS.map(item => {
                const checked = tipos.includes(item.nome);
                return <TouchableOpacity key={item.nome} style={[styles.option, checked && styles.optionChecked]} onPress={() => toggle(item.nome)} accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={item.nome}>
                  <MaterialCommunityIcons name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'} size={24} color={checked ? '#E53935' : '#888888'} />
                  <MaterialCommunityIcons name={item.icone} size={24} color="#E53935" /><Text style={styles.optionText}>{item.nome}</Text>
                </TouchableOpacity>;
              })}
            </View>
            <Text style={styles.label}>Contato *</Text>
            <TextInput style={styles.input} value={contato} onChangeText={value => setContato(value.includes('@') ? value : formatarTelefoneApoiador(value))} placeholder="(045) 999-669-251" placeholderTextColor="#777777" autoCapitalize="none" maxLength={120} accessibilityLabel="Telefone de contato" />
            <Text style={styles.label}>Descrição dos serviços</Text>
            <TextInput style={[styles.input, styles.multiline]} value={descricao} onChangeText={setDescricao} placeholder="Conte o que sua empresa oferece, horários e diferenciais para motociclistas." placeholderTextColor="#777777" multiline maxLength={1000} textAlignVertical="top" accessibilityLabel="Descrição dos serviços" />
            <View style={styles.contactCard}><MaterialCommunityIcons name="message-text-outline" size={24} color="#E53935" /><View style={{ flex: 1 }}><Text style={styles.contactTitle}>Atendimento por contato</Text><Text style={styles.muted}>Informe o contato comercial para combinar serviços, horários e atendimento.</Text></View></View>
            <Text style={styles.draftNotice}>Por enquanto, este cadastro é um rascunho salvo neste celular. Seus dados ainda não serão publicados.</Text>
            <TouchableOpacity style={[styles.save, salvando && { opacity: 0.6 }]} onPress={salvar} disabled={salvando} accessibilityRole="button">
              {salvando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Salvar rascunho</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#2C2C2C' },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  body: { padding: 24, paddingBottom: 40 },
  intro: { marginBottom: 8 },
  introTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginTop: 12 },
  muted: { color: '#AAAAAA', fontSize: 14, lineHeight: 21, marginTop: 6 },
  label: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginTop: 20, marginBottom: 8 },
  hint: { color: '#AAAAAA', fontSize: 12, marginBottom: 12 },
  input: { color: '#FFFFFF', backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#444444', borderRadius: 10, minHeight: 52, paddingHorizontal: 14, fontSize: 15 },
  multiline: { minHeight: 120, paddingTop: 14 },
  row: { flexDirection: 'row', gap: 12 },
  options: { gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 10, padding: 14, minHeight: 56, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333333' },
  optionChecked: { borderColor: '#E53935', backgroundColor: '#291919' },
  emoji: { fontSize: 24 },
  optionText: { color: '#FFFFFF', fontSize: 16, flex: 1 },
  contactCard: { marginTop: 24, padding: 16, backgroundColor: '#1A1A1A', borderRadius: 12, flexDirection: 'row', gap: 12 },
  contactTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  draftNotice: { color: '#AAAAAA', fontSize: 12, lineHeight: 18, marginTop: 24 },
  save: { backgroundColor: '#E53935', borderRadius: 10, minHeight: 56, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
