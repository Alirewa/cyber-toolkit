const { Client } = require('pg');

const connStr = '';
console.log('Attempting connection with:', connStr);

const client = new Client({
  connectionString: connStr
});

client.connect((err) => {
  if (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }
  console.log('Connection successful!');
  client.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Query failed:', err.message);
    } else {
      console.log('Query result:', res.rows[0]);
    }
    client.end();
  });
});
