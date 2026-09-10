import { randomInt } from './math.mjs';

// SVG screen coordinates: 0° points right, positive angles go clockwise.
// The first slice starts at the top (-90°), the fixed pointer is on the left.
export const START_ANGLE = -90;
export const POINTER_ANGLE = 180;
export const SPIN_DURATION = 4200;

function validateCount(count) {
  if (!Number.isInteger(count) || count < 1 || count > 10) throw new RangeError('Use de 1 a 10 setores.');
}
export function normalizeAngle(angle) {
  if (!Number.isFinite(angle)) throw new RangeError('Ângulo inválido.');
  return ((angle % 360) + 360) % 360;
}
export function sectorAtPointer(rotation, count) {
  validateCount(count);
  const relative = normalizeAngle(POINTER_ANGLE - normalizeAngle(rotation) - START_ANGLE);
  return Math.min(count - 1, Math.floor(relative / (360 / count)));
}
export function planSpin(rotation, count, random = Math.random) {
  validateCount(count);
  const start = normalizeAngle(rotation);
  const targetIndex = randomInt(count, random);
  const center = START_ANGLE + (targetIndex + 0.5) * 360 / count;
  const destination = normalizeAngle(POINTER_ANGLE - center);
  return { start, end: start + 5 * 360 + normalizeAngle(destination - start), targetIndex, duration: SPIN_DURATION };
}
export function angleAtTime(plan, elapsed) {
  const t = Math.max(0, Math.min(1, elapsed / plan.duration));
  return plan.start + (plan.end - plan.start) * (1 - (1 - t) ** 5);
}
