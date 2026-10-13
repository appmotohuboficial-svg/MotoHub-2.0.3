import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ImageBackground, TextInput, Modal, useWindowDimensions, Alert, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomNav } from '../components/BottomNav';
import { BottomSheetMenu } from '../components/BottomSheetMenu';
import { CATEGORIAS_PARCEIROS } from '../utils/parceiros';

export function Parceiros({ navigation }: any) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [cidadeEdit, setCidadeEdit] = useState('');
  const [ufEdit, setUfEdit] = useState('');
  const [locationVisible, setLocationVisible] = useState(false);
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const singleColumn = width < 360 || fontScale > 1.2;
  function editarLocal() { setCidadeEdit(cidade); setUfEdit(uf); setLocationVisible(true); }
  function aplicarLocal() {
    const estados = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
    if (!cidadeEdit.trim() || !estados.includes(ufEdit.toUpperCase())) { Alert.alert('Localização', 'Informe a cidade e uma UF válida.'); return; }
    setCidade(cidadeEdit.trim()); setUf(ufEdit.toUpperCase()); setLocationVisible(false);
  }
  const falarComEquipe = () => Linking.openURL('mailto:contato@motohub.com?subject=Interesse%20em%20Parceria%20-%20MotoHub').catch(() => Alert.alert('Contato', 'Não foi possível abrir o aplicativo de e-mail.'));
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        <ImageBackground source={require('../../assets/banner.webp')} style={styles.banner}>
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Voltar"><MaterialCommunityIcons name="chevron-left" size={30} color="#E53935" /></TouchableOpacity>
            <Text style={styles.title}>Empresas Parceiras</Text><View style={styles.redLine} /><Text style={styles.subtitle}>Encontre serviços e lugares para sua próxima parada.</Text>
          </View>
        </ImageBackground>
        <View style={styles.body}>
          <View style={styles.search}><MaterialCommunityIcons name="magnify" size={26} color="#AAAAAA" /><TextInput style={styles.searchInput} value={busca} onChangeText={setBusca} placeholder="Buscar empresa, serviço ou lugar" placeholderTextColor="#888888" accessibilityLabel="Buscar empresas parceiras" /></View>
          <TouchableOpacity style={styles.location} onPress={editarLocal} accessibilityRole="button"><MaterialCommunityIcons name="map-marker-outline" size={22} color="#E53935" /><Text style={styles.locationText}>{cidade ? `${cidade} – ${uf}` : 'Escolha uma cidade'}</Text><Text style={styles.redText}>{cidade ? 'Alterar' : 'Selecionar'}</Text></TouchableOpacity>
          <Text style={styles.sectionTitle}>Categorias</Text>
          <View style={styles.grid}>
            {CATEGORIAS_PARCEIROS.map(item => {
              const selected = categoria === item.nome;
              return <TouchableOpacity key={item.nome} style={[styles.category, { width: singleColumn ? '100%' : '48.5%' }, selected && styles.selected]} onPress={() => setCategoria(selected ? null : item.nome)} accessibilityRole="button" accessibilityState={{ selected }}>
                <MaterialCommunityIcons name={item.icone} size={32} color="#E53935" />
                <Text style={styles.categoryTitle}>{item.nome}</Text><Text style={styles.categoryDescription}>{item.descricao}</Text>
                <MaterialCommunityIcons name={selected ? 'check-circle-outline' : 'chevron-right'} size={20} color={selected ? '#E53935' : '#AAAAAA'} style={styles.categoryArrow} />
              </TouchableOpacity>;
            })}
          </View>
          <View style={styles.sectionRow}><Text style={[styles.sectionTitle, { flex: 1 }]}>{categoria || busca.trim() || cidade ? 'Resultados' : 'Parceiros em destaque'}</Text><TouchableOpacity onPress={() => { setBusca(''); setCategoria(null); setCidade(''); setUf(''); }} accessibilityRole="button"><Text style={styles.redText}>Ver todos</Text></TouchableOpacity></View>
          {(categoria || busca.trim() || cidade) && <View style={styles.filterSummary}><Text style={styles.muted}>{[categoria, busca.trim() ? `Busca: ${busca.trim()}` : '', cidade ? `${cidade} – ${uf}` : ''].filter(Boolean).join(' · ')}</Text></View>}
          <View style={styles.empty}><MaterialCommunityIcons name="storefront-outline" size={46} color="#E53935" /><Text style={styles.emptyTitle}>Sua próxima parada começa aqui</Text><Text style={styles.emptyText}>Os parceiros aparecerão aqui quando os cadastros estiverem publicados.</Text><Text style={styles.small}>Estamos preparando a rede de Empresas Parceiras.</Text></View>
          <TouchableOpacity style={styles.register} onPress={() => navigation.navigate('CadastroParceiro')} accessibilityRole="button"><Text style={styles.registerText}>Seja uma Empresa Parceira</Text><MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFF" /></TouchableOpacity>
          <TouchableOpacity style={styles.contact} onPress={falarComEquipe} accessibilityRole="button"><Text style={styles.muted}>Falar com a Equipe</Text></TouchableOpacity>
        </View>
      </ScrollView>
      <BottomNav state={{ routes: [{ name: 'Parceiros' }], index: 0 }} navigation={navigation} onPressFab={() => setMenuVisible(true)} />
      <BottomSheetMenu visible={menuVisible} onClose={() => setMenuVisible(false)} onSelectNovaManutencao={() => navigation.navigate('Manutencao')} onSelectNovoEvento={() => navigation.navigate('Eventos')} onSelectNovaViagem={() => navigation.navigate('Viagens')} />
      <Modal visible={locationVisible} transparent animationType="fade" onRequestClose={() => setLocationVisible(false)}>
        <View style={styles.scrim}><View style={styles.modal}>
          <Text style={styles.emptyTitle}>Onde você quer encontrar parceiros?</Text>
          <Text style={styles.muted}>Escolha sua cidade ou o destino do passeio.</Text>
          <TextInput style={styles.input} value={cidadeEdit} onChangeText={setCidadeEdit} placeholder="Cidade" placeholderTextColor="#888888" maxLength={80} accessibilityLabel="Cidade" />
          <TextInput style={styles.input} value={ufEdit} onChangeText={value => setUfEdit(value.replace(/[^a-zA-Z]/g, '').toUpperCase())} placeholder="UF" placeholderTextColor="#888888" maxLength={2} autoCapitalize="characters" accessibilityLabel="UF" />
          <TouchableOpacity style={styles.register} onPress={aplicarLocal} accessibilityRole="button"><Text style={styles.registerText}>Aplicar localização</Text></TouchableOpacity>
          <TouchableOpacity style={styles.contact} onPress={() => setLocationVisible(false)} accessibilityRole="button"><Text style={styles.muted}>Cancelar</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' }, banner: { minHeight: 240 },
  overlay: { flex: 1, padding: 24, paddingTop: 80, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  back: { position: 'absolute', top: 12, left: 12, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900' }, redLine: { width: 32, height: 3, backgroundColor: '#E53935', marginTop: 8 },
  subtitle: { color: '#CCCCCC', fontSize: 15, lineHeight: 22, marginTop: 8 }, body: { padding: 16, gap: 16 },
  search: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#444444', borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  searchInput: { minHeight: 56, color: '#FFFFFF', flex: 1, fontSize: 14, marginLeft: 10 },
  location: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 }, locationText: { color: '#CCCCCC', fontSize: 14, flex: 1 }, redText: { color: '#E53935', fontSize: 14, fontWeight: 'bold' },
  sectionTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' }, grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  category: { backgroundColor: '#1A1A1A', borderRadius: 14, borderWidth: 1, borderColor: '#333333', padding: 14, minHeight: 144 }, selected: { borderColor: '#E53935', backgroundColor: '#291919' },
  categoryTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', marginTop: 10, paddingRight: 12 }, categoryDescription: { color: '#AAAAAA', fontSize: 12, lineHeight: 18, marginTop: 6, paddingRight: 10 },
  categoryArrow: { position: 'absolute', right: 8, top: 20 }, sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  filterSummary: { backgroundColor: '#252525', padding: 12, borderRadius: 8 },
  empty: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#333333' }, emptyTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginTop: 12 },
  emptyText: { color: '#AAAAAA', fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 12 }, small: { color: '#888888', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 12 }, muted: { color: '#AAAAAA', fontSize: 14, lineHeight: 21 },
  register: { backgroundColor: '#E53935', minHeight: 58, borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }, registerText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', flexShrink: 1 },
  contact: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, scrim: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.75)' }, modal: { backgroundColor: '#1A1A1A', padding: 20, borderRadius: 16, gap: 16 },
  input: { minHeight: 52, borderRadius: 10, borderWidth: 1, borderColor: '#444444', paddingHorizontal: 14, color: '#FFFFFF', fontSize: 15 },
});
