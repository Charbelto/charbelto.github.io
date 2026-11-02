// Makes a small, clean zip of the project: only files tracked by git (no node_modules, dist, test output or QA screenshots).
//   npm run pack   ->  ../My-Website-clean.zip   (commit your changes first: untracked files are not included)
import { execSync } from 'node:child_process';
import { statSync } from 'node:fs';

const out = '../My-Website-clean.zip';
execSync(`git archive --format=zip -9 -o "${out}" HEAD`, { stdio: 'inherit' });
console.log(`wrote ${out}: ${(statSync(out).size / 1e6).toFixed(1)} MB`);
