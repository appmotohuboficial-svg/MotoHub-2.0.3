import { SafeAreaProvider } from 'react-native-safe-area-context';
import  Routes  from './src/routes'; // ou onde ficam suas rotas

export default function App() {
  return (
    <SafeAreaProvider>
      <Routes />
    </SafeAreaProvider>
  );
}