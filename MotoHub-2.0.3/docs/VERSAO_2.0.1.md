# Versão 2.0.1

## Implementado
- Eventos: horários de início e término, validação do intervalo e expiração no término informado.
- Horários visíveis nos cartões e detalhes; registros antigos continuam funcionando sem horários.
- Eventos (incluindo os cinco da Home) e viagens ordenados pela data crescente, com horário como desempate dos eventos. Datas ausentes ou inválidas ficam no fim; viagens passadas continuam visíveis.
- Abastecimento: entrada monetária em centavos, preço por litro e total em reais, total arredondado e campo `moeda: BRL` persistido junto dos valores numéricos.
- Formatador aceita código ISO e localidade para expansão futura. Sem seleção ou conversão de moedas nesta versão.
- Versão do projeto atualizada para 2.0.1.

Bugs relatados foram retirados do escopo pelo usuário, pois ainda não há relatos. Os ajustes de UX/UI desta execução se concentram nos campos de horário, identificação do preço por litro e prévia do total. Nenhuma funcionalidade da 2.1 foi incluída.

## Validação
- `npm test`: datas entre meses/anos, horários, registros legados, expiração, máscara monetária e arredondamento.
- `npm run typecheck`: verificação estática.
- Validação manual pendente em Android/iOS: selecionar/cancelar datas e horários; rejeitar término anterior ou igual ao início; cadastrar evento que atravessa a meia-noite; conferir listagem e detalhes após salvar; digitar/apagar preço e conferir total; salvar abastecimento e confirmar moeda/valores no Firestore.

A ordenação é local para incluir registros antigos sem timestamps; a Home precisa ler os eventos antes de selecionar os cinco primeiros. Não foi feita migração de dados nem publicação.

