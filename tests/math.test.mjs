import test from 'node:test';
import assert from 'node:assert/strict';
import { OPERATIONS, makeProblem, validateSettings, createProblemSpace, generateRound } from '../app/core/math.mjs';

function seeded(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
}
test('respostas conhecidas nas quatro operações, incluindo zero', () => {
  assert.equal(makeProblem('addition', 7, 3).answer, 10);
  assert.equal(makeProblem('subtraction', 7, 3).answer, 4);
  assert.equal(makeProblem('subtraction', 3, 3).answer, 0);
  assert.equal(makeProblem('multiplication', 7, 3).answer, 21);
  assert.equal(makeProblem('multiplication', 0, 3).answer, 0);
  assert.equal(makeProblem('division', 21, 3).answer, 7);
  assert.equal(makeProblem('division', 0, 3).answer, 0);
});
test('rejeita negativos, divisão inexata e divisão por zero', () => {
  for (const [op, a, b] of [['subtraction', 2, 3], ['division', 7, 3], ['division', 0, 0], ['division', 9, 0], ['addition', -1, 2]]) {
    assert.throws(() => makeProblem(op, a, b), RangeError);
  }
});
test('valida limites, inteiros e intervalos invertidos', () => {
  const defaults = OPERATIONS.addition.defaults;
  for (const value of [-1, 1001, 1.5, NaN, Infinity, '3', undefined]) {
    assert.throws(() => validateSettings('addition', { ...defaults, aMin: value }), RangeError);
  }
  assert.throws(() => validateSettings('addition', { ...defaults, aMin: 11 }), /mínimo/);
  assert.throws(() => validateSettings('addition', { ...defaults, bMin: 11 }), /mínimo/);
  assert.throws(() => validateSettings('division', defaults), /divisor/i);
  assert.throws(() => validateSettings('unknown', defaults), /operação/);
});
test('espaço compacto equivale à enumeração independente em 400 configurações', () => {
  const random = seeded(1842);
  for (const operation of Object.keys(OPERATIONS)) {
    for (let iteration = 0; iteration < 100; iteration += 1) {
      const aMin = Math.floor(random() * 10);
      const bMin = Math.floor(random() * 10) + (operation === 'division' ? 1 : 0);
      const settings = { aMin, aMax: aMin + Math.floor(random() * 10), bMin, bMax: bMin + Math.floor(random() * 10) };
      const expected = [];
      for (let b = settings.bMin; b <= settings.bMax; b += 1) {
        for (let a = settings.aMin; a <= settings.aMax; a += 1) {
          if (operation === 'subtraction' && a < b) continue;
          if (operation === 'division' && a % b !== 0) continue;
          expected.push([a, b]);
        }
      }
      const space = createProblemSpace(operation, settings);
      assert.equal(space.total, expected.length);
      assert.deepEqual(Array.from({ length: space.total }, (_, i) => {
        const problem = space.at(i);
        return [problem.a, problem.b];
      }), expected);
    }
  }
});
test('dez contas únicas, válidas e dentro dos limites em 200 rodadas', () => {
  const random = seeded(4917);
  for (const [operation, definition] of Object.entries(OPERATIONS)) {
    let previous = [];
    for (let i = 0; i < 50; i += 1) {
      const round = generateRound(operation, definition.defaults, previous, random);
      assert.equal(round.problems.length, 10);
      assert.equal(new Set(round.problems.map(p => p.id)).size, 10);
      for (const p of round.problems) {
        assert.ok(p.a >= definition.defaults.aMin && p.a <= definition.defaults.aMax);
        assert.ok(p.b >= definition.defaults.bMin && p.b <= definition.defaults.bMax);
        if (operation === 'subtraction') assert.ok(p.answer >= 0 && p.a - p.b === p.answer);
        if (operation === 'division') assert.ok(p.b > 0 && Number.isInteger(p.answer) && p.answer * p.b === p.a);
      }
      if (previous.length) assert.ok(round.problems.some(p => !previous.some(old => old.id === p.id)));
      previous = round.problems;
    }
  }
});
test('fixar divisor 3 produz apenas múltiplos exatos no intervalo', () => {
  const round = generateRound('division', { aMin: 6, aMax: 12, bMin: 3, bMax: 3 });
  assert.equal(round.total, 3);
  assert.deepEqual(round.problems.map(p => p.a).sort((a, b) => a - b), [6, 9, 12]);
});
test('nenhuma conta possível retorna mensagem, sem tentativas infinitas', () => {
  assert.throws(() => generateRound('subtraction', { aMin: 0, aMax: 2, bMin: 3, bMax: 9 }), /nenhuma conta/);
  assert.throws(() => generateRound('division', { aMin: 5, aMax: 5, bMin: 2, bMax: 2 }), /nenhuma conta/);
});
test('roletas pequenas usam todas as possibilidades uma vez', () => {
  for (const total of [1, 2, 3, 9, 10]) {
    const round = generateRound('addition', { aMin: 0, aMax: total - 1, bMin: 3, bMax: 3 }, [], () => 0);
    assert.equal(round.problems.length, total);
    assert.equal(round.total, total);
    assert.equal(new Set(round.problems.map(p => p.id)).size, total);
  }
});
test('renovação inclui conta nova mesmo quando o sorteio repete a rodada', () => {
  const settings = { aMin: 0, aMax: 10, bMin: 3, bMax: 3 };
  const first = generateRound('addition', settings, [], () => 0);
  const second = generateRound('addition', settings, first.problems, () => 0);
  assert.ok(second.problems.some(p => !first.problems.some(old => old.id === p.id)));
  assert.equal(new Set(second.problems.map(p => p.id)).size, 10);
});
test('renovação muda a ordem quando só há as mesmas contas disponíveis', () => {
  const settings = { aMin: 1, aMax: 3, bMin: 3, bMax: 3 };
  const first = generateRound('addition', settings, [], () => 0);
  const second = generateRound('addition', settings, first.problems, () => 0);
  assert.notDeepEqual(second.problems, first.problems);
  assert.deepEqual(new Set(second.problems.map(p => p.id)), new Set(first.problems.map(p => p.id)));
});
test('uma única combinação continua utilizável ao renovar', () => {
  const settings = { aMin: 12, aMax: 12, bMin: 3, bMax: 3 };
  const first = generateRound('division', settings);
  assert.deepEqual(generateRound('division', settings, first.problems).problems, first.problems);
});
test('limite superior suporta mais de um milhão de pares sem construir a lista inteira', () => {
  const settings = { aMin: 0, aMax: 1000, bMin: 0, bMax: 1000 };
  const round = generateRound('multiplication', settings, [], () => 0.99999999);
  assert.equal(round.total, 1002001);
  assert.equal(round.problems.length, 10);
  assert.equal(makeProblem('multiplication', 1000, 1000).answer, 1000000);
  assert.equal(createProblemSpace('subtraction', settings).total, 501501);
});
