# Sistema de Controle de Entregas - Backend com Sequelize e Swagger

## Visão Geral

Este projeto foi adaptado para utilizar o Sequelize como ORM (Object-Relational Mapping) para interação com o banco de dados MySQL, seguindo uma arquitetura MVC (Model-View-Controller) mais robusta e organizada. Além disso, foi integrada a documentação automática da API usando Swagger/OpenAPI 3.0.

## Principais Melhorias Implementadas

### 1. Arquitetura MVC com Sequelize
- **Models**: Definição das entidades e relacionamentos usando Sequelize
- **Controllers**: Lógica de negócios separada das rotas
- **Routes**: Apenas orquestração de requisições, delegando para controllers

### 2. Documentação Automática com Swagger
- Interface interativa para testar endpoints
- Documentação completa de todos os endpoints da API
- Esquemas de autenticação JWT integrados
- Disponível em: `http://localhost:3001/api-docs`

### 3. Estrutura de Diretórios Organizada
```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Configuração do Sequelize
│   ├── models/
│   │   ├── index.js             # Configuração e associações dos models
│   │   ├── Empresa.js           # Model da entidade Empresa
│   │   ├── Usuario.js           # Model da entidade Usuario
│   │   ├── Produto.js           # Model da entidade Produto
│   │   └── Entrega.js           # Model da entidade Entrega
│   ├── controllers/
│   │   ├── authController.js    # Controller de autenticação
│   │   ├── empresaController.js # Controller de empresas
│   │   ├── usuarioController.js # Controller de usuários
│   │   ├── produtoController.js # Controller de produtos
│   │   └── entregaController.js # Controller de entregas
│   ├── routes/
│   │   ├── authRoutes.js        # Rotas de autenticação
│   │   ├── empresaRoutes.js     # Rotas de empresas
│   │   ├── usuarioRoutes.js     # Rotas de usuários
│   │   ├── produtoRoutes.js     # Rotas de produtos
│   │   └── entregaRoutes.js     # Rotas de entregas
│   ├── middleware/
│   │   └── auth.js              # Middleware de autenticação JWT
│   ├── utils/
│   │   └── swagger.js           # Configuração do Swagger
│   └── app.js                   # Configuração principal da aplicação
├── index.js                     # Ponto de entrada da aplicação
├── package.json                 # Dependências e scripts
└── .env                         # Variáveis de ambiente
```

## Instalação e Configuração

### Pré-requisitos
- Node.js (versão 14 ou superior)
- MySQL Server
- npm ou yarn

### Dependências Principais
```json
{
  "express": "^4.18.2",
  "sequelize": "^6.35.2",
  "mysql2": "^3.6.5",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "swagger-ui-express": "^5.0.0",
  "swagger-jsdoc": "^6.2.8"
}
```

### Passos de Instalação

1. **Instalar dependências**:
   ```bash
   cd backend
   npm install
   ```

2. **Configurar variáveis de ambiente**:
   Edite o arquivo `.env` com suas configurações:
   ```env
   PORT=3001
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=sistema_entregas
   JWT_SECRET=seu_jwt_secret_aqui
   NODE_ENV=development
   ```

3. **Configurar banco de dados**:
   ```bash
   # Criar banco de dados
   mysql -u root -e "CREATE DATABASE IF NOT EXISTS sistema_entregas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   
   # Executar script de criação das tabelas (se necessário)
   mysql -u root sistema_entregas < database/schema.sql
   ```

4. **Iniciar o servidor**:
   ```bash
   # Desenvolvimento
   npm run dev
   
   # Produção
   npm start
   ```

## Funcionalidades da API

### Autenticação
- **POST** `/api/auth/login` - Realizar login
- **GET** `/api/auth/me` - Obter informações do usuário autenticado
- **POST** `/api/auth/register` - Registrar novo usuário (apenas para masters)

### Empresas
- **GET** `/api/empresas` - Listar todas as empresas
- **POST** `/api/empresas` - Criar nova empresa
- **GET** `/api/empresas/:id` - Buscar empresa por ID
- **PUT** `/api/empresas/:id` - Atualizar empresa
- **DELETE** `/api/empresas/:id` - Remover empresa

### Usuários
- **GET** `/api/usuarios` - Listar todos os usuários
- **POST** `/api/usuarios` - Criar novo usuário
- **GET** `/api/usuarios/:id` - Buscar usuário por ID
- **PUT** `/api/usuarios/:id` - Atualizar usuário
- **DELETE** `/api/usuarios/:id` - Remover usuário

