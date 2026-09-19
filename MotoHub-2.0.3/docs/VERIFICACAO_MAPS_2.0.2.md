# Verificação do MotoHub 2.0.2 — 13/09/2026

## Resultado da leitura do projeto

- Ícone: app.json aponta para assets/icon-motohub.png no app/Android e para assets/icon-motohub-foreground.png no ícone adaptativo. As duas imagens são PNG de 1024 × 1024 e foram inspecionadas visualmente: são a marca MotoHub. Não existe pasta android nesta cópia com recursos nativos antigos. É necessário gerar e instalar outro APK/AAB para confirmar o ícone do launcher. Não foi possível determinar a causa na 2.0.1 sem seu binário.
- Início visitante: filtra eventos ativos, ordena por data/hora de início crescente e só depois seleciona os cinco primeiros. Datas brasileiras são convertidas para datas reais; ausentes/inválidas ficam no fim. Eventos em andamento também podem aparecer.
- Nova Viagem: já possui até três pontos intermediários, com parada/passagem, remoção e mudança de ordem. O botão foi renomeado para MAIS DESTINOS, com explicação do limite. Origem + até três intermediários + destino final entram no cálculo, no salvamento e no link externo.
- Traçar rota: abre ResumoRoteiro, calcula a geometria, desenha a linha azul, marca os locais e enquadra o mapa. Há tela cheia e reabertura da rota salva. Android usa Google Maps; o cálculo é feito por Nominatim/OSRM, não pela API de rotas do Google.

## O que falta confirmar na chave

GOOGLE_MAPS_API_KEY não estava definida no processo local e não havia arquivo .env nesta pasta. A configuração remota do EAS e as restrições no Google Cloud não foram acessadas, portanto não estão validadas. A chave Firebase de google-services.json não é automaticamente usada pelo componente de mapa.

app.config.js já lê GOOGLE_MAPS_API_KEY e a passa para androidGoogleMapsApiKey do plugin react-native-maps. Não é preciso colar a chave no código. Sem ela, o APK oferece Google Maps externo, mas não monta o mapa interno. Uma chave presente, porém inválida/restrita incorretamente, ainda pode deixar o mapa vazio.

## Configurar para APK e Play Store

1. Abra o Google Cloud Console, selecione o projeto desejado, configure o faturamento exigido pelo Google Maps Platform e habilite **Maps SDK for Android**.
2. Em APIs e serviços → Credenciais, crie ou selecione uma chave. Em restrições de aplicativo, escolha **Aplicativos Android**. Cadastre o pacote **br.com.fotosemoto.motohub** e o SHA-1 do certificado que assina o aplicativo instalado.
3. Para o APK de teste, consulte o certificado usado pelo build em Expo/EAS → projeto MotoHub → Credentials → pacote Android → Android Keystore. Para instalação pela Play Store, use o SHA-1 de **certificado da chave de assinatura do app** em Play Console → Integridade do app → Assinatura do app. O certificado de upload pode ser diferente; cadastre uma entrada pacote/SHA-1 para cada assinatura necessária.
4. Em restrições de API, permita **Maps SDK for Android**. O código atual não precisa habilitar Directions API, Routes API ou Geocoding API do Google.
5. No painel Expo/EAS, abra o projeto MotoHub, ID **e267f3ef-3f9e-4361-9948-65896fe30c02**, e suas Environment variables. Crie uma variável do tipo string chamada **GOOGLE_MAPS_API_KEY**, cole seu valor ali, selecione ambiente **production** e visibilidade **Sensitive**. Essa visibilidade permite a resolução de app.config.js pelo EAS CLI; valores Secret não ficam disponíveis fora dos servidores EAS. A chave acaba no binário Android: as restrições de pacote, SHA-1 e API são a proteção efetiva.
6. Os perfis preview e production em eas.json agora declaram explicitamente o ambiente production. Depois de configurar a variável, execute os comandos abaixo na pasta do projeto.

```powershell
# APK para instalar e conferir no aparelho
npx eas-cli build --platform android --profile preview

# AAB para envio à Play Store depois da validação do APK
npx eas-cli build --platform android --profile production
```

Esses comandos iniciam builds remotos. Não foram executados nesta varredura. Gerar o AAB não o publica automaticamente.

Para desenvolvimento nativo local, crie .env.local (já ignorado pelo projeto) com GOOGLE_MAPS_API_KEY e seu valor, e gere novamente o app Android. O Expo Go usa sua própria configuração nativa: não comprova a chave nem o ícone do seu APK.

## Conferência no aparelho

1. Instale o novo APK e confira o ícone MotoHub no launcher.
2. Abra como visitante e confira eventos atravessando meses/anos e, no mesmo dia, horários diferentes.
3. Crie uma viagem, toque MAIS DESTINOS, adicione/reordene/remova paradas e toque TRAÇAR ROTA. Confira linha azul, marcadores, zoom, tela cheia e distância.
4. Salve e reabra a viagem para conferir o traçado e os intermediários.
5. Confira também a versão instalada pela faixa de teste interno da Play Store, porque ela pode usar outra assinatura.

## Limites encontrados

O Nominatim público e o OSRM público são dependências externas para geocodificação/cálculo. Uma chave Google correta não resolve indisponibilidade desses serviços. O limite local de consultas não é global entre usuários; antes de distribuir em escala, é necessário um provedor adequado ou backend com cache e controle agregado. Consulte também VERSAO_2.0.2.md.

Os 14 testes existentes, o TypeScript e a exportação Android (bundle Hermes, 1035 módulos) passaram nesta varredura. A configuração efetiva do Expo confirmou os caminhos dos ícones e androidMapsConfigured=false no ambiente local. Os testes de rede usam respostas simuladas. O expo install --check apontou dez atualizações de correção recomendadas no SDK 57 (expo, auth-session, constants, crypto, file-system, font, image-manipulator, image-picker, splash-screen e web-browser). As dependências não foram atualizadas nesta revisão dos quatro itens. Nenhum APK/AAB foi compilado ou testado em aparelho.

## Referências oficiais

- https://docs.expo.dev/versions/latest/sdk/map-view/
- https://docs.expo.dev/eas/environment-variables/
- https://developers.google.com/maps/documentation/android-sdk/get-api-key
- https://developers.google.com/maps/api-security-best-practices
