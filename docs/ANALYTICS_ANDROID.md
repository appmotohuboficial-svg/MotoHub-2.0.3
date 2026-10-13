# Firebase Analytics — preparação Android

Preparado em D:\MotoHub 2.1.0. A build deve ser feita após transferir a cópia de trabalho para E:.

- React Native Firebase app/analytics e expo-dev-client instalados.
- Analytics nativo usa google-services.json do projeto app-motohub-oficial e pacote br.com.fotosemoto.motohub.
- Auth, Firestore e Storage continuam usando a integração existente com Firebase JS.
- Eventos screen_view são enviados na primeira tela e nas mudanças de tela, sem parâmetros de navegação ou dados pessoais. O SDK também coleta eventos automáticos de uso.
- Identificador de publicidade e relatórios automáticos de telas nativas desativados para evitar duplicação com as telas do React Navigation.
- Expo Go e web continuam sem Analytics; falhas de telemetria não interrompem navegação.
- iOS Analytics não foi preparado; falta sua configuração Firebase.

## Próxima etapa (uma por vez)

Confirmar no Firebase Console que Google Analytics está habilitado no projeto app-motohub-oficial e vinculado à propriedade correta. Nada foi alterado no Console por esta preparação.

Depois, transferir a cópia de trabalho para E:, preservar .git e configuração privada, conferir a cópia e gerar a build Android. As configurações EAS e a disponibilidade de GOOGLE_MAPS_API_KEY precisam ser conferidas antes da build.

## Validação após a build

Instalar o APK/cliente de desenvolvimento no aparelho. Expo Go não valida Analytics nativo.
Com o aparelho conectado por USB e ADB disponível:

    adb shell setprop debug.firebase.analytics.app br.com.fotosemoto.motohub

Abrir o app, visitar telas diferentes e conferir screen_view, screen_name e screen_class no DebugView do Firebase. Confirmar também login, navegação e mapa no aparelho.
Ao terminar:

    adb shell setprop debug.firebase.analytics.app .none.

Não considerar o recebimento de eventos confirmado até esta verificação. O backup anterior no E: preserva o estado antes da integração.

## Verificações locais desta preparação

- TypeScript: sem erros.
- Testes: 40 passaram, incluindo 5 de Analytics.
- Opções de firebase.json conferidas contra o schema do SDK instalado.
- Plugins Expo resolvidos sem erro.
- Bundle JavaScript Android gerado com sucesso (1121 módulos), sem bytecode.
- A tentativa de gerar bytecode Hermes falhou ao iniciar o processo no Windows (spawn UNKNOWN). Não foi gerado APK nem validada compilação nativa.
- A instalação informou 39 vulnerabilidades nas dependências (11 moderadas, 27 altas e 1 crítica). Não foi aplicada correção automática; não foi determinado nesta etapa quais já existiam antes da instalação.
