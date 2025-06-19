# Guia de Migração: MySQL Puro para Sequelize

## Resumo das Mudanças

Este documento descreve as principais mudanças realizadas na migração do backend de consultas MySQL puras para o uso do Sequelize ORM.

## Antes vs Depois

### Estrutura de Arquivos

**Antes:**
```
backend/
├── src/
│   ├── config/
│   │   └── database.js    # Conexão MySQL pura
│   ├── routes/
│   │   ├── auth.js        # Rotas com lógica de negócios
│   │   ├── empresa.js     # Consultas SQL diretas
│   │   ├── usuario.js     # Consultas SQL diretas
│   │   ├── produto.js     # Consultas SQL diretas
│   │   └── entrega.js     # Consultas SQL diretas
│   └── middleware/
│       └── auth.js
├── database/
│   ├── schema.sql         # Script de criação das tabelas
│   └── init.js            # Inicialização do banco
└── index.js
```

**Depois:**
```
backend/
├── src/
│   ├── config/
│   │   └── database.js    # Configuração do Sequelize
│   ├── models/
│   │   ├── index.js       # Configuração e associações
│   │   ├── Empresa.js     # Model Sequelize
│   │   ├── Usuario.js     # Model Sequelize
│   │   ├── Produto.js     # Model Sequelize
│   │   └── Entrega.js     # Model Sequelize
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── empresaController.js
│   │   ├── usuarioController.js
│   │   ├── produtoController.js
│   │   └── entregaController.js
│   ├── routes/
│   │   ├── authRoutes.js  # Apenas orquestração
│   │   ├── empresaRoutes.js
│   │   ├── usuarioRoutes.js
│   │   ├── produtoRoutes.js
│   │   └── entregaRoutes.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   └── swagger.js     # Configuração Swagger
│   └── app.js             # Configuração principal
├── database/
│   ├── schema.sql
│   └── init.js
└── index.js
```

### Exemplo de Migração: Usuários

**Antes (MySQL Puro):**
```javascript
// routes/usuario.js
const express = require('express');
const { executeQuery } = require('../config/database');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT u.*, e.razao_social as empresa_nome 
      FROM usuarios u 
      LEFT JOIN empresas e ON u.empresa_id = e.id 
      WHERE u.empresa_id = ?
    `;
    const usuarios = await executeQuery(query, [req.user.empresa_id]);
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome, email, senha, tipo_usuario } = req.body;
    const hashedPassword = await bcrypt.hash(senha, 10);
    
    const query = `
      INSERT INTO usuarios (nome, email, senha, tipo_usuario, empresa_id) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await executeQuery(query, [
      nome, email, hashedPassword, tipo_usuario, req.user.empresa_id
    ]);
    
    res.status(201).json({ 
      id: result.insertId, 
      message: 'Usuário criado com sucesso' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});
```

**Depois (Sequelize + Controller):**
```javascript
// models/Usuario.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  senha: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tipo_usuario: {
    type: DataTypes.ENUM('master', 'admin', 'entregador'),
    allowNull: false,
    defaultValue: 'entregador'
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'usuarios'
});

module.exports = Usuario;

// controllers/usuarioController.js
const { Usuario, Empresa } = require('../models');

const usuarioController = {
  async index(req, res) {
    try {
      const usuarios = await Usuario.findAll({
        where: { empresa_id: req.user.empresa_id },
        include: [{
          model: Empresa,
          as: 'empresa',
          attributes: ['razao_social']
        }],
        attributes: { exclude: ['senha'] }
      });
      
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  },

  async store(req, res) {
    try {
      const { nome, email, senha, tipo_usuario } = req.body;
      const hashedPassword = await bcrypt.hash(senha, 10);
      
      const usuario = await Usuario.create({
        nome,
        email,
        senha: hashedPassword,
        tipo_usuario,
        empresa_id: req.user.empresa_id
      });
      
      res.status(201).json({
        id: usuario.id,
        message: 'Usuário criado com sucesso'
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: 'Email já está em uso' });
      }
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
};

module.exports = usuarioController;

// routes/usuarioRoutes.js
const express = require('express');
const usuarioController = require('../controllers/usuarioController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/', usuarioController.index);
router.post('/', usuarioController.store);

module.exports = router;
```

## Principais Benefícios da Migração

### 1. **Separação de Responsabilidades**
- **Models**: Definição de estrutura e relacionamentos
- **Controllers**: Lógica de negócios
- **Routes**: Apenas orquestração de requisições

### 2. **Validação Automática**
- Validação de tipos de dados
- Constraints de banco de dados
- Validações customizadas nos models

### 3. **Relacionamentos Simplificados**
```javascript
// Antes: JOIN manual
const query = `
  SELECT u.*, e.razao_social 
  FROM usuarios u 
  LEFT JOIN empresas e ON u.empresa_id = e.id
`;

// Depois: Include automático
const usuarios = await Usuario.findAll({
  include: [{ model: Empresa, as: 'empresa' }]
});
```

### 4. **Tratamento de Erros Melhorado**
```javascript
// Sequelize fornece erros específicos
if (error.name === 'SequelizeUniqueConstraintError') {
  return res.status(400).json({ message: 'Email já está em uso' });
}
```

### 5. **Migrations e Sincronização**
```javascript
// Sincronização automática dos models
await sequelize.sync({ alter: true });
```

## Documentação Swagger Integrada

### Antes
- Sem documentação automática
- Testes manuais com Postman/cURL

### Depois
- Documentação interativa em `/api-docs`
- Testes diretos na interface
- Esquemas de dados documentados
- Autenticação JWT integrada

## Configuração do Sequelize

```javascript
// config/database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);
```

## Associações entre Models

```javascript
// models/index.js
const Empresa = require('./Empresa');
const Usuario = require('./Usuario');
const Produto = require('./Produto');
const Entrega = require('./Entrega');

// Definir associações
Empresa.hasMany(Usuario, { foreignKey: 'empresa_id', as: 'usuarios' });
Usuario.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });

Empresa.hasMany(Produto, { foreignKey: 'empresa_id', as: 'produtos' });
Produto.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });

Empresa.hasMany(Entrega, { foreignKey: 'empresa_id', as: 'entregas' });
Entrega.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });

Produto.hasMany(Entrega, { foreignKey: 'produto_id', as: 'entregas' });
Entrega.belongsTo(Produto, { foreignKey: 'produto_id', as: 'produto' });
```

## Comandos de Migração

Para migrar um projeto existente:

1. **Instalar dependências**:
   ```bash
   npm install sequelize mysql2 swagger-ui-express swagger-jsdoc
   ```

2. **Criar estrutura de diretórios**:
   ```bash
   mkdir -p src/{models,controllers,utils}
   ```

3. **Migrar models um por vez**
4. **Criar controllers**
5. **Atualizar rotas**
6. **Configurar Swagger**
7. **Testar funcionalidades**

## Considerações Importantes

### Performance
- Sequelize pode ser mais lento que SQL puro em consultas complexas
- Use `raw: true` quando necessário para consultas específicas
- Configure adequadamente o pool de conexões

### Debugging
- Ative logging em desenvolvimento: `logging: console.log`
- Use `sequelize.query()` para consultas SQL diretas quando necessário

### Compatibilidade
- Mantenha o schema SQL original para compatibilidade
- Use `tableName` nos models para mapear tabelas existentes
- Configure `timestamps: false` se não usar createdAt/updatedAt

---

Esta migração resultou em um código mais organizado, manutenível e com melhor documentação, mantendo toda a funcionalidade original do sistema.

