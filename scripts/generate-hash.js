import crypto from 'crypto';

// Get password from command line arguments or use default
const password = process.argv[2] || 'admin123';

const hash = crypto.createHash('sha256').update(password).digest('hex');

console.log('\n==========================================');
console.log('   Waves Cash Drawer - Password Hash Generator');
console.log('==========================================');
console.log(`Password : "${password}"`);
console.log(`SHA-256  : ${hash}`);
console.log('==========================================\n');
console.log('Copy this hash to your .env file:');
console.log(`VITE_AUTH_HASHES="${hash}"`);
console.log('\nOr add it to a comma-separated list of allowed hashes:');
console.log(`VITE_AUTH_HASHES="<existing_hash>,${hash}"\n`);
