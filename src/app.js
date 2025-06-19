const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./utils/swagger');
const { testConnection } = require('./config/database');
const { syncDatabase } = require('./models');

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const empresaRoutes = require('./routes/empresaRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const entregaRoutes = require('./routes/entregaRoutes');

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de log para desenvolvimento
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Controle de Entregas'
}));

// Rota de health check
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Verifica o status da API
 *     tags:
 *       - Sistema
 *     responses:
 *       200:
 *         description: API funcionando corretamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    message: 'API de Controle de Entregas funcionando corretamente'
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/entregas', entregaRoutes);

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Rota não encontrada',
    path: req.path,
    method: req.method
  });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro na aplicação:', error);
  
  // Erro de validação do Sequelize
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      message: 'Erro de validação',
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }

  // Erro de constraint única do Sequelize
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      message: 'Violação de constraint única',
      field: error.errors[0]?.path || 'unknown'
    });
  }

  // Erro de token JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Token inválido'
    });
  }

  // Erro de token expirado
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expirado'
    });
  }

  // Erro genérico
  res.status(500).json({
    message: 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// Função para inicializar a aplicação
const initializeApp = async () => {
  try {
    // Testar conexão com o banco
    await testConnection();
    
    // Sincronizar modelos com o banco
    await syncDatabase();
    
    console.log('✅ Aplicação inicializada com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar aplicação:', error);
    process.exit(1);
  }
};

module.exports = { app, initializeApp };

