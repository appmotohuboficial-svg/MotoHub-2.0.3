# MotoHub 2.0.2 — alterações e validação

## Entrega
Código-fonte atualizado; não é APK/AAB e não foi publicado na Play Store.
O projeto mantém o mesmo pacote Android, projeto EAS, Firebase e permissões.
O versionCode continua gerenciado remotamente pelo EAS; não foi fixado em 4.

## Ícone
- Arte enviada por Pajé em 13/09/2026, sem redesenho.
- Original preservado em assets/motohub-original.jpg (o anexo tinha extensão PNG, mas bytes JPEG).
- Ícone principal PNG real 1024 × 1024 e camada Android PNG 1024 × 1024, com margem segura.
- Configuração da abertura nativa e tela SplashScreen atualizadas; ícones antigos preservados, mas não utilizados no launcher.

## Home visitante
- Eventos em destaque agora usam a mesma regra da Home logada: somente eventos ainda ativos, ordenados por data/hora crescente e limitados aos cinco mais próximos.
- Removida a dependência da ordem de criação (`createdAt`) para definir o destaque.

## Mapa e roteiro
- Painel próprio de mapa, sem camadas sobrepostas interceptando gestos.
- Botão para ver mapa em tela cheia; fechar também pelo botão Voltar do Android.
- Enquadramento da rota após layout e mapa estarem prontos.
- Até 3 pontos intermediários na Nova Viagem, inseridos automaticamente entre origem e destino.
- Cada ponto pode ser definido como PARADA ou PASSAGEM, removido e reorganizado pelas setas de movimento.
- Pontos intermediários entram no cálculo, marcadores, gravação e link de navegação; viagens antigas com `passagens` continuam compatíveis.
- Limite 3 escolhido por compatibilidade com o Google Maps no navegador móvel.
- Rota salva como polyline E5 e pontos de passagem, evitando grandes arrays no Firestore.
- Compatível com viagens antigas com routeCoords; viagens sem geometria tentam recalcular.
- Erros de cálculo exibidos, tentativa manual disponível e salvamento bloqueado enquanto o cálculo falha ou não termina.
- Proteção contra duplo toque ao salvar e ID reutilizado em tentativas após falha de rede.
- Google Maps externo continua disponível se o mapa nativo não estiver configurado.
- iOS usa o provedor padrão Apple Maps. Android usa Google Maps.

## Configuração necessária para o APK
O mapa nativo depende de GOOGLE_MAPS_API_KEY durante o build.
Verifique no seu Google Cloud se o Maps SDK for Android está habilitado e se
a chave aceita o pacote br.com.fotosemoto.motohub e o SHA-1 do certificado que
assina o APK. A assinatura da Play Store pode ter SHA-1 diferente do APK de teste.
Não envie a chave pelo chat nem a grave no código.

O app.config.js injeta a chave no plugin nativo e apenas um booleano em extra.
Quando não há configuração, o app mostra alternativa externa em vez de montar
um mapa nativo sem chave. A presença da chave não prova que restrições e SDK estão corretos.
É preciso gerar um novo binário para aplicar ícone e configuração nativa.
Expo Go não valida o ícone final nem a chave do seu próprio APK.

Com a variável configurada no ambiente production do EAS:
1. npm ci
2. npm test
3. npm run typecheck
4. npx eas-cli build --platform android --profile preview

O perfil preview agora declara buildType apk; não dispara publicação.
A versão de produção mantém autoIncrement e formato padrão AAB.
Nenhum build remoto, uso de créditos, credencial, regra Firebase ou publicação foi acionado nesta entrega.

Referência: https://docs.expo.dev/versions/latest/sdk/map-view/

## Serviços de rota: restrições importantes
O projeto existente consulta Nominatim público para localizar cidades e OSRM público para traçar caminhos.
A 2.0.2 adiciona cache em memória, fila e espaçamento mínimo de 1,1 segundo por instalação,
identificação do app, timeout e crédito OpenStreetMap na tela.
Isso NÃO é um limitador global para vários usuários. Não trate como infraestrutura de produção.

Antes de distribuir para múltiplos usuários, decidir e configurar serviço/proxy de geocodificação
com cache persistente, limite agregado de no máximo 1 requisição/segundo e possibilidade de trocar
o serviço sem atualizar o app, ou contratar/hospedar um provedor apropriado.
Nominatim exige decisão informada do responsável, não permite autocomplete, não tem garantia de
disponibilidade e não deve receber dados confidenciais. Os testes desta entrega usam respostas
simuladas; não consultam cidades reais nem os serviços públicos.
O servidor público de OSRM também pode ficar indisponível. A rota e o tempo do Google Maps
externo podem diferir das estimativas calculadas aqui. Confira os locais antes de iniciar viagem.

Política: https://operations.osmfoundation.org/policies/nominatim/
Links e limite de passagens: https://developers.google.com/maps/documentation/urls/get-started

## Validação realizada
- npm test: 14 testes aprovados (4 existentes + 10 da 2.0.2).
- npm run typecheck: aprovado.
- expo export --platform android: aprovado, bundle Hermes com 1035 módulos.
- Conferência de dimensões, assinatura PNG e arte do ícone.
- Compilação Java/Gradle, instalação em aparelho, gestos, Firestore real e serviços externos: NÃO testados.

## Teste manual obrigatório antes de distribuir
1. Instalar o novo APK e verificar ícone na tela inicial e abertura.
2. Criar viagem sem ponto intermediário e com 1, 2 e 3 pontos; alternar PARADA/PASSAGEM, remover e reorganizar pelas setas.
3. Conferir se os pontos ficam entre origem e destino e se ordem, marcadores, distância e tempo respeitam a reorganização; ampliar, arrastar e aplicar zoom; voltar do mapa.
4. Na tela de visitante, conferir que os cinco eventos aparecem do mais próximo para o mais distante.
5. Salvar, reabrir a viagem e confirmar as passagens e o mesmo traçado.
6. Testar viagem antiga sem geometria e com geometria antiga.
7. Desligar internet: mostrar erro e tentativa; não salvar estimativas incompletas.
8. Abrir Google Maps e conferir todos os pontos intermediários, com e sem aplicativo Maps instalado.
9. Verificar conta com chave Android configurada e build sem chave: este último deve oferecer mapa externo.
10. Testar em tela pequena e fonte ampliada: dados e botões precisam continuar acessíveis por rolagem.

## Recuperação
O ZIP de backup contém os arquivos-fonte originais da pasta antes da atualização.
Não inclui node_modules, histórico .git, caches Expo ou binários AAB antigos.
A atualização altera somente os arquivos listados na entrega e adiciona componentes, testes,
documentação e novos ícones. Não apaga os arquivos antigos do Drive.