### Produtos
- **GET** `/api/produtos` - Listar todos os produtos
- **POST** `/api/produtos` - Criar novo produto
- **GET** `/api/produtos/:id` - Buscar produto por ID
- **PUT** `/api/produtos/:id` - Atualizar produto
- **DELETE** `/api/produtos/:id` - Remover produto

### Entregas
- **GET** `/api/entregas` - Listar todas as entregas
- **POST** `/api/entregas` - Criar nova entrega
- **GET** `/api/entregas/:id` - Buscar entrega por ID
- **PUT** `/api/entregas/:id` - Atualizar entrega
- **PATCH** `/api/entregas/:id/status` - Atualizar status da entrega
- **DELETE** `/api/entregas/:id` - Remover entrega

## Modelos de Dados (Sequelize)

### Empresa
```javascript
{
  id: INTEGER (Primary Key, Auto Increment),
  cnpj_cpf: STRING (Unique, Not Null),
  razao_social: STRING (Not Null),
  endereco: TEXT,
  logo: STRING,
  createdAt: DATE,
  updatedAt: DATE
}
```

### Usuario
```javascript
{
  id: INTEGER (Primary Key, Auto Increment),
  nome: STRING (Not Null),
  email: STRING (Unique, Not Null),
  senha: STRING (Not Null),
  tipo_usuario: ENUM('master', 'admin', 'entregador'),
  empresa_id: INTEGER (Foreign Key),
  createdAt: DATE,
  updatedAt: DATE
}
```

### Produto
```javascript
{
  id: INTEGER (Primary Key, Auto Increment),
  descricao: STRING (Not Null),
  preco_custo: DECIMAL(10,2),
  preco_venda: DECIMAL(10,2),
  estoque: INTEGER,
  empresa_id: INTEGER (Foreign Key),
  createdAt: DATE,
  updatedAt: DATE
}
```

### Entrega
```javascript
{
  id: INTEGER (Primary Key, Auto Increment),
  produto_id: INTEGER (Foreign Key),
  quantidade: INTEGER (Not Null),
  descricao: TEXT,
  cliente: STRING,
  timestamp: DATE,
  data: DATE,
  status: ENUM('pendente', 'em_transito', 'entregue', 'cancelada'),
  empresa_id: INTEGER (Foreign Key),
  createdAt: DATE,
  updatedAt: DATE
}
```

## Relacionamentos

- **Empresa** tem muitos **Usuários** (1:N)
- **Empresa** tem muitos **Produtos** (1:N)
- **Empresa** tem muitas **Entregas** (1:N)
- **Produto** tem muitas **Entregas** (1:N)

## Middleware de Autenticação

O sistema utiliza JWT (JSON Web Tokens) para autenticação. Todos os endpoints (exceto login) requerem um token válido no header `Authorization`:

```
Authorization: Bearer <seu_jwt_token>
```

### Tipos de Usuário
- **Master**: Acesso total ao sistema, pode gerenciar empresas
- **Admin**: Acesso completo dentro de sua empresa
- **Entregador**: Acesso limitado, principalmente para atualizar status de entregas

## Documentação Swagger

A documentação interativa da API está disponível em:
- **URL**: `http://localhost:3001/api-docs`
- **Funcionalidades**:
  - Testar endpoints diretamente na interface
  - Visualizar esquemas de dados
  - Autenticação JWT integrada
  - Exemplos de requisições e respostas

## Health Check

Para verificar se a API está funcionando:
- **URL**: `http://localhost:3001/api/health`
- **Resposta**:
  ```json
  {
    "status": "OK",
    "timestamp": "2025-06-19T14:07:17.852Z",
    "version": "1.0.0",
    "message": "API de Controle de Entregas funcionando corretamente"
  }
  ```

## Scripts Disponíveis

```bash
# Desenvolvimento com hot reload
npm run dev

# Produção
npm start

# Inicializar banco de dados (se necessário)
npm run init-db
```

## Tratamento de Erros

A API possui tratamento robusto de erros, incluindo:
- Erros de validação do Sequelize
- Erros de constraint única
- Erros de autenticação JWT
- Erros genéricos do servidor

## Considerações de Segurança

- Senhas são hasheadas usando bcrypt
- Tokens JWT com expiração configurável
- Validação de entrada em todos os endpoints
- Middleware de autenticação em rotas protegidas
- CORS configurado para desenvolvimento

## Próximos Passos

Para colocar em produção, considere:
1. Configurar variáveis de ambiente para produção
2. Implementar rate limiting
3. Configurar HTTPS
4. Implementar logs estruturados
5. Configurar monitoramento e alertas
6. Implementar backup automático do banco de dados

---

**Desenvolvido com Node.js, Express, Sequelize e Swagger**

