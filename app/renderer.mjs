import { OPERATIONS, generateRound, validateSettings } from './core/math.mjs';
import { START_ANGLE, planSpin, angleAtTime, normalizeAngle, sectorAtPointer } from './core/wheel.mjs';
import { initializeHelp } from './help.mjs';

const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const colors = ['#f5cb51', '#f292be', '#96d575', '#79d9e5', '#f28b74'];
const storageKey = 'roleta-settings-v1';
const settings = Object.fromEntries(Object.entries(OPERATIONS).map(([key, value]) => [key, { ...value.defaults }]));
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
  for (const key of Object.keys(OPERATIONS)) {
    try { if (saved?.[key]) settings[key] = validateSettings(key, saved[key]); } catch { /* Retain valid defaults. */ }
  }
} catch { /* Storage is optional; the activity also works in memory. */ }

const state = { operation: null, problems: [], rotation: 0, selected: null, phase: 'ready' };
const previous = new Map();
let frame = 0;
initializeHelp({ canOpen: () => state.phase !== 'spinning' });

function svgElement(tag, attributes, text) {
  const element = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  if (text !== undefined) element.textContent = text;
  return element;
}
function point(radius, angle) {
  const radians = angle * Math.PI / 180;
  return [320 + radius * Math.cos(radians), 320 + radius * Math.sin(radians)];
}
function rotateWheel(angle) {
  $('rotor').setAttribute('transform', `rotate(${angle} 320 320)`);
  $('wheel').dataset.rotation = String(angle);
  // Keep equations readable on both halves, including after the final rotation.
  // Only their orientation changes; each label stays at its slice's center.
  for (const label of $('rotor').querySelectorAll('.sector-label')) {
    const base = Number(label.dataset.baseAngle);
    const direction = normalizeAngle(base + angle);
    const flip = direction > 90 && direction < 270 ? 180 : 0;
    label.setAttribute('transform', `rotate(${base + flip} ${label.getAttribute('x')} ${label.getAttribute('y')})`);
  }
}
function drawWheel() {
  const count = state.problems.length;
  const step = 360 / count;
  const fragment = document.createDocumentFragment();
  state.problems.forEach((problem, index) => {
    const start = START_ANGLE + index * step;
    const end = start + step;
    const p1 = point(267, start);
    const p2 = point(267, end);
    const slice = count === 1
      ? svgElement('circle', { cx: 320, cy: 320, r: 267 })
      : svgElement('path', { d: `M 320 320 L ${p1.join(' ')} A 267 267 0 ${step > 180 ? 1 : 0} 1 ${p2.join(' ')} Z` });
    slice.setAttribute('fill', colors[index % colors.length]);
    slice.setAttribute('class', 'sector');
    slice.dataset.index = index;
    slice.append(svgElement('title', {}, problem.expression));
    fragment.append(slice);
    const angle = start + step / 2;
    const [x, y] = point(178, angle);
    const label = svgElement('text', {
      x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      'font-size': Math.max(19, Math.min(29, 225 / problem.expression.length)),
      class: 'sector-label'
    }, problem.expression);
    label.dataset.index = index;
    label.dataset.baseAngle = angle;
    fragment.append(label);
  });
  $('rotor').replaceChildren(fragment);
  $('wheel-title').textContent = `${OPERATIONS[state.operation].title}: ${state.problems.map(item => item.expression).join('; ')}`;
  $('wheel').setAttribute('aria-labelledby', 'wheel-title');
  $('hub-symbol').textContent = OPERATIONS[state.operation].symbol;
  rotateWheel(0);
}

