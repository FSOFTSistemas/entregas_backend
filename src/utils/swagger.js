const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Controle de Entregas',
      version: '1.0.0',
      description: 'Documentação da API do Sistema de Controle de Entregas desenvolvido com Node.js, Express e Sequelize',
      contact: {
        name: 'Sistema de Entregas',
        email: 'contato@sistema-entregas.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor de Desenvolvimento'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido através do endpoint de login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensagem de erro'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensagem de sucesso'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Autenticação',
        description: 'Endpoints relacionados à autenticação de usuários'
      },
      {
        name: 'Empresas',
        description: 'Operações CRUD para empresas'
      },
      {
        name: 'Usuários',
        description: 'Operações CRUD para usuários'
      },
      {
        name: 'Produtos',
        description: 'Operações CRUD para produtos'
      },
      {
        name: 'Entregas',
        description: 'Operações CRUD para entregas e acompanhamento de status'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs;

