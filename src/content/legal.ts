export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export const LEGAL_UPDATED_AT = '19 de agosto de 2026';

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: '1. Aceitação e responsável',
    paragraphs: [
      'Estes Termos de Uso regulam o acesso e a utilização do aplicativo MotoHub, ferramenta vinculada à marca/projeto Fotos e Moto e mantida por Marionildo Ferronatto, em Cascavel, Paraná, Brasil.',
      'Ao criar uma conta ou utilizar o MotoHub, o usuário declara que leu e concorda com estes Termos e com a Política de Privacidade.',
    ],
  },
  {
    title: '2. Público e idade mínima',
    paragraphs: [
      'O MotoHub é destinado exclusivamente a pessoas com 18 anos ou mais. O aplicativo é voltado a motociclistas, mas não verifica habilitação e não substitui as exigências legais para condução de veículos.',
    ],
  },
  {
    title: '3. Conta e segurança',
    paragraphs: [
      'O usuário deve fornecer informações verdadeiras, manter seus dados atualizados e proteger sua senha. Atividades realizadas na conta são de responsabilidade de seu titular, salvo falha comprovadamente atribuível ao MotoHub.',
      'É proibido criar contas para terceiros sem autorização, tentar acessar contas alheias ou utilizar o serviço para fraude, assédio, discriminação, atividade ilegal ou violação de direitos.',
    ],
  },
  {
    title: '4. Funcionalidades e natureza do serviço',
    paragraphs: [
      'O MotoHub permite organizar dados de motocicletas, ficha técnica, manutenções, abastecimentos, viagens e eventos, além de visualizar rotas e abrir serviços externos de mapas.',
      'Registros, médias de consumo, estimativas de combustível, alertas, rotas e demais resultados são informativos. Eles não substituem manual do fabricante, avaliação mecânica, orientação profissional, sinalização, autoridades de trânsito ou decisão segura do condutor.',
    ],
  },
  {
    title: '5. Segurança no trânsito e rotas',
    paragraphs: [
      'O usuário deve respeitar a legislação, as condições da via, o clima, os limites do veículo e sua própria capacidade. Não utilize o aparelho enquanto estiver conduzindo.',
      'Mapas e rotas podem conter erros, mudanças, bloqueios ou informações desatualizadas. O MotoHub não garante trafegabilidade, segurança, precisão, duração ou disponibilidade de qualquer trajeto.',
    ],
  },
  {
    title: '6. Eventos, viagens e conteúdo público',
    paragraphs: [
      'Eventos divulgados e viagens marcadas como públicas podem ser visualizados por visitantes e outros usuários. O responsável pela publicação deve possuir autorização para divulgar imagens, nomes, contatos e demais informações inseridas.',
      'O MotoHub não organiza, fiscaliza nem garante eventos publicados por usuários. Datas, locais, estrutura, preços, segurança e realização devem ser confirmados diretamente com o organizador.',
    ],
  },
  {
    title: '7. Conteúdo do usuário',
    paragraphs: [
      'O usuário mantém os direitos sobre o conteúdo que publica e concede ao MotoHub uma licença limitada, gratuita e necessária para armazenar, processar e exibir esse conteúdo dentro das funcionalidades escolhidas, enquanto ele permanecer publicado.',
      'Não é permitido publicar material ilegal, ofensivo, enganoso, protegido por direitos de terceiros sem autorização ou que exponha dados pessoais de outras pessoas indevidamente. Conteúdo irregular poderá ser removido e a conta poderá ser restringida.',
    ],
  },
  {
    title: '8. Serviços de terceiros',
    paragraphs: [
      'O aplicativo utiliza serviços de terceiros, incluindo Firebase/Google Cloud, Google Maps, OpenStreetMap/Nominatim e OSRM. A disponibilidade e o tratamento realizado por esses serviços também estão sujeitos às políticas de seus respectivos fornecedores.',
    ],
  },
  {
    title: '9. Disponibilidade e responsabilidade',
    paragraphs: [
      'O MotoHub poderá passar por manutenção, apresentar indisponibilidade ou ter funcionalidades alteradas. Empregaremos esforços razoáveis para manter o serviço seguro e funcional, sem prometer operação ininterrupta ou livre de erros.',
      'Nada nestes Termos exclui direitos garantidos pela legislação brasileira, inclusive normas de proteção ao consumidor quando aplicáveis.',
    ],
  },
  {
    title: '10. Exclusão e encerramento',
    paragraphs: [
      'O usuário pode excluir sua conta pelo menu Meu Perfil > Apagar Minha Conta. A exclusão é irreversível e remove os dados associados, ressalvadas hipóteses de retenção exigidas por lei ou necessárias ao exercício regular de direitos.',
    ],
  },
  {
    title: '11. Alterações e contato',
    paragraphs: [
      'Estes Termos podem ser atualizados para refletir mudanças legais ou funcionais. Alterações relevantes serão informadas no aplicativo ou por meio adequado.',
      'Dúvidas, denúncias ou solicitações: app.motohub.oficial@gmail.com.',
    ],
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: '1. Controlador e contato',
    paragraphs: [
      'O controlador dos dados pessoais tratados pelo MotoHub é Marionildo Ferronatto, responsável pelo aplicativo e pela marca/projeto Fotos e Moto, localizado em Cascavel, Paraná, Brasil.',
      'Canal para privacidade e exercício de direitos: app.motohub.oficial@gmail.com.',
    ],
  },
  {
    title: '2. Dados tratados',
    paragraphs: [
      'Dados de conta e perfil: identificador da conta, nome, apelido, e-mail, telefone, estado de verificação e dados de autenticação administrados pelo Firebase Authentication.',
      'Dados das motocicletas: marca, modelo, apelido, ano, hodômetro, imagem escolhida pelo usuário e informações de ficha técnica.',
      'Dados de uso das funcionalidades: manutenções, abastecimentos, consumo estimado, viagens, cidades, rotas, coordenadas do roteiro, eventos, datas, locais, contatos, descrições e imagens publicadas.',
      'Dados técnicos essenciais podem ser processados automaticamente pelos provedores de infraestrutura, como endereço IP, informações do dispositivo, registros de segurança, falhas e horários de acesso, conforme suas próprias políticas.',
    ],
  },
  {
    title: '3. Permissões do aparelho',
    paragraphs: [
      'O MotoHub solicita acesso às fotos somente quando o usuário decide selecionar uma imagem para motocicleta ou evento. O aplicativo não acessa toda a galeria nem envia imagens que não tenham sido escolhidas.',
      'Na versão atual, o MotoHub não realiza rastreamento contínuo de localização nem grava o deslocamento em segundo plano. Cidades e destinos informados podem ser convertidos em coordenadas para calcular e exibir rotas.',
    ],
  },
  {
    title: '4. Finalidades e bases legais',
    paragraphs: [
      'Os dados são utilizados para criar e autenticar a conta, prestar as funcionalidades solicitadas, armazenar registros, calcular médias e rotas, exibir conteúdo público escolhido pelo usuário, prevenir abuso, atender suporte e melhorar segurança e estabilidade.',
      'O tratamento ocorre principalmente para execução dos serviços solicitados, cumprimento de obrigações legais, exercício regular de direitos e interesses legítimos relacionados à segurança e funcionamento. Quando necessário, será solicitado consentimento específico.',
    ],
  },
  {
    title: '5. Conteúdo público',
    paragraphs: [
      'Eventos divulgados são públicos e podem aparecer para pessoas sem conta. Viagens somente são públicas quando o usuário selecionar essa opção. Informações privadas de motos, manutenções e abastecimentos não devem ser exibidas publicamente.',
      'Antes de publicar, o usuário deve evitar inserir dados pessoais desnecessários, documentos, placas, endereços residenciais ou informações de terceiros sem autorização.',
    ],
  },
  {
    title: '6. Compartilhamento e operadores',
    paragraphs: [
      'Não vendemos dados pessoais. Eles podem ser processados por fornecedores necessários ao serviço: Firebase Authentication, Cloud Firestore e Cloud Storage/Google Cloud; Google Maps; OpenStreetMap/Nominatim; e OSRM.',
      'Também poderá ocorrer compartilhamento quando exigido por lei, ordem válida de autoridade, proteção de direitos ou investigação de fraude e abuso.',
    ],
  },
  {
    title: '7. Transferência internacional',
    paragraphs: [
      'Parte dos dados e imagens pode ser armazenada ou processada fora do Brasil, inclusive em infraestrutura localizada nos Estados Unidos. Adotamos fornecedores reconhecidos e medidas compatíveis com a LGPD para proteger essas operações.',
    ],
  },
  {
    title: '8. Retenção e exclusão',
    paragraphs: [
      'Os dados permanecem enquanto a conta estiver ativa ou pelo período necessário às finalidades informadas. O usuário pode excluir registros individualmente e apagar sua conta no menu Meu Perfil.',
      'Eventos podem deixar de ser exibidos após a data final e ser removidos posteriormente. Dados poderão ser preservados pelo prazo estritamente necessário quando houver obrigação legal, prevenção de fraude, disputa ou exercício regular de direitos.',
    ],
  },
  {
    title: '9. Direitos do titular',
    paragraphs: [
      'Nos termos da LGPD, o titular pode solicitar confirmação e acesso, correção, informações sobre compartilhamento, oposição quando cabível, revogação de consentimento e exclusão ou anonimização nos casos aplicáveis.',
      'As solicitações devem ser enviadas para app.motohub.oficial@gmail.com. Poderemos pedir informações razoáveis para confirmar a identidade e proteger a conta.',
    ],
  },
  {
    title: '10. Segurança',
    paragraphs: [
      'Utilizamos autenticação, regras de acesso e serviços de nuvem para limitar o acesso indevido. Nenhum sistema é absolutamente seguro; por isso, o usuário também deve proteger senha, aparelho e conta de e-mail.',
    ],
  },
  {
    title: '11. Pessoas menores de 18 anos',
    paragraphs: [
      'O MotoHub não é destinado a menores de 18 anos. Se identificarmos uma conta de menor, poderemos removê-la e eliminar os dados associados, observadas as obrigações legais.',
    ],
  },
  {
    title: '12. Atualizações',
    paragraphs: [
      'Esta Política poderá ser atualizada em razão de mudanças legais, técnicas ou funcionais. A versão vigente e sua data estarão disponíveis no aplicativo e na página pública do MotoHub.',
    ],
  },
];
