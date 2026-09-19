import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { uploadLocalImage } from '../services/imageUpload';
import { useTemporaryImage } from '../hooks/useTemporaryImage';
import { removeTemporaryImage } from '../services/temporaryImages';

export function NovoCadastroMotos({ navigation, route }: any) {
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [apelido, setApelido] = useState('');
  const [ano, setAno] = useState('');
  const [hodometro, setHodometro] = useState('');
  const [fotoUri, setFotoUri] = useTemporaryImage();

  // Captura os dados técnicos vindos da tela DadosTecnicos (se existirem)
  const dadosTecnicosRecebidos = route?.params?.dadosTecnicos || {};

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar sua galeria!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;

      let processedUri: string | undefined;
      try {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          selectedUri,
          [{ resize: { width: 120, height: 120 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        processedUri = manipulatedImage.uri;
        setFotoUri(manipulatedImage.uri);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível processar a imagem.');
      } finally {
        if (selectedUri !== processedUri) await removeTemporaryImage(selectedUri);
      }
    }
  };

  const handleSalvar = async () => {
    if (!marca || !modelo || !hodometro) {
      Alert.alert('Atenção', 'Preencha ao menos Marca, Modelo e KM Atual.');
      return;
    }

    const hodometroNumero = Number(hodometro.replace(',', '.'));
    if (!Number.isFinite(hodometroNumero) || hodometroNumero < 0) {
      Alert.alert('KM inválida', 'Informe uma quilometragem válida.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Erro', 'Você precisa estar logado para cadastrar uma moto.');
        return;
      }

      const fotoUrl = fotoUri
        ? await uploadLocalImage(fotoUri, `usuarios/${user.uid}/motos/${Date.now()}.jpg`)
        : '';

      // Gravação real no Cloud Firestore (agora unindo os dados básicos e técnicos)
      await addDoc(collection(db, 'motos'), {
        userId: user.uid,
        marca,
        modelo,
        apelido,
        ano,
        hodometro: hodometroNumero,
        fotoUri: fotoUrl,
        ...dadosTecnicosRecebidos, // <- Aqui os dados técnicos entram no banco de dados
        createdAt: new Date(),
      });

      Alert.alert('Sucesso', 'Moto salva na garagem!', [
        { text: 'OK', onPress: () => navigation?.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível salvar a moto: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* KeyboardAvoidingView adicionado para fazer a tela subir quando o teclado abrir */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#121212" />

        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Nova Moto</Text>
              <View style={styles.redLine} />
              <Text style={styles.subtitle}>Adicione à sua coleção</Text>
            </View>

            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation?.goBack()}
            >
              <Text style={styles.backButtonText}>&lt;</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoContainer} onPress={handlePickImage}>
              {fotoUri ? (
                <Image source={{ uri: fotoUri }} style={styles.motoPhoto} />
              ) : (
                <Image source={require('../../assets/MotoCadMoto.webp')} style={styles.defaultIcon} resizeMode="contain" />
              )}
              <View style={styles.cameraBadge}>
                <MaterialCommunityIcons name="camera" size={16} color="#FFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.photoLabel}>Toque para adicionar foto da moto</Text>
          </View>

          <Text style={styles.sectionTitle}>DADOS BÁSICOS</Text>

          <TextInput
            style={styles.input}
            placeholder="Marca (Ex: Honda, Yamaha...)"
            placeholderTextColor="#777"
            value={marca}
            onChangeText={setMarca}
          />

          <TextInput
            style={styles.input}
            placeholder="Modelo (Ex: CB 500X, MT-07...)"
            placeholderTextColor="#777"
            value={modelo}
            onChangeText={setModelo}
          />

          <TextInput
            style={styles.input}
            placeholder="Apelido da moto (Opcional)"
            placeholderTextColor="#777"
            value={apelido}
            onChangeText={setApelido}
          />

          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Ano"
              placeholderTextColor="#777"
              keyboardType="numeric"
              value={ano}
              onChangeText={setAno}
            />

            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="KM Atual"
              placeholderTextColor="#777"
              keyboardType="numeric"
              value={hodometro}
              onChangeText={setHodometro}
            />
          </View>

          <TouchableOpacity 
               style={styles.btnOutline} 
               onPress={() => navigation.navigate('DadosTecnicos')}
          >
              <MaterialCommunityIcons name="tools" size={18} color="#E53935" style={{ marginRight: 8 }} />
              <Text style={styles.btnOutlineText}>
                {Object.keys(dadosTecnicosRecebidos).length > 0 ? 'Dados Técnicos Preenchidos ✓' : 'Preencher Dados Técnicos'}
              </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleSalvar}>
            <Text style={styles.btnPrimaryText}>SALVAR NA GARAGEM</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    height: 140,
    backgroundColor: '#1A1A1A',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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
    marginVertical: 8,
  },
  subtitle: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#E53935',
    fontSize: 32,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  motoPhoto: {
    width: '100%',
    height: '100%',
  },
  defaultIcon: {
    width: 60,
    height: 60,
    opacity: 0.8,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#E53935',
    padding: 6,
    borderRadius: 12,
  },
  photoLabel: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    height: 56,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  btnOutline: {
    flexDirection: 'row',
    height: 56,
    borderWidth: 1,
    borderColor: '#E53935',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'transparent',
  },
  btnOutlineText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  btnPrimary: {
    height: 64,
    backgroundColor: '#E53935',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
