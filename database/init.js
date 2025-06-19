const { executeQuery, testConnection } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  console.log('Iniciando configuração do banco de dados...');

  try {
    // Testar conexão
    const connected = await testConnection();
    if (!connected) {
      console.error('Não foi possível conectar ao banco de dados.');
      console.error('Verifique se o MySQL está rodando e as configurações no arquivo .env estão corretas.');
      process.exit(1);
    }

    // Ler e executar o script SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Dividir o script em comandos individuais
    const commands = schema.split(';').filter(cmd => cmd.trim().length > 0);
    
    console.log('Executando script de criação do banco...');
    
    for (const command of commands) {
      if (command.trim()) {
        try {
          await executeQuery(command.trim());
        } catch (error) {
          // Ignorar erros de "já existe" para permitir re-execução
          if (!error.message.includes('already exists') && 
              !error.message.includes('Duplicate entry')) {
            throw error;
          }
        }
      }
    }

    console.log('✅ Banco de dados configurado com sucesso!');
    console.log('');
    console.log('Dados de acesso inicial:');
    console.log('Email: admin@exemplo.com');
    console.log('Senha: admin123');
    console.log('');
    console.log('Você pode alterar estes dados após o primeiro login.');

  } catch (error) {
    console.error('❌ Erro ao configurar banco de dados:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };

