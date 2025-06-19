# Análise e Planejamento da Adaptação do Backend

## 1. Introdução

Este documento detalha o plano para adaptar o backend do sistema de controle de entregas, atualmente desenvolvido com Node.js e MySQL, para utilizar o Sequelize como ORM (Object-Relational Mapper) e integrar a documentação da API com Swagger/OpenAPI. O objetivo é melhorar a organização do código, facilitar a manutenção, padronizar a interação com o banco de dados e fornecer uma documentação interativa e atualizada da API.

## 2. Motivações para a Adaptação

A decisão de migrar para o Sequelize e integrar o Swagger é baseada nas seguintes motivações:

*   **Padronização da Interação com o Banco de Dados**: O Sequelize oferece uma camada de abstração que padroniza as operações de banco de dados, tornando o código mais limpo, legível e menos propenso a erros de SQL. Isso substitui as queries SQL diretas, que podem ser mais suscetíveis a SQL Injection e menos flexíveis para mudanças de schema.
*   **Organização e Manutenibilidade do Código**: A adoção de um ORM como o Sequelize incentiva a arquitetura MVC (Model-View-Controller) ou similar, onde os 


models represent a camada de dados, os controllers contêm a lógica de negócios e as rotas orquestram as requisições. Isso melhora significativamente a organização e a manutenibilidade do código, especialmente em projetos de médio a grande porte.
*   **Redução de Código Repetitivo (Boilerplate)**: O Sequelize automatiza muitas tarefas repetitivas relacionadas ao banco de dados, como a criação de tabelas, validações e manipulação de relacionamentos, reduzindo a quantidade de código boilerplate necessário.
*   **Facilitação de Migrações e Sincronização**: O Sequelize possui um sistema robusto de migrações que permite gerenciar as alterações no schema do banco de dados de forma controlada e versionada, facilitando o desenvolvimento colaborativo e a implantação em diferentes ambientes.
*   **Documentação Interativa e Atualizada (Swagger)**: O Swagger/OpenAPI fornece uma interface interativa para explorar e testar a API. Ao integrar o Swagger, a documentação da API será gerada automaticamente a partir do código-fonte, garantindo que esteja sempre atualizada com as últimas alterações. Isso é crucial para o consumo da API por parte do frontend e por outros sistemas, além de facilitar o onboarding de novos desenvolvedores.
*   **Melhora na Qualidade da API**: Uma API bem documentada e com um backend robusto (via ORM) tende a ser mais consistente, confiável e fácil de usar, o que contribui para a qualidade geral do sistema.

## 3. Estrutura de Diretórios Proposta

Para acomodar o Sequelize e o Swagger, a estrutura de diretórios do backend será revisada e expandida. A nova estrutura proposta visa separar claramente as responsabilidades e seguir as melhores práticas de organização de projetos Node.js com ORM.

```
sistema-entregas/
├── backend/
│   ├── src/
│   │   ├── config/             # Configurações gerais (database, JWT, etc.)
│   │   │   └── database.js     # Configuração da conexão com o Sequelize
│   │   ├── middleware/         # Middlewares Express (autenticação, erros, etc.)
│   │   │   └── auth.js         # Middleware de autenticação JWT
│   │   ├── models/             # Definições dos modelos Sequelize
│   │   │   ├── index.js        # Arquivo principal para carregar modelos e associações
│   │   │   ├── Empresa.js
│   │   │   ├── Usuario.js
│   │   │   ├── Produto.js
│   │   │   └── Entrega.js
│   │   ├── controllers/        # Lógica de negócios para cada entidade
│   │   │   ├── authController.js
│   │   │   ├── empresaController.js
│   │   │   ├── usuarioController.js
│   │   │   ├── produtoController.js
│   │   │   └── entregaController.js
│   │   ├── routes/             # Definições das rotas da API
│   │   │   ├── authRoutes.js
│   │   │   ├── empresaRoutes.js
│   │   │   ├── usuarioRoutes.js
│   │   │   ├── produtoRoutes.js
│   │   │   └── entregaRoutes.js
│   │   ├── utils/              # Funções utilitárias (helpers, validadores, etc.)
│   │   │   └── swagger.js      # Configuração do Swagger
│   │   └── app.js              # Configuração principal do Express (substitui index.js)
│   ├── database/               # Scripts SQL e migrações (manter por referência)
│   │   ├── schema.sql
│   │   └── init.js
│   ├── .env                    # Variáveis de ambiente
│   ├── index.js                # Ponto de entrada da aplicação (apenas inicia app.js)
│   ├── package.json
│   └── docs/                   # Documentação adicional (como este plano)
│       └── analise_planejamento.md
└── frontend/                   # Aplicação React
```

