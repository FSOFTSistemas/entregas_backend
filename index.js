require('dotenv').config();
const https = require('https');
const http = require('http');
const fs = require('fs');
const { app, initializeApp } = require('./src/app');

// const options = {
//   key: fs.readFileSync('/etc/letsencrypt/live/gestao-api.dev.br/privkey.pem'),
//   cert: fs.readFileSync('/etc/letsencrypt/live/gestao-api.dev.br/fullchain.pem'),
// };

const PORT = process.env.PORT || 4100;

// Inicializar aplicação e iniciar servidor
const startServer = async () => {
  try {
    await initializeApp();

    // HTTP normal
    http.createServer(app).listen(PORT, () => {
      console.log(`Servidor HTTP rodando na porta ${PORT}`);
    });
    
    // https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
    //   console.log(`🚀 Servidor HTTPS rodando na porta ${PORT}`);
    //   console.log(`📚 Documentação Swagger disponível em: https://localhost:${PORT}/api-docs`);
    //   console.log(`🔍 Health check disponível em: https://localhost:${PORT}/api/health`);
    // });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();
