/**
 * VITRODIAG NEXUS — Motor Real de Mutation Testing en Sandbox Aislado
 * Inyecta mutaciones en los umbrales de Plomada Láser y Detección Óptica I.S.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const SANDBOX = path.join(ROOT, 'scratch', 'mutation_sandbox');

const MUTATIONS = [
  {
    id: 'MUT-VD-01',
    name: 'Sabotear tolerancia angular de Plomada Láser (> 1.8 -> > 15.0)',
    file: 'static/js/geometry.js',
    target: 'if (absInclinacionEje > 1.8)',
    replacement: 'if (absInclinacionEje > 15.0)',
    testFile: 'tests/test_geometry_engine.test.js'
  },
  {
    id: 'MUT-VD-02',
    name: 'Anular umbral de rotura en Corona (> 0.30 -> > 1.50)',
    file: 'static/js/geometry.js',
    target: 'if (maxFinishAsymmetry > 0.30)',
    replacement: 'if (maxFinishAsymmetry > 1.50)',
    testFile: 'tests/test_geometry_engine.test.js'
  },
  {
    id: 'MUT-VD-03',
    name: 'Anular umbral de simetría de Hombro y Cuello Torcido (> 2.2 -> > 45.0)',
    file: 'static/js/geometry.js',
    target: 'if (desviacionCuelloVsCuerpo > 2.2)',
    replacement: 'if (desviacionCuelloVsCuerpo > 45.0)',
    testFile: 'tests/test_geometry_engine.test.js'
  }
];

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === '__pycache__' || entry.name === 'seedDataset.js') continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirSync(s, d);
    else fs.copyFileSync(s, d);
  }
}

console.log('🧬 [VITRODIAG MUTATION SANDBOX] Ejecutando mutaciones empíricas en motor óptico...');
let killed = 0;

try {
  fs.rmSync(SANDBOX, { recursive: true, force: true });
  fs.mkdirSync(SANDBOX, { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(SANDBOX, 'package.json'));
  copyDirSync(path.join(ROOT, 'static'), path.join(SANDBOX, 'static'));
  copyDirSync(path.join(ROOT, 'tests'), path.join(SANDBOX, 'tests'));

  for (const mut of MUTATIONS) {
    const targetPath = path.join(SANDBOX, mut.file);
    const original = fs.readFileSync(targetPath, 'utf8');
    if (!original.includes(mut.target)) {
      throw new Error(`Patrón objetivo no encontrado en ${mut.file}: ${mut.target}`);
    }
    fs.writeFileSync(targetPath, original.replace(mut.target, mut.replacement), 'utf8');
    const res = spawnSync(process.execPath, ['--test', mut.testFile], { cwd: SANDBOX, encoding: 'utf8' });
    fs.writeFileSync(targetPath, original, 'utf8');

    if (res.status !== 0) {
      killed++;
      console.log(` ✅ KILLED [${mut.id}]: ${mut.name}`);
    } else {
      console.error(` ❌ SURVIVED [${mut.id}]: ${mut.name}`);
    }
  }
} finally {
  fs.rmSync(SANDBOX, { recursive: true, force: true });
}

const rate = Math.round((killed / MUTATIONS.length) * 100);
console.log(`\n📊 Kill Rate Empírico VitroDiag: ${killed}/${MUTATIONS.length} (${rate}%)`);
process.exit(killed === MUTATIONS.length ? 0 : 1);