function resetSelection() {
  cancelAnimationFrame(frame);
  state.rotation = 0;
  state.phase = 'ready';
  state.selected = null;
  $('expression').textContent = '?';
  $('equals').hidden = true;
  $('answer').hidden = true;
  $('answer').textContent = '';
  $('selected-problem').removeAttribute('data-problem');
  $('wheel').removeAttribute('data-selected-index');
  $('answer-button').textContent = 'Mostrar resposta';
  $('answer-hint').textContent = 'Pense na resposta antes de conferir.';
  $('spin-status').textContent = 'Gire para escolher uma conta.';
  setBusy(false);
}
function setBusy(busy) {
  for (const id of ['spin-button', 'back-button', 'settings-button', 'new-round-button', 'help-button']) $(id).disabled = busy;
  $('answer-button').disabled = busy || state.selected === null;
  $('spin-label').textContent = busy ? 'Girando…' : 'Girar';
  $('wheel').setAttribute('aria-busy', String(busy));
}
function renderRound(round) {
  state.problems = round.problems;
  previous.set(state.operation, round.problems);
  resetSelection();
  drawWheel();
  const count = round.problems.length;
  $('round-info').textContent = `${count} ${count === 1 ? 'conta nesta rodada' : 'contas nesta rodada'}`;
  $('limited-info').hidden = round.total >= 10;
  $('limited-info').textContent = round.total === 1
    ? 'Só há uma conta possível. Amplie os intervalos para ter novas contas.'
    : `Há apenas ${round.total} contas possíveis com esses números. Ao renovar, elas mudam de posição.`;
  updateSummary();
}
function newRound() {
  renderRound(generateRound(state.operation, settings[state.operation], previous.get(state.operation)));
}
function updateSummary() {
  const s = settings[state.operation];
  const range = (min, max) => min === max ? String(min) : `${min} a ${max}`;
  $('settings-summary').textContent = `${range(s.aMin, s.aMax)} ${OPERATIONS[state.operation].symbol} ${range(s.bMin, s.bMax)}`;
  $('math-rule').textContent = state.operation === 'subtraction' ? 'Resultados sempre iguais ou maiores que zero.'
    : state.operation === 'division' ? 'Divisões exatas, sempre com divisor positivo.' : 'Números inteiros para praticar.';
}
function enterCategory(operation) {
  state.operation = operation;
  const definition = OPERATIONS[operation];
  $('operation-title').textContent = definition.title;
  $('operation-hint').textContent = definition.hint;
  $('heading-symbol').textContent = definition.symbol;
  $('game-screen').dataset.operation = operation;
  // A settings file from an earlier version might be valid but allow no pairs.
  try { newRound(); } catch {
    settings[operation] = { ...definition.defaults };
    newRound();
  }
  $('menu-screen').hidden = true;
  $('game-screen').hidden = false;
  $('spin-button').focus();
}
function spin() {
  if (state.phase === 'spinning') return;
  state.phase = 'spinning';
  state.selected = null;
  $('answer').hidden = true;
  $('answer').textContent = '';
  $('equals').hidden = true;
  $('expression').textContent = '?';
  $('answer-button').textContent = 'Mostrar resposta';
  $('answer-hint').textContent = 'Pense na resposta antes de conferir.';
  $('selected-problem').removeAttribute('data-problem');
  $('wheel').removeAttribute('data-selected-index');
  document.querySelectorAll('.sector.selected').forEach(element => element.classList.remove('selected'));
  $('spin-status').textContent = 'A roleta está escolhendo sua conta…';
  setBusy(true);
  const plan = planSpin(state.rotation, state.problems.length);
  const started = performance.now();
  function tick(now) {
    const elapsed = now - started;
    rotateWheel(angleAtTime(plan, elapsed));
    if (elapsed < plan.duration) { frame = requestAnimationFrame(tick); return; }
    state.rotation = normalizeAngle(plan.end);
    rotateWheel(state.rotation);
    // The visual angle is the source of truth for the selected equation.
    const index = sectorAtPointer(state.rotation, state.problems.length);
    state.selected = state.problems[index];
    state.phase = 'selected';
    $('wheel').dataset.selectedIndex = index;
    document.querySelector(`.sector[data-index="${index}"]`).classList.add('selected');
    $('selected-problem').dataset.problem = state.selected.id;
    $('expression').textContent = state.selected.expression;
    $('spin-status').textContent = 'Conta escolhida! Qual é a resposta?';
    setBusy(false);
  }
  frame = requestAnimationFrame(tick);
}
function showSettings() {
  if (state.phase === 'spinning' || document.querySelector('dialog[open]')) return;
  const operation = OPERATIONS[state.operation];
  $('settings-operation').textContent = operation.title.toLocaleUpperCase('pt-BR');
  $('a-legend').textContent = operation.labels[0];
  $('b-legend').textContent = operation.labels[1];
  for (const [id, key] of [['a-min', 'aMin'], ['a-max', 'aMax'], ['b-min', 'bMin'], ['b-max', 'bMax']]) {
    $(id).value = settings[state.operation][key];
  }
  $('b-min').min = $('b-max').min = state.operation === 'division' ? '1' : '0';
  $('settings-rule').textContent = 'Use números inteiros de 0 a 1.000. ' + (state.operation === 'subtraction'
    ? 'Só entram contas sem resultado negativo.' : state.operation === 'division'
      ? 'O divisor deve ser maior que zero. Só entram divisões exatas.' : 'A roleta terá até dez contas diferentes.');
  $('settings-error').hidden = true;
  $('settings-dialog').showModal();
}

document.querySelectorAll('[data-operation]').forEach(button => button.addEventListener('click', () => enterCategory(button.dataset.operation)));
$('back-button').addEventListener('click', () => {
  if (state.phase === 'spinning') return;
  resetSelection();
  $('game-screen').hidden = true;
  $('menu-screen').hidden = false;
  document.querySelector(`button[data-operation="${state.operation}"]`).focus();
});
$('new-round-button').addEventListener('click', () => { if (state.phase !== 'spinning') newRound(); });
$('spin-button').addEventListener('click', spin);
$('answer-button').addEventListener('click', () => {
  if (state.phase !== 'selected' || !state.selected) return;
  $('answer').textContent = String(state.selected.answer);
  $('equals').hidden = false;
  $('answer').hidden = false;
  $('answer-hint').textContent = 'Converse com a turma: como você resolveu?';
  $('answer-button').textContent = 'Resposta revelada';
  $('answer-button').disabled = true;
});
$('settings-button').addEventListener('click', showSettings);
for (const id of ['close-settings', 'cancel-settings']) $(id).addEventListener('click', () => $('settings-dialog').close());
$('settings-form').addEventListener('submit', event => {
  event.preventDefault();
  const candidate = Object.fromEntries(['aMin', 'aMax', 'bMin', 'bMax'].map(key => [key, event.currentTarget.elements[key].valueAsNumber]));
  try {
    const valid = validateSettings(state.operation, candidate);
    const round = generateRound(state.operation, valid, previous.get(state.operation));
    settings[state.operation] = valid;
    try { localStorage.setItem(storageKey, JSON.stringify(settings)); } catch { /* Session settings remain usable. */ }
    renderRound(round);
    $('settings-dialog').close();
    $('spin-button').focus();
  } catch (error) {
    $('settings-error').textContent = error.message;
    $('settings-error').hidden = false;
  }
});
