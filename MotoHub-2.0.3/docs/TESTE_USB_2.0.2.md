# Validação USB da versão 2.0.2

Data: 13/09/2026.
Projeto ativo: E:\App_MotoHub_Oficial\MotoHub-2.0.2, extraído do ZIP fornecido pelo usuário.

## Resultado confirmado

- Compilação Android de desenvolvimento: BUILD SUCCESSFUL (app:assembleDebug, arm64-v8a).
- APK instalado via USB no realme C85, substituindo a versão 2.0.1 com autorização expressa do usuário.
- Versão instalada: 2.0.2, versionCode 1, DEBUGGABLE.
- Aplicativo abriu pelo Metro via USB.
- O usuário confirmou: "O mapa e o traçado apareceram".
- A falha observada anteriormente no Expo Go não foi reproduzida neste teste do APK. A causa específica no Expo Go não foi comprovada.

## Ajustes realizados

- android/local.properties aponta para o Android SDK instalado neste computador.
- .env.local reutiliza a configuração Maps já presente no AndroidManifest.xml. Esse arquivo é ignorado pelo Git. Nenhum valor de chave deve ser incluído nesta documentação.
- A configuração efetiva do Expo passou a indicar androidMapsConfigured=true.
- app.json define fundo preto e splash preto; a abertura React também mostra fundo preto e logo durante a inicialização da sessão.
- O mapa começa a carregar durante o cálculo da rota; removidas a camada extra de carregamento e a atribuição automática de falha ao Wi-Fi.
- O enquadramento aguarda layout e prontidão nativa. O aviso de demora permite recarregar e distingue o teste no Expo Go.
- Neste computador, o servidor com localhost resolveu para IPv6 e o APK não carregou o JavaScript via USB. Reiniciar o Metro com prioridade IPv4 resolveu a conexão.

## Retomar o teste local

Na pasta do projeto, com o celular autorizado via USB e a porta 8081 livre:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reverse tcp:8081 tcp:8081
node --dns-result-order=ipv4first node_modules/expo/bin/cli start --localhost --port 8081
```

Abra o MotoHub instalado. O cabo transporta a conexão com o Metro; mapas, rotas e Firebase ainda precisam de internet no celular.

## Validações e pendências

- TypeScript: aprovado após os ajustes da abertura e do componente de mapa.
- Testes existentes: 15 aprovados.
- Exportação do bundle Android: aprovada.
- Visualização do mapa e traçado no aparelho: confirmada pelo usuário.
- Abertura nativa preta, mapa com passagem e parada, tela cheia e abertura no Google Maps confirmados pelo usuário com imagens.
- Salvamento/reabertura e retorno pelo botão do Android ainda precisam de confirmação explícita.
- APK de desenvolvimento não é o artefato de publicação: usa assinatura debug e depende do Metro.
- AAB de produção e validação pela assinatura da Play Store ainda pendentes. Nenhuma publicação foi realizada.

## Marca maior na abertura

- Pedido do usuário: marca maior que a mostrada pelo Expo Go.
- A imagem nativa foi ampliada de 200 para 240 dp, preservando a margem do Android.
- A abertura React usa a arte original em 82% da largura, limitada pela altura e a 420 dp; fundo preto.
- Exibição por pelo menos 800 ms após o desenho da imagem e ocultação da abertura nativa, com verificação de login em paralelo.
- TypeScript e 15 testes aprovados após esse ajuste.
