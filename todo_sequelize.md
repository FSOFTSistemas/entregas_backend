# Adaptação do Backend para Sequelize e Swagger

## Fase 1: Análise e Planejamento da Adaptação
- [x] Pesquisar sobre Sequelize e sua integração com Node.js e MySQL
- [x] Definir a estrutura de diretórios para models e controllers
- [x] Planejar a migração dos schemas existentes para models do Sequelize
- [x] Pesquisar sobre Swagger/OpenAPI para documentação de APIs Node.js
- [x] Definir a estratégia de integração do Swagger

## Fase 2: Configuração do Sequelize e Modelos
- [x] Instalar Sequelize e dependências
- [x] Configurar conexão com o banco de dados usando Sequelize
- [x] Criar models para Empresas, Usuários, Produtos e Entregas
- [x] Definir associações entre os models
- [x] Sincronizar models com o banco de dados

## Fase 3: Implementação dos Controllers
- [x] Criar controllers para cada entidade (Empresas, Usuários, Produtos, Entregas)
- [x] Migrar a lógica de negócios das rotas para os controllers
- [x] Implementar operações CRUD nos controllers usando Sequelize

## Fase 4: Atualização das Rotas
- [x] Atualizar as rotas para chamar os métodos dos controllers
- [x] Remover a lógica de banco de dados diretamente das rotas
- [x] Simplificar as rotas para apenas orquestrar requisições
- [ ] Manter o middleware de autenticação nas rotas

## Fase 5: Integração do Swagger
- [x] Instalar dependências do Swagger (swagger-ui-express, swagger-jsdoc)
- [x] Criar arquivo de configuração do Swagger
- [x] Adicionar anotações JSDoc nos controllers para gerar a documentação
- [x] Integrar a UI do Swagger no Express

## Fase 6: Testes e Ajustes do Backend
- [x] Testar todas as rotas da API com Postman/cURL
- [x] Verificar a funcionalidade CRUD para todas as entidades
- [x] Testar autenticação e autorização
- [x] Testar a documentação do Swagger
- [x] Corrigir bugs e fazer ajustes finos

## Fase 7: Atualização da Documentação e Entrega Final
- [x] Atualizar o README.md com as novas instruções de instalação e uso do Sequelize e Swagger
- [x] Gerar documentação final do projeto
- [x] Criar guia de migração detalhado
- [x] Preparar a entrega final para o usuário


