import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { InicioVisitante } from '../screens/InicioVisitante';
import Login from '../screens/Login';
import { NovoCadastroUsuario } from '../screens/NovoCadastroUsuario';
import { DocumentacaoLegal } from '../screens/DocumentacaoLegal';

const Stack = createNativeStackNavigator();

export function AuthRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InicioVisitante" component={InicioVisitante} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="NovoCadastroUsuario" component={NovoCadastroUsuario} />
      <Stack.Screen name="DocumentacaoLegal" component={DocumentacaoLegal} />
    </Stack.Navigator>
  );
}
