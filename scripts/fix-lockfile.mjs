import { execSync } from 'child_process';

const projectDir = '/vercel/share/v0-project';

console.log('Running npm install to generate a fresh lockfile...');
execSync('npm install --package-lock-only', { cwd: projectDir, stdio: 'inherit' });
console.log('Done! package-lock.json has been regenerated.');
