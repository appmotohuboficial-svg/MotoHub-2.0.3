import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { formatarTelefoneApoiador } from '../utils/telefoneApoiador';
import { buscarMeuApoiador, salvarMeuApoiador } from '../services/apoiadores';
import { TIPOS_APOIO, validarApoiador, DadosApoiador } from '../utils/apoiadores';

export function CadastroApoiador({ navigation }: any) {
  const [publicado, setPublicado] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const saveLock = useRef(false);
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [contato, setContato] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipos, setTipos] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    let active = true;
    setCarregando(true); setErroCarregamento(false);
    async function carregar() {
      try {
        if (!uid) throw new Error('Entre na sua conta.');
        const [profileResult, apoiadorResult] = await Promise.allSettled([
          getDoc(doc(db, 'usuarios', uid)), buscarMeuApoiador(),
        ]);
        if (!active || auth.currentUser?.uid !== uid) return;
        if (apoiadorResult.status === 'rejected') throw apoiadorResult.reason;
        const remoto = apoiadorResult.value;
        setPublicado(!!remoto);
        const cadastro: Partial<DadosApoiador> = remoto ?? {};
        const perfil = profileResult.status === 'fulfilled' ? profileResult.value.data() ?? {} : {};
        if (profileResult.status === 'rejected') {
          Alert.alert('Perfil', 'Não foi possível preencher os dados do perfil. Você pode preenchê-los manualmente.');
        }
        const texto = (...values: unknown[]) => values.find(value => typeof value === 'string' && value.trim()) as string | undefined;
        setNome(texto(cadastro.nome, perfil.apelido, perfil.nomeCompleto, perfil.nome, auth.currentUser?.displayName) ?? '');
        setCidade(texto(cadastro.cidade, perfil.cidade) ?? '');
        setUf((texto(cadastro.uf, perfil.uf, perfil.estado) ?? '').toUpperCase());
        setContato(formatarTelefoneApoiador(texto(cadastro.contato, perfil.telefone) ?? ''));

        setDescricao(typeof cadastro.descricao === 'string' ? cadastro.descricao : '');
        setTipos(Array.isArray(cadastro.tipos) ? cadastro.tipos.filter((tipo: unknown) => TIPOS_APOIO.some(item => item.nome === tipo)) : []);
      } catch {
        if (active) { setErroCarregamento(true); Alert.alert('Cadastro', 'Não foi possível carregar seu cadastro na conta. Saia desta tela e abra novamente para tentar carregar.'); }
      } finally {
        if (active) setCarregando(false);
      }
    }
    carregar();
    return () => { active = false; };
  }, [uid]);

  const toggle = (tipo: string) => setTipos(current => current.includes(tipo) ? current.filter(item => item !== tipo) : [...current, tipo]);
  const dadosFormulario = () => ({ nome: nome.trim(), cidade: cidade.trim(), uf: uf.toUpperCase(), contato: formatarTelefoneApoiador(contato.trim()), descricao: descricao.trim(), tipos });
  async function salvar() {
    if (saveLock.current) return;
    if (!uid || auth.currentUser?.uid !== uid) { Alert.alert('Entre na sua conta', 'É necessário estar conectado para salvar.'); return; }
    if (erroCarregamento) { Alert.alert('Cadastro', 'Carregue seu cadastro novamente antes de salvar.'); return; }
    const dados = dadosFormulario();
    const erro = validarApoiador(dados);
    if (erro) { Alert.alert('Confira os dados', erro); return; }
    saveLock.current = true; setSalvando(true);
    try {
      await salvarMeuApoiador(dados);
      setPublicado(true);
      Alert.alert('Cadastro salvo na conta', 'Seu perfil está disponível na rede de Apoiadores.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Não foi possível salvar', 'Confira sua conexão e tente novamente. Seus dados continuam preenchidos.');
    } finally { saveLock.current = false; setSalvando(false); }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Voltar"><MaterialCommunityIcons name="chevron-left" size={30} color="#E53935" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{publicado ? 'Meu cadastro de Apoiador' : 'Torne-se um Apoiador'}</Text>
      </View>
      {carregando ? <ActivityIndicator style={{ marginTop: 40 }} color="#E53935" /> : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <View style={styles.intro}><MaterialCommunityIcons name="handshake-outline" size={38} color="#E53935" /><Text style={styles.introTitle}>Sua ajuda faz a diferença</Text><Text style={styles.muted}>Conte como você pode apoiar outros motociclistas.</Text></View>
            <Text style={styles.label}>Nome de apresentação *</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Como quer ser chamado" placeholderTextColor="#777777" maxLength={80} accessibilityLabel="Nome de apresentação" />
            <View style={styles.row}>
              <View style={{ flex: 1 }}><Text style={styles.label}>Cidade *</Text><TextInput style={styles.input} value={cidade} onChangeText={setCidade} placeholder="Sua cidade" placeholderTextColor="#777777" maxLength={80} accessibilityLabel="Cidade" /></View>
              <View style={{ width: 76 }}><Text style={styles.label}>UF *</Text><TextInput style={styles.input} value={uf} onChangeText={value => setUf(value.replace(/[^a-zA-Z]/g, '').toUpperCase())} placeholder="PR" placeholderTextColor="#777777" autoCapitalize="characters" maxLength={2} accessibilityLabel="UF" /></View>
            </View>
            <Text style={styles.label}>Tipos de apoio *</Text>
            <Text style={styles.hint}>Marque todas as opções que você pode oferecer.</Text>
            <View style={styles.options}>
              {TIPOS_APOIO.map(item => {
                const checked = tipos.includes(item.nome);
                return <TouchableOpacity key={item.nome} style={[styles.option, checked && styles.optionChecked]} onPress={() => toggle(item.nome)} accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={item.nome}>
                  <MaterialCommunityIcons name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'} size={24} color={checked ? '#E53935' : '#888888'} />
                  <Text style={styles.emoji}>{item.emoji}</Text><Text style={styles.optionText}>{item.nome}</Text>
                </TouchableOpacity>;
              })}
            </View>
            <Text style={styles.label}>Contato *</Text>
            <TextInput style={styles.input} value={contato} onChangeText={value => setContato(value.includes('@') ? value : formatarTelefoneApoiador(value))} placeholder="(045) 999-669-251" placeholderTextColor="#777777" autoCapitalize="none" maxLength={120} accessibilityLabel="Telefone de contato" />
            <Text style={styles.label}>Descrição e condições do apoio</Text>
            <TextInput style={[styles.input, styles.multiline]} value={descricao} onChangeText={setDescricao} placeholder="Ex.: espaço para uma moto. Combine o horário antes de chegar." placeholderTextColor="#777777" multiline maxLength={1000} textAlignVertical="top" accessibilityLabel="Descrição e condições do apoio" />
            <View style={styles.contactCard}><MaterialCommunityIcons name="message-text-outline" size={24} color="#E53935" /><View style={{ flex: 1 }}><Text style={styles.contactTitle}>Disponibilidade por contato</Text><Text style={styles.muted}>Combine diretamente os horários, as condições e a disponibilidade antes de ir até o local.</Text></View></View>
            <TouchableOpacity style={[styles.save, salvando && { opacity: 0.6 }]} onPress={salvar} disabled={salvando || erroCarregamento} accessibilityRole="button">
              {salvando ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>{publicado ? 'Salvar alterações' : 'Salvar cadastro'}</Text>}
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
  save: { backgroundColor: '#E53935', borderRadius: 10, minHeight: 56, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
