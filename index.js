require('dotenv').config();
const { app, initializeApp } = require('./src/app');

const PORT = process.env.PORT || 3001;

// Inicializar aplicação e iniciar servidor
const startServer = async () => {
  try {
    await initializeApp();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📚 Documentação Swagger disponível em: http://localhost:${PORT}/api-docs`);
      console.log(`🔍 Health check disponível em: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