**Observações sobre a nova estrutura:**

*   **`src/app.js`**: Este será o novo arquivo principal da aplicação Express, contendo a configuração do middleware, rotas e inicialização do servidor. O `index.js` na raiz do backend será simplificado para apenas importar e iniciar `app.js`.
*   **`src/models/index.js`**: Este arquivo será responsável por carregar todos os modelos definidos e configurar suas associações, garantindo que o Sequelize os reconheça corretamente.
*   **`src/utils/swagger.js`**: Este arquivo conterá a configuração do Swagger, incluindo as definições OpenAPI e as opções para gerar a documentação a partir dos comentários JSDoc.
*   **`database/`**: O diretório `database/` será mantido por referência, mas a criação e sincronização das tabelas serão gerenciadas pelo Sequelize. Os scripts SQL existentes podem ser úteis para referência ou para inicialização manual em cenários específicos.

## 4. Migração dos Schemas Existentes para Models do Sequelize

A migração dos schemas existentes para modelos do Sequelize envolverá a criação de um arquivo JavaScript para cada entidade (Empresa, Usuário, Produto, Entrega) dentro do diretório `src/models/`. Cada arquivo definirá o modelo correspondente, incluindo seus atributos, tipos de dados, validações e opções específicas do Sequelize.

### Exemplo de Estrutura de Model (Empresa.js):

```javascript
// src/models/Empresa.js

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Empresa = sequelize.define("Empresa", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    cnpj_cpf: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    razao_social: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    endereco: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    logo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    // created_at e updated_at são adicionados automaticamente pelo Sequelize
  }, {
    tableName: "empresas", // Nome da tabela no banco de dados
    timestamps: true, // Adiciona created_at e updated_at
    underscored: true, // Usa snake_case para os nomes das colunas (ex: created_at)
  });

  // Definição de associações será feita em src/models/index.js
  return Empresa;
};
```

### Associações entre Modelos

As associações entre as entidades (Empresa, Usuário, Produto, Entrega) serão definidas no arquivo `src/models/index.js`. Todas as entidades (Usuário, Produto, Entrega) terão uma associação `belongsTo` com a entidade `Empresa`, e a entidade `Empresa` terá associações `hasMany` com as outras entidades. Isso garantirá que todas as entidades estejam relacionadas com `empresa_id`, conforme solicitado.

### Exemplo de Associações (src/models/index.js):

```javascript
// src/models/index.js

const { Sequelize } = require("sequelize");
const config = require("../config/database");

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Empresa = require("./Empresa")(sequelize);
db.Usuario = require("./Usuario")(sequelize);
db.Produto = require("./Produto")(sequelize);
db.Entrega = require("./Entrega")(sequelize);

// Definir associações
db.Empresa.hasMany(db.Usuario, { foreignKey: "empresa_id", as: "usuarios" });
db.Usuario.belongsTo(db.Empresa, { foreignKey: "empresa_id", as: "empresa" });

db.Empresa.hasMany(db.Produto, { foreignKey: "empresa_id", as: "produtos" });
db.Produto.belongsTo(db.Empresa, { foreignKey: "empresa_id", as: "empresa" });

db.Empresa.hasMany(db.Entrega, { foreignKey: "empresa_id", as: "entregas" });
db.Entrega.belongsTo(db.Empresa, { foreignKey: "empresa_id", as: "empresa" });

db.Produto.hasMany(db.Entrega, { foreignKey: "produto_id", as: "entregas" });
db.Entrega.belongsTo(db.Produto, { foreignKey: "produto_id", as: "produto" });

module.exports = db;
```

## 5. Estratégia de Integração do Swagger/OpenAPI

A integração do Swagger será realizada utilizando as bibliotecas `swagger-ui-express` para servir a interface do usuário do Swagger e `swagger-jsdoc` para gerar a especificação OpenAPI a partir de comentários JSDoc no código-fonte. Esta abordagem permite manter a documentação próxima ao código, facilitando sua atualização.

### Passos para Integração do Swagger:

