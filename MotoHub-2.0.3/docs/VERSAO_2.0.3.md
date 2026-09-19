# MotoHub 2.0.3 — preparação e validação

Data: 18/09/2026.
Estado: código preparado e bundle Android validado. APK/AAB 2.0.3 ainda não gerado nem publicado.
Pasta de trabalho: E:\App_MotoHub_Oficial\MotoHub-2.0.3.
Base: E:\App_MotoHub_Oficial\MotoHub-2.0.2, incluindo a correção de municípios feita após o AAB código 7. A pasta MotoHub2-1 tem configuração anterior e não foi usada como base.

## Escopo recuperado

Em “Ideias e dúvidas MotoHub”, o usuário confirmou três prioridades para 2.0.3: persistência do login, investigação de imagens de abertura duplicadas e revisão de arquivos locais. Em “Preparar AAB e organizar versões”, ficou reservada a correção de Penha/SC para o próximo binário.

Fontes de histórico:
- https://chatgpt.com/c/6a33281e-a7a0-83e9-8f51-1d3e7bdc8d12
- Tarefa Codex: Preparar AAB e organizar versões (01a09d72-e4c2-73b2-946a-8bc92d935945).
- docs/CORRECAO_MUNICIPIOS.md.

## Alterações

### Login persistente

A base chamava getAuth sem configurar persistência nativa. Android/iOS agora inicializam Firebase Auth com AsyncStorage; a navegação continua aguardando onAuthStateChanged antes de escolher a área autenticada. Web mantém a inicialização padrão. Fast Refresh reutiliza a instância somente no erro auth/already-initialized; outras falhas não são ocultadas.

Após atualizar a versão que usava memória, pode ser necessário entrar uma vez. Ainda é preciso validar fechamento completo, reinicialização do aparelho e Sair da conta no APK/Play Store. Não foi feito login real nesta preparação.

### Arquivos temporários

- Fotos selecionadas para motos/eventos são liberadas ao trocar a imagem ou sair da tela.
- A cópia intermediária da foto de moto é liberada após o processamento.
- Um upload mantém sua própria referência até terminar, mesmo que a tela feche; falhas preservam a seleção enquanto a tela está aberta para permitir nova tentativa.
- O blob usado pelo upload é liberado no fim.
- Na abertura, imagens temporárias com mais de 24 horas são removidas somente das subpastas privadas ImagePicker e ImageManipulator, desde que não estejam em uso.
- Documentos, credenciais de sessão, galeria, armazenamento público e assets ficam fora da limpeza. A limpeza não solicita novas permissões.

### Imagens motohub-opening-XX.png — origem ainda não confirmada

A abertura atual usa require('../../assets/icon-motohub.png'). A revisão de src, App.tsx, public e functions não encontrou rotina que grave motohub-opening-XX.png nem download/cópia da abertura para a pasta pública. Não é possível atribuir os arquivos ao app com a evidência atual. A hipótese da conversa anterior não foi tratada como causa comprovada.

A limpeza de temporários acima NÃO apaga esses arquivos públicos e não comprova a resolução desse relato. Falta observar no aparelho se uma nova cópia surge após abrir/fechar especificamente a versão instalada pela Play Store e conferir data/hora/local do arquivo novo.

### Município de Penha/SC

Preservada a busca estruturada por município e estado e a validação de nome, país, UF, tipo e coordenadas antes de traçar a rota. Regressões rejeitam rua/bairro de Penha em Lages e homônimos de outra UF. Viagens já salvas com geometria incorreta não são regravadas automaticamente.

### Versão e configuração

app.json, package.json e package-lock.json indicam 2.0.3. Pacote Android, projeto EAS, Firebase e perfis de compilação foram preservados. versionCode permanece remoto, com autoIncrement; não foi consultado nem incrementado no EAS nesta etapa. Dependências não foram atualizadas.

## Verificações realizadas

- npm test: 25 testes aprovados.
- npm run typecheck: aprovado.
- npx expo export --platform android --output-dir dist: aprovado; Hermes, 1051 módulos.
- Teste do adaptador nativo real do Firebase com armazenamento simulado: gravação, leitura por nova instância e remoção. Não substitui validação em aparelho.
- Testes de limpeza cobrem arquivos externos, travessia, diretórios, datas, referências simultâneas e falhas de acesso/upload.
- Testes de município usam respostas simuladas nesta etapa; a consulta real de 14/09 está documentada em CORRECAO_MUNICIPIOS.md.

O bundle local valida empacotamento JavaScript, não assinatura, instalação nem configuração Maps de produção. Nenhum APK/AAB novo, build remoto ou publicação foi feito.

## Conferência no aparelho antes de distribuir

1. Entrar, encerrar completamente o app e reabrir; repetir após reiniciar o celular.
2. Sair da conta e reabrir: deve permanecer desconectado. Entrar novamente e confirmar persistência.
3. Selecionar/substituir/cancelar fotos de moto e evento; salvar e reabrir os registros. Simular falha de upload e tentar de novo.
4. Conferir Curitiba/PR → Penha/SC, paradas e reabertura de viagem.
5. Registrar quantidade/data dos arquivos públicos motohub-opening e comparar após novas aberturas. Se aparecer outro, investigar sua origem antes de declarar esse relato corrigido.

## Compilação posterior

Usar esta pasta. Em outra máquina, executar npm ci e as verificações acima. O perfil production usa o ambiente production do EAS existente. GOOGLE_MAPS_API_KEY e assinatura precisam estar disponíveis nesse ambiente; sua configuração remota não foi alterada nem revalidada hoje.

Para APK: npx eas-cli build --platform android --profile preview
Para AAB: npx eas-cli build --platform android --profile production

Esses comandos disparam builds remotos; não foram executados. O ZIP de código exclui node_modules, android/ios gerados, dist, caches, .env e arquivos de assinatura. A configuração Maps local não foi copiada; para teste nativo local, reutilizar de forma privada a configuração autorizada do projeto anterior.

## Referências técnicas

- https://firebase.google.com/docs/reference/js/auth#getreactnativepersistence
- https://docs.expo.dev/versions/latest/sdk/filesystem/
