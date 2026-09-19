# Backup MotoHub 2.0.2 — código 7

Projeto aprovado: E:\App_MotoHub_Oficial\MotoHub-2.0.2.
Build EAS: 4d883b1d-6192-42f4-a095-99fcf2747465.
Destino solicitado: mesmo teste fechado da versão 2.0.1.

Contém código-fonte, assets, configuração Expo/Firebase, testes, documentação, configuração local Maps e fontes Android do teste USB.
Exclui dependências node_modules, caches, pastas de compilação, exportação dist, histórico Git e binários APK/AAB. O AAB será entregue separadamente.
Este backup inclui configuração local: manter privado.

Restauração: extrair em pasta própria e executar npm ci. Para build EAS, usar o projeto existente, perfil production e ambiente production; GOOGLE_MAPS_API_KEY e assinatura são mantidos no EAS. O versionCode é remoto e deve continuar com incremento automático.
A pasta android é ignorada pelo build EAS e recriada pelo prebuild com base em app.json/app.config.js. O SDK local em android/local.properties é específico deste computador.
O APK local usa assinatura debug. Para Play Store usar exclusivamente o AAB de produção assinado pelo EAS.

Validação: TypeScript aprovado; 15 testes aprovados; ícone, mapa, passagem/parada, tela cheia e abertura no Google Maps confirmados pelo usuário.
