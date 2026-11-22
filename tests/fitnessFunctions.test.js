/**
 * VitroDiag NEXUS — Architectural Fitness Functions & Performance Budgets
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Fitness 1: Presupuesto Estricto en Motores Ópticos Críticos', () => {
  const geomSize = fs.statSync(path.resolve('static/js/geometry.js')).size;
  const fineSize = fs.statSync(path.resolve('static/js/fineDefects.js')).size;
  const rumSize = fs.statSync(path.resolve('static/js/rumBeacon.js')).size;

  assert.ok(geomSize <= 25 * 1024, `geometry.js excede 25 KB (${geomSize} B)`);
  assert.ok(fineSize <= 25 * 1024, `fineDefects.js excede 25 KB (${fineSize} B)`);
  assert.ok(rumSize <= 5 * 1024, `rumBeacon.js excede 5 KB (${rumSize} B)`);
});

test('Fitness 2: Control Modular y Anti-God-File en Motores de Visión & UI', () => {
  const limits = [
    ['static/js/geometry.js', 500],
    ['static/js/fineDefects.js', 500],
    ['static/js/timing.js', 500],
    ['static/js/rumBeacon.js', 500],
    ['static/js/geminiVision.js', 750],
    ['static/js/geminiModalController.js', 450],
    ['static/js/ui.js', 600],
    ['static/js/articleMemoryUI.js', 350]
  ];
  for (const [mod, maxLines] of limits) {
    const lines = fs.readFileSync(path.resolve(mod), 'utf8').split(/\r?\n/).length;
    assert.ok(lines <= maxLines, `${mod} supera límite de ${maxLines} líneas (${lines})`);
  }
});

test('Fitness 3: Auditoría Zero-Leakage en Módulos Estáticos', () => {
  for (const mod of [
    'static/js/geometry.js',
    'static/js/fineDefects.js',
    'static/js/geminiVision.js',
    'static/js/geminiModalController.js',
    'static/js/ui.js',
    'static/js/articleMemoryUI.js',
    'static/js/rumBeacon.js'
  ]) {
    const raw = fs.readFileSync(path.resolve(mod), 'utf8');
    assert.doesNotMatch(raw, /(?:sk_live|ghp_|AIza)[0-9a-zA-Z-_]{10,}/, `Posible secreto expuesto en ${mod}`);
  }
});
