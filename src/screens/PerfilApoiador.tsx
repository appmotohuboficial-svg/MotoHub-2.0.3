import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { FotoPerfil } from '../components/FotoPerfil';
import { Apoiador, TIPOS_APOIO, linksContato } from '../utils/apoiadores';

export function PerfilApoiador({ route, navigation }: any) {
  const id = route.params?.apoiadorId;
  const [apoiador, setApoiador] = useState<Apoiador | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  useFocusEffect(useCallback(() => {
    setLoading(true); setErro(false); setApoiador(null);
    if (!id || !auth.currentUser) { setLoading(false); setErro(true); return; }
    return onSnapshot(doc(db, 'apoiadores', id), snapshot => {
      setApoiador(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as Apoiador : null);
      setLoading(false);
    }, () => { setApoiador(null); setLoading(false); setErro(true); });
  }, [id, tentativa]));
  const abrir = (url: string) => Linking.openURL(url).catch(() => Alert.alert('Contato', 'Não foi possível abrir o contato neste celular. Você pode usar o contato exibido no perfil.'));
  const links = apoiador ? linksContato(apoiador.contato) : {};
  return <SafeAreaView style={styles.container}>
    <View style={styles.header}><TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Voltar"><MaterialCommunityIcons name="chevron-left" size={30} color="#E53935" /></TouchableOpacity><Text style={styles.title}>Perfil do Apoiador</Text></View>
    {loading ? <ActivityIndicator color="#E53935" style={{ marginTop: 40 }} /> : erro ? <View style={styles.body}><Text style={styles.text}>Não foi possível carregar este apoiador.</Text><TouchableOpacity style={styles.button} onPress={() => setTentativa(value => value + 1)}><Text style={styles.buttonText}>Tentar novamente</Text></TouchableOpacity></View> : !apoiador ? <Text style={[styles.text, { padding: 24 }]}>Este cadastro não está mais disponível.</Text> :
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}><FotoPerfil uri={apoiador.fotoUrl} size={96} /><Text style={styles.name}>{apoiador.nome}</Text><Text style={styles.text}>📍 {apoiador.cidade} – {apoiador.uf}</Text></View>
        <Text style={styles.section}>APOIOS OFERECIDOS</Text>
        {apoiador.tipos.map(tipo => <View key={tipo} style={styles.option}><Text style={styles.text}>{TIPOS_APOIO.find(item => item.nome === tipo)?.emoji}  {tipo}</Text></View>)}
        {!!apoiador.descricao && <><Text style={styles.section}>DESCRIÇÃO E CONDIÇÕES</Text><Text style={styles.text}>{apoiador.descricao}</Text></>}
        <Text style={styles.section}>CONTATO</Text><Text selectable style={styles.text}>{apoiador.contato}</Text>
        <Text style={styles.note}>Combine diretamente os horários, as condições e a disponibilidade antes de ir até o local.</Text>
        {links.whatsapp && <TouchableOpacity style={styles.button} onPress={() => abrir(links.whatsapp!)} accessibilityRole="button"><Text style={styles.buttonText}>Conversar pelo WhatsApp</Text></TouchableOpacity>}
        {links.telefone && <TouchableOpacity style={styles.outline} onPress={() => abrir(links.telefone!)} accessibilityRole="button"><Text style={styles.buttonText}>Ligar</Text></TouchableOpacity>}
        {links.email && <TouchableOpacity style={styles.button} onPress={() => abrir(links.email!)} accessibilityRole="button"><Text style={styles.buttonText}>Enviar e-mail</Text></TouchableOpacity>}
        {apoiador.userId === auth.currentUser?.uid && <TouchableOpacity style={styles.outline} onPress={() => navigation.navigate('CadastroApoiador')} accessibilityRole="button"><Text style={styles.buttonText}>Editar meu cadastro</Text></TouchableOpacity>}
      </ScrollView>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' }, header: { flexDirection: 'row', padding: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333333' }, back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }, title: { color: '#FFFFFF', fontSize: 21, fontWeight: 'bold', flex: 1 },
  body: { padding: 24, paddingBottom: 40 }, card: { padding: 24, borderRadius: 16, backgroundColor: '#1A1A1A', alignItems: 'center', gap: 10 }, name: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' }, text: { color: '#DDDDDD', fontSize: 16, lineHeight: 24 }, section: { color: '#E53935', fontSize: 13, fontWeight: 'bold', marginTop: 28, marginBottom: 14 }, option: { padding: 14, backgroundColor: '#1A1A1A', borderRadius: 10, marginBottom: 10 }, note: { color: '#AAAAAA', fontSize: 14, lineHeight: 21, marginVertical: 20 }, button: { backgroundColor: '#E53935', minHeight: 56, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 12 }, buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' }, outline: { borderWidth: 1, borderColor: '#555555', minHeight: 56, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
});
