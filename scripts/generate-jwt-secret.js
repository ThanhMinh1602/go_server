// Script để generate JWT secret key ngẫu nhiên
const crypto = require('crypto');

const secret = crypto.randomBytes(64).toString('hex');
console.log('\n=== JWT Secret Key (copy vào .env) ===');
console.log(secret);
console.log('\n');

