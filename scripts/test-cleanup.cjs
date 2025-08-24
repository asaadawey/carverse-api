const fs = require('fs');
const path = require('path');

console.log('Testing production cleanup script...');

const srcPath = path.join(process.cwd(), 'src');
console.log('Source path:', srcPath);
console.log('Source path exists:', fs.existsSync(srcPath));

// Quick test of console scanning
let count = 0;
if (fs.existsSync(srcPath)) {
  const files = fs.readdirSync(srcPath);
  console.log('Files in src:', files.length);
}

console.log('Script completed!');
