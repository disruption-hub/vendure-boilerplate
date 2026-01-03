
const bcrypt = require('bcryptjs');
bcrypt.hash('password123', 10).then(hash => {
  console.log('Password hash:', hash);
  console.log('Use this in your database update:');
  console.log('UPDATE users SET password = $1 WHERE email = $2');
  console.log('Parameters:', hash, 'admin@flowcast.chat');
});
