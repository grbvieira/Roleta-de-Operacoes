import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAngle, sectorAtPointer, planSpin, angleAtTime, POINTER_ANGLE, START_ANGLE } from '../app/core/wheel.mjs';

test('ângulos conhecidos para seta fixa à esquerda e início no topo', () => {
  assert.equal(sectorAtPointer(0, 10), 7);
  assert.equal(sectorAtPointer(270, 10), 0);
  assert.equal(sectorAtPointer(252, 10), 0);
  assert.equal(sectorAtPointer(216, 10), 1);
  assert.equal(sectorAtPointer(0, 4), 3);
  assert.equal(sectorAtPointer(-360, 4), 3);
});
test('bordas dos setores têm regra consistente, dos dois lados', () => {
  assert.equal(sectorAtPointer(270, 10), 0);
  assert.equal(sectorAtPointer(270 - 0.00001, 10), 0);
  assert.equal(sectorAtPointer(270 + 0.00001, 10), 9);
});
test('todos os destinos de 1 a 10 setores alinham o centro à seta, após giros sucessivos', () => {
  for (let count = 1; count <= 10; count += 1) {
    for (const initial of [0, 23, 359.99, -810, 10000]) {
      let rotation = initial;
      for (let index = 0; index < count; index += 1) {
        const plan = planSpin(rotation, count, () => (index + 0.25) / count);
        assert.equal(plan.targetIndex, index);
        assert.equal(sectorAtPointer(plan.end, count), index);
        const actualCenter = (START_ANGLE + (index + 0.5) * 360 / count + plan.end) * Math.PI / 180;
        assert.ok(Math.abs(Math.cos(actualCenter) + 1) < 1e-10, 'centro deve apontar à esquerda');
        assert.ok(Math.abs(Math.sin(actualCenter)) < 1e-10, 'centro deve estar na horizontal');
        assert.equal(POINTER_ANGLE, 180);
        assert.ok(plan.end - plan.start >= 1800 && plan.end - plan.start < 2160);
        rotation = plan.end;
      }
    }
  }
});
test('animação avança com desaceleração e termina exatamente no ângulo planejado', () => {
  const plan = planSpin(73, 10, () => 0.7);
  let lastAngle = plan.start;
  let lastDelta = Infinity;
  for (let step = 1; step <= 100; step += 1) {
    const angle = angleAtTime(plan, plan.duration * step / 100);
    const delta = angle - lastAngle;
    assert.ok(delta >= 0);
    assert.ok(delta <= lastDelta + 1e-8);
    lastDelta = delta;
    lastAngle = angle;
  }
  assert.equal(angleAtTime(plan, -10), plan.start);
  assert.equal(angleAtTime(plan, plan.duration), plan.end);
  assert.equal(angleAtTime(plan, plan.duration + 99999), plan.end);
});
test('normalização permite giros anteriores e ângulos negativos', () => {
  assert.equal(normalizeAngle(-1), 359);
  assert.equal(normalizeAngle(3600), 0);
  assert.equal(normalizeAngle(3601), 1);
});
test('rejeita setores, ângulos e valores aleatórios inválidos', () => {
  for (const count of [0, 11, 1.5, NaN]) assert.throws(() => sectorAtPointer(0, count), RangeError);
  for (const angle of [Infinity, NaN]) assert.throws(() => normalizeAngle(angle), RangeError);
  for (const value of [-0.1, 1, Infinity, NaN]) assert.throws(() => planSpin(0, 10, () => value), RangeError);
});
