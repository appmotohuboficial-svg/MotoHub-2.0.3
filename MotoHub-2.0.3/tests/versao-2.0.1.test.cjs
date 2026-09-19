const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function carregar(nome) {
  const arquivo = path.resolve(__dirname, '../src/utils', `${nome}.ts`);
  const codigo = ts.transpileModule(fs.readFileSync(arquivo, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const modulo = { exports: {} };
  new Function('require', 'module', 'exports', codigo)(
    (id) => carregar(id.replace('./', '')), modulo, modulo.exports,
  );
  return modulo.exports;
}

const { dataLocal, compararDatas, formatarHorario } = carregar('datas');
const { formatarMoeda, lerCentavos, calcularTotal } = carregar('moeda');
const { eventoAindaAtivo } = carregar('eventos');

test('ordena datas brasileiras entre meses/anos e deixa ausentes ou inválidas no fim', () => {
  const datas = ['', '01/01/2027', '31/12/2026', '05/09/2026', '31/02/2026'];
  assert.deepEqual(datas.sort(compararDatas), ['05/09/2026', '31/12/2026', '01/01/2027', '', '31/02/2026']);
  assert.equal(compararDatas('05/09/2026', '05/09/2026', '08:00', '18:00'), -1);
  assert.equal(compararDatas(undefined, undefined), 0);
});

test('valida calendário e horário, sem normalizar datas impossíveis', () => {
  assert.equal(dataLocal('29/02/2025'), null);
  assert.ok(dataLocal('29/02/2024'));
  assert.equal(dataLocal('05/09/2026', '24:00'), null);
  assert.equal(formatarHorario(dataLocal('05/09/2026', '08:05')), '08:05');
});

test('expira no horário informado e preserva eventos legados até o fim do dia', () => {
  const original = Date.now;
  Date.now = () => dataLocal('05/09/2026', '18:01').getTime();
  try {
    assert.equal(eventoAindaAtivo({ dataFim: '05/09/2026', horarioFim: '18:00' }), false);
    assert.equal(eventoAindaAtivo({ dataFim: '05/09/2026' }), true);
    assert.equal(eventoAindaAtivo({ dataFim: '06/09/2026', horarioFim: '01:00' }), true);
    assert.equal(eventoAindaAtivo({ expiresAt: { toDate: () => dataLocal('05/09/2026', '17:00') } }), false);
  } finally { Date.now = original; }
});

test('converte máscara BRL e arredonda o total para centavos', () => {
  assert.equal(lerCentavos('R$ 1.234,56'), 1234.56);
  assert.equal(lerCentavos(''), 0);
  assert.equal(lerCentavos('599'), 5.99);
  assert.equal(calcularTotal(10.123, 5.99), 60.64);
  assert.equal(formatarMoeda(1234.56).replace(/\s/g, ' '), 'R$ 1.234,56');
  assert.match(formatarMoeda(5, 'USD', 'en-US'), /\$5\.00/);
});
