export const MAX_NUMBER = 1000;
export const OPERATIONS = Object.freeze({
  addition: { title: 'Adição', symbol: '+', hint: 'Junte os números e descubra a soma.', labels: ['Primeira parcela', 'Segunda parcela'], defaults: { aMin: 0, aMax: 10, bMin: 0, bMax: 10 } },
  subtraction: { title: 'Subtração', symbol: '−', hint: 'Quanto sobra depois de tirar?', labels: ['Primeiro número', 'Número a subtrair'], defaults: { aMin: 0, aMax: 10, bMin: 0, bMax: 10 } },
  multiplication: { title: 'Multiplicação', symbol: '×', hint: 'Pense em grupos com a mesma quantidade.', labels: ['Primeiro fator', 'Segundo fator'], defaults: { aMin: 0, aMax: 10, bMin: 0, bMax: 10 } },
  division: { title: 'Divisão', symbol: '÷', hint: 'Divida em partes iguais, sem sobrar.', labels: ['Número a dividir', 'Divisor'], defaults: { aMin: 0, aMax: 100, bMin: 1, bMax: 10 } }
});

export function validateSettings(operation, settings) {
  if (!Object.hasOwn(OPERATIONS, operation)) throw new RangeError('Escolha uma operação válida.');
  for (const key of ['aMin', 'aMax', 'bMin', 'bMax']) {
    if (!Number.isInteger(settings[key]) || settings[key] < 0 || settings[key] > MAX_NUMBER) {
      throw new RangeError(`Use números inteiros de 0 a ${MAX_NUMBER}.`);
    }
  }
  if (settings.aMin > settings.aMax || settings.bMin > settings.bMax) {
    throw new RangeError('O mínimo não pode ser maior que o máximo.');
  }
  if (operation === 'division' && settings.bMin === 0) {
    throw new RangeError('O divisor deve começar em 1 ou mais. Não é possível dividir por zero.');
  }
  return { aMin: settings.aMin, aMax: settings.aMax, bMin: settings.bMin, bMax: settings.bMax };
}

export function makeProblem(operation, a, b) {
  if (!Object.hasOwn(OPERATIONS, operation) || !Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
    throw new RangeError('Conta inválida.');
  }
  let answer;
  switch (operation) {
    case 'addition': answer = a + b; break;
    case 'subtraction':
      if (a < b) throw new RangeError('A subtração não pode ter resultado negativo.');
      answer = a - b; break;
    case 'multiplication': answer = a * b; break;
    case 'division':
      if (b === 0 || a % b !== 0) throw new RangeError('Use uma divisão exata com divisor positivo.');
      answer = a / b; break;
  }
  return Object.freeze({ id: `${operation}:${a}:${b}`, operation, a, b, answer, expression: `${a} ${OPERATIONS[operation].symbol} ${b}` });
}

export function randomInt(max, random = Math.random) {
  const value = random();
  if (!Number.isInteger(max) || max < 1 || !Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('Sorteio inválido.');
  }
  return Math.floor(value * max);
}

// Compact rows describe valid pairs. At most 1,001 rows are allocated, even
// for one million combinations. Division steps only through exact multiples.
export function createProblemSpace(operation, settings) {
  const { aMin, aMax, bMin, bMax } = validateSettings(operation, settings);
  const rows = [];
  let total = 0;
  for (let b = bMin; b <= bMax; b += 1) {
    const step = operation === 'division' ? b : 1;
    const first = operation === 'division' ? Math.ceil(aMin / b) * b
      : operation === 'subtraction' ? Math.max(aMin, b) : aMin;
    const count = first > aMax ? 0 : Math.floor((aMax - first) / step) + 1;
    if (count > 0) {
      rows.push({ b, first, step, start: total, count });
      total += count;
    }
  }
  return {
    total,
    at(index) {
      if (!Number.isInteger(index) || index < 0 || index >= total) throw new RangeError('Conta fora do intervalo.');
      const row = rows.find(item => index < item.start + item.count);
      return makeProblem(operation, row.first + (index - row.start) * row.step, row.b);
    }
  };
}

export function generateRound(operation, settings, previous = [], random = Math.random) {
  const space = createProblemSpace(operation, settings);
  if (!space.total) throw new RangeError('Esses intervalos não permitem nenhuma conta válida. Ajuste os números.');
  const count = Math.min(10, space.total);
  // Partial Fisher-Yates via a sparse swap map: exactly count draws, no retry loop.
  const swaps = new Map();
  const indices = [];
  for (let i = 0; i < count; i += 1) {
    const pick = i + randomInt(space.total - i, random);
    indices.push(swaps.get(pick) ?? pick);
    swaps.set(pick, swaps.get(i) ?? i);
  }
  let problems = indices.map(index => space.at(index));
  const oldIds = new Set(previous.map(problem => problem.id));
  // If another set exists, require at least one new problem, not just a reshuffle.
  if (space.total > count && problems.every(problem => oldIds.has(problem.id))) {
    const ids = new Set(problems.map(problem => problem.id));
    for (let index = 0; index < space.total; index += 1) {
      const candidate = space.at(index);
      if (!oldIds.has(candidate.id) && !ids.has(candidate.id)) {
        problems[problems.length - 1] = candidate;
        break;
      }
    }
  }
  if (problems.length > 1 && problems.every((problem, i) => problem.id === previous[i]?.id)) {
    problems = [...problems.slice(1), problems[0]];
  }
  return { problems, total: space.total };
}
