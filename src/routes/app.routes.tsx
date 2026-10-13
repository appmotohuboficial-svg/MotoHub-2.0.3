import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeLogada from '../screens/HomeLogada';
import { Garagem } from '../screens/Garagem';
import { NovoCadastroMotos } from '../screens/NovoCadastroMotos';
import { PerfilDaMoto } from '../screens/PerfilDaMoto';
import { Manutencao } from '../screens/Manutencao';
import { FormularioManutencao } from '../screens/FormularioManutencao';
import { RegistrarAbastecimento } from '../screens/RegistrarAbastecimento';
import { Viagens } from '../screens/Viagens';
import { NovaViagem } from '../screens/NovaViagem';
import { ResumoRoteiro } from '../screens/ResumoRoteiro';
import { Eventos } from '../screens/Eventos';
import { NovoEvento } from '../screens/NovoEvento';
import { Perfil } from '../screens/Perfil';
import { EditarPerfil } from '../screens/EditarPerfil';
import { DocumentacaoLegal } from '../screens/DocumentacaoLegal';
import { CadastroParceiro } from '../screens/CadastroParceiro';
import { Parceiros } from '../screens/Parceiros';
import { DadosTecnicos } from '../screens/DadosTecnicos';
import { DetalhesEvento } from '../screens/DetalhesEvento';
import { DetalhesViagem } from '../screens/DetalhesViagem';

import { PerfilApoiador } from '../screens/PerfilApoiador';
import { CadastroApoiador } from '../screens/CadastroApoiador';
import { Apoiadores } from '../screens/Apoiadores';
import { Motoclubes } from '../screens/Motoclubes';

const Stack = createNativeStackNavigator();

export function AppRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeLogada" component={HomeLogada} />
      <Stack.Screen name="PerfilApoiador" component={PerfilApoiador} />
      <Stack.Screen name="CadastroApoiador" component={CadastroApoiador} />
      <Stack.Screen name="Apoiadores" component={Apoiadores} />
      <Stack.Screen name="Motoclubes" component={Motoclubes} />
      <Stack.Screen name="Garagem" component={Garagem} />
      <Stack.Screen name="NovoCadastroMotos" component={NovoCadastroMotos} />
      <Stack.Screen name="PerfilDaMoto" component={PerfilDaMoto} />
      <Stack.Screen name="Manutencao" component={Manutencao} />
      <Stack.Screen name="FormularioManutencao" component={FormularioManutencao} />
      <Stack.Screen name="RegistrarAbastecimento" component={RegistrarAbastecimento} />
      <Stack.Screen name="Viagens" component={Viagens} />
      <Stack.Screen name="NovaViagem" component={NovaViagem} />
      <Stack.Screen name="ResumoRoteiro" component={ResumoRoteiro} />
      <Stack.Screen name="Eventos" component={Eventos} />
      <Stack.Screen name="NovoEvento" component={NovoEvento} />
      <Stack.Screen name="Perfil" component={Perfil} />
      <Stack.Screen name="EditarPerfil" component={EditarPerfil} />
      <Stack.Screen name="DocumentacaoLegal" component={DocumentacaoLegal} />
      <Stack.Screen name="CadastroParceiro" component={CadastroParceiro} />
      <Stack.Screen name="Parceiros" component={Parceiros} />
      <Stack.Screen name="DadosTecnicos" component={DadosTecnicos} />
      <Stack.Screen name="DetalhesEvento" component={DetalhesEvento} />
      <Stack.Screen name="DetalhesViagem" component={DetalhesViagem} />
    </Stack.Navigator>
  );
}
