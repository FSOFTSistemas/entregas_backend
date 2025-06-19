const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123';
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Senha:', password);
  console.log('Hash:', hash);
  
  // Testar se o hash funciona
  const isValid = await bcrypt.compare(password, hash);
  console.log('Hash válido:', isValid);
}

generateHash();