1.  **Instalação das Dependências**: Instalar `swagger-ui-express` e `swagger-jsdoc`.
2.  **Configuração do `swagger.js`**: Criar um arquivo `src/utils/swagger.js` que definirá as opções do Swagger, incluindo informações da API (título, versão, descrição), esquemas de segurança (JWT) e os caminhos para os arquivos onde as anotações JSDoc serão encontradas.
3.  **Anotações JSDoc nos Controllers**: Adicionar comentários JSDoc nos controllers para descrever os endpoints, parâmetros de requisição, modelos de resposta, tags e esquemas de segurança. O `swagger-jsdoc` lerá esses comentários e gerará a especificação OpenAPI.
4.  **Integração no Express**: No arquivo `src/app.js`, configurar o middleware `swagger-ui-express` para servir a interface do Swagger em uma rota específica (ex: `/api-docs`).

### Exemplo de Anotação JSDoc (em um controller):

```javascript
/**
 * @swagger
 * /api/produtos:
 *   get:
 *     summary: Retorna a lista de todos os produtos
 *     tags:
 *       - Produtos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de produtos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Produto'
 *       401:
 *         description: Não autorizado
 */
```

### Exemplo de Configuração do Swagger (src/utils/swagger.js):

```javascript
// src/utils/swagger.js

const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Controle de Entregas",
      version: "1.0.0",
      description: "Documentação da API do Sistema de Controle de Entregas",
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Servidor de Desenvolvimento",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        // Definir esquemas para os modelos aqui (ex: Produto, Usuario, etc.)
        // Exemplo:
        Produto: {
          type: "object",
          properties: {
            id: { type: "integer" },
            empresa_id: { type: "integer" },
            descricao: { type: "string" },
            preco_custo: { type: "number", format: "float" },
            preco_venda: { type: "number", format: "float" },
            estoque: { type: "integer" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        // ... outros schemas
      },
    },
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js"], // Caminhos para os arquivos com anotações
};

const specs = swaggerJsdoc(options);

module.exports = specs;
```

## 6. Plano de Testes

Após a adaptação do backend, será realizado um plano de testes abrangente para garantir que todas as funcionalidades continuem operando corretamente e que a integração do Sequelize e do Swagger esteja funcionando conforme o esperado.

### Tipos de Testes:

*   **Testes de Unidade**: Testar individualmente os métodos dos controllers e models para garantir que a lógica de negócios e as operações de banco de dados estejam corretas.
*   **Testes de Integração**: Testar o fluxo completo das requisições, desde a rota até o banco de dados, verificando a comunicação entre os componentes (rotas, middlewares, controllers, models, Sequelize).
*   **Testes de API (End-to-End)**: Utilizar ferramentas como Postman ou cURL para enviar requisições HTTP para todos os endpoints da API e verificar as respostas, incluindo status codes, dados retornados e tratamento de erros.
*   **Testes de Autenticação e Autorização**: Verificar se o middleware de autenticação está protegendo as rotas corretamente e se os diferentes tipos de usuário (master, admin, entregador) têm as permissões adequadas.
*   **Testes de Documentação (Swagger)**: Acessar a interface do Swagger (`/api-docs`) e verificar se todos os endpoints estão documentados, se os parâmetros e modelos de resposta estão corretos e se a funcionalidade de "Try it out" está operando.

## 7. Cronograma Estimado

| Fase                                     | Duração Estimada | Status      |
| :--------------------------------------- | :--------------- | :---------- |
| 1. Análise e Planejamento da Adaptação   | 1 dia            | Em Andamento |
| 2. Configuração do Sequelize e Modelos   | 2 dias           | Pendente    |
| 3. Implementação dos Controllers         | 3 dias           | Pendente    |
| 4. Atualização das Rotas                 | 1 dia            | Pendente    |
| 5. Integração do Swagger                 | 2 dias           | Pendente    |
| 6. Testes e Ajustes do Backend           | 2 dias           | Pendente    |
| 7. Atualização da Documentação e Entrega | 1 dia            | Pendente    |

**Total Estimado**: 12 dias

## 8. Conclusão

Este plano detalha a abordagem para adaptar o backend do sistema de controle de entregas para utilizar o Sequelize e integrar o Swagger. Acreditamos que esta adaptação trará benefícios significativos em termos de organização do código, manutenibilidade, padronização da interação com o banco de dados e qualidade da documentação da API. O cronograma estimado fornece uma visão geral do tempo necessário para cada fase, e o plano de testes garantirá a qualidade da implementação. Com esta adaptação, o backend estará mais robusto, escalável e fácil de ser desenvolvido e mantido no futuro.


