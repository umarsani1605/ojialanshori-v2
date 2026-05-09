const fs = require('fs');
const content = fs.readFileSync('./node_modules/.pnpm/node-phpass@1.0.5/node_modules/node-phpass/password-hash.js', 'utf-8');
console.log(content.slice(0, 1000));
