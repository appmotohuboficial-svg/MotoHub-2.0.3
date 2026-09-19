# Correção da busca de municípios — 14/09/2026

Causa reproduzida: a consulta livre `Penha - SC, Brasil`, limitada ao primeiro resultado, retornou Rua Vital Brasil, bairro Penha, Lages, Santa Catarina (OSM way 237312022; -27.8109331, -50.2862769). Não foi comprovada uma regra de buscar primeiro a UF; o erro confirmado foi aceitar uma rua sem validar o município.

Correção: consulta estruturada por city/state, filtro de cidades, detalhes do endereço e validação do nome, país, UF e tipo do resultado. UF obrigatória; aceita Cidade - UF e Cidade UF. Coordenadas inválidas e resultados incompatíveis não entram no cache nem são enviados ao OSRM. Origem, destino e intermediários usam a mesma validação.

Validação: TypeScript aprovado; 19 testes aprovados. Regressões cobrem rua/bairro de Penha em Lages, retorno de estado, município diferente, UF diferente, acentos, entrada inválida, coordenadas inválidas e nova tentativa após resposta rejeitada.

Teste real com o serviço corrigido: Curitiba - PR para Penha - SC.
Destino: -26.775418, -48.6465251. Ponto final OSRM: -26.775314, -48.646595.
Distância retornada: 193,8517 km; duração aproximada: 2 h 49 min. Estimativas do OSRM, sem validação de navegação real.

Arquivos: src/utils/municipio.ts; src/services/rotas.ts; tests/versao-2.0.2.test.cjs.
Não houve nova compilação, instalação ou publicação. O AAB 2.0.2 código 7 permanece inalterado. A distribuição desta correção de código exige um novo binário. Viagens já salvas com geometria errada não foram alteradas.
