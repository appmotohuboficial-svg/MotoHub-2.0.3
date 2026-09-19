import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';// import { auth } from '../services/firebase';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para o Alerta Customizado
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertCallback, setAlertCallback] = useState<(() => void) | null>(null);

  const showAlert = (title: string, message: string, callback?: () => void) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertCallback(() => callback || null);
    setAlertVisible(true);
  };

  const handleLogin = async () => {
    if (!email || !senha) {
      showAlert('Atenção', 'Preencha o seu e-mail e a senha.');
      return;
    }

    setLoading(true);
    try {

      //INTEGRAÇÃO COM FIREBASE AUTH:
      await signInWithEmailAndPassword(auth, email.trim(), senha);


      // Simulação para navegação imediata:
      setLoading(false);
      // Removido o navigation.replace() pois o index.tsx faz a troca de rotas automaticamente!

    } catch (error: any) {
      setLoading(false);
      showAlert('Erro ao Entrar', error.message || 'E-mail ou senha incorretos.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.backButtonText}>&lt;</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ENTRAR</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>E-MAIL</Text>
        <TextInput
          style={styles.input}
          placeholder="seu@email.com"
          placeholderTextColor="#777"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={[styles.label, { marginTop: 20 }]}>SENHA</Text>
        <TextInput
          style={styles.input}
          placeholder="Sua senha"
          placeholderTextColor="#777"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.btnPrimaryText}>ENTRAR</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de Alerta Customizado (Padrão MotoHub) */}
      <Modal
        visible={alertVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAlertVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>{alertTitle}</Text>
            <Text style={styles.alertMessage}>{alertMessage}</Text>

            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => {
                setAlertVisible(false);
                if (alertCallback) alertCallback();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2C' },
  backButton: { width: 48, height: 48, justifyContent: 'center', alignItems: 'flex-start' },
  backButtonText: { color: '#E53935', fontSize: 28, fontWeight: 'bold' },
  headerTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  formContainer: { padding: 24, flex: 1, justifyContent: 'center' },
  label: { color: '#AAAAAA', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  input: { backgroundColor: '#1A1A1A', borderRadius: 8, height: 56, paddingHorizontal: 16, color: '#FFFFFF', fontSize: 14, marginTop: 8, borderWidth: 1, borderColor: '#2C2C2C' },
  btnPrimary: { height: 64, backgroundColor: '#E53935', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertCard: {
    width: '100%',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  alertTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  alertMessage: {
    color: '#AAAAAA',
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  alertButton: {
    height: 48,
    backgroundColor: '#E53935',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});