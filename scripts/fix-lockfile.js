const { execSync } = require('child_process');

console.log('Generating fresh package-lock.json...');
execSync('npm install --package-lock-only', { 
  cwd: '/vercel/share/v0-project',
  stdio: 'inherit' 
});
console.log('Done! package-lock.json regenerated successfully.');
