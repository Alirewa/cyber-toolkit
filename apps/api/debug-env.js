const dotenv = require('dotenv');
const path = require('path');

// Load from root
dotenv.config({ path: path.join(__dirname, '../../.env') });
// Load from local
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD);
