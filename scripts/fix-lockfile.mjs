import { execSync } from 'child_process';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const projectDir = join(process.cwd(), '..');

const lockfilePath = join(projectDir, 'package-lock.json');

if (existsSync(lockfilePath)) {
  console.log('Removing out-of-sync package-lock.json...');
  unlinkSync(lockfilePath);
  console.log('Removed package-lock.json');
} else {
  console.log('No package-lock.json found');
}

console.log('Running npm install to regenerate lockfile...');
execSync('npm install', { cwd: projectDir, stdio: 'inherit' });
console.log('Done! package-lock.json has been regenerated.');
