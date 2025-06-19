# Sistema de Controle de Entregas

## Visão Geral

O Sistema de Controle de Entregas é uma aplicação web completa desenvolvida com React no frontend e Node.js no backend, utilizando MySQL como banco de dados. O sistema permite o gerenciamento completo de entregas, produtos, usuários e empresas.

## Arquitetura do Sistema

### Frontend (React)
- **Framework**: React 19.1.0 com Vite
- **UI Components**: shadcn/ui com Tailwind CSS
- **Roteamento**: React Router DOM
- **Requisições HTTP**: Axios
- **Autenticação**: Context API com JWT

### Backend (Node.js)
- **Framework**: Express.js
- **Banco de Dados**: MySQL 8.0
- **Autenticação**: JWT (JSON Web Tokens)
- **Criptografia**: bcryptjs para senhas
- **CORS**: Habilitado para comunicação frontend-backend

### Banco de Dados (MySQL)
- **Entidades**: Empresas, Usuários, Produtos, Entregas
- **Relacionamentos**: Todas as entidades relacionadas por empresa_id
- **Charset**: UTF8MB4 para suporte completo a caracteres especiais

## Estrutura do Projeto

```
sistema-entregas/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── empresa.js
│   │       ├── usuario.js
│   │       ├── produto.js
│   │       └── entrega.js
│   ├── database/
│   │   ├── schema.sql
│   │   └── init.js
│   ├── .env
│   ├── index.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── Layout.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Produtos.jsx
│   │   │   ├── Usuarios.jsx
│   │   │   ├── Entregas.jsx
│   │   │   └── Empresas.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
└── README.md
```

## Entidades do Sistema

### 1. Empresas
- **Campos**: id, cnpj_cpf, razao_social, endereco, logo, created_at, updated_at
- **Descrição**: Entidade principal que agrupa todos os outros dados
- **Acesso**: Apenas usuários master podem gerenciar

### 2. Usuários
- **Campos**: id, empresa_id, nome, email, senha, tipo_usuario, created_at, updated_at
- **Tipos**: master, admin, entregador
- **Descrição**: Usuários do sistema com diferentes níveis de acesso

### 3. Produtos
- **Campos**: id, empresa_id, descricao, preco_custo, preco_venda, estoque, created_at, updated_at
- **Descrição**: Catálogo de produtos da empresa
- **Acesso**: Usuários admin e master

### 4. Entregas
- **Campos**: id, empresa_id, produto_id, quantidade, descricao, cliente, timestamp, data, status, created_at, updated_at
- **Status**: pendente, em_transito, entregue
- **Descrição**: Controle de entregas e acompanhamento

## Funcionalidades Implementadas

### Autenticação e Autorização
- Login com email e senha
- Autenticação JWT
- Controle de acesso por tipo de usuário
- Sessão persistente no localStorage

### Dashboard
- Visão geral das entregas
- Estatísticas em tempo real
- Filtros por status (pendentes, em trânsito, entregues)
- Cards informativos com contadores

### Gestão de Produtos
- CRUD completo (Create, Read, Update, Delete)
- Busca e filtros
- Controle de estoque
- Preços de custo e venda

### Gestão de Usuários
- CRUD completo para usuários
- Diferentes tipos de usuário
- Associação com empresas
- Senhas criptografadas

### Gestão de Entregas
- Criação de novas entregas
- Acompanhamento em tempo real
- Alteração de status
- Filtros por status e data
- Informações detalhadas do cliente

### Gestão de Empresas (Master)
- CRUD completo para empresas
- Upload de logo
- Informações completas (CNPJ/CPF, endereço)
- Acesso restrito a usuários master

## Tecnologias Utilizadas

### Frontend
- **React 19.1.0**: Framework principal
- **Vite**: Build tool e dev server
- **Tailwind CSS**: Framework de estilos
- **shadcn/ui**: Biblioteca de componentes
- **Lucide React**: Ícones
- **React Router DOM**: Roteamento
- **Axios**: Cliente HTTP

### Backend
- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web
- **MySQL2**: Driver MySQL
- **bcryptjs**: Criptografia de senhas
- **jsonwebtoken**: Autenticação JWT
- **cors**: Cross-Origin Resource Sharing
- **dotenv**: Variáveis de ambiente

### Banco de Dados
- **MySQL 8.0**: Sistema de gerenciamento de banco de dados
- **UTF8MB4**: Charset para suporte completo a caracteres

## Segurança

### Autenticação
- Senhas criptografadas com bcrypt (salt rounds: 10)
- Tokens JWT com expiração
- Middleware de autenticação em rotas protegidas

### Autorização
- Controle de acesso baseado em roles
- Verificação de permissões por tipo de usuário
- Rotas protegidas no frontend e backend

### Validação
- Validação de dados no frontend e backend
- Sanitização de inputs
- Tratamento de erros adequado

## Performance

### Frontend
- Lazy loading de componentes
- Otimização de re-renders com React
- Build otimizado com Vite
- CSS otimizado com Tailwind

### Backend
- Pool de conexões MySQL
- Middleware eficiente
- Tratamento adequado de erros
- CORS configurado adequadamente

## Responsividade

O sistema foi desenvolvido com design responsivo, funcionando adequadamente em:
- Desktop (1920x1080 e superiores)
- Tablets (768px - 1024px)
- Smartphones (320px - 767px)

## Dados de Teste

O sistema vem com dados de exemplo pré-configurados:

### Usuário Master
- **Email**: admin@exemplo.com
- **Senha**: admin123
- **Tipo**: master
- **Empresa**: Empresa Exemplo LTDA

### Produtos de Exemplo
- Produto A: R$ 10,50 (custo) / R$ 15,00 (venda) - 100 unidades
- Produto B: R$ 25,00 (custo) / R$ 35,00 (venda) - 50 unidades  
- Produto C: R$ 8,75 (custo) / R$ 12,50 (venda) - 200 unidades

### Entregas de Exemplo
- Entrega pendente: Produto A para João Silva
- Entrega em trânsito: Produto B para Maria Santos
- Entrega concluída: Produto C para Pedro Oliveira



## Instalação e Configuração

### Pré-requisitos

- **Node.js**: versão 18.0 ou superior
- **MySQL**: versão 8.0 ou superior
- **npm** ou **pnpm**: gerenciador de pacotes

### 1. Configuração do Banco de Dados

#### Instalar MySQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# Iniciar o serviço
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### Configurar acesso root
```bash
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY ''; FLUSH PRIVILEGES;"
```

#### Criar banco de dados
```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS sistema_entregas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2. Configuração do Backend

#### Navegar para o diretório do backend
```bash
cd sistema-entregas/backend
```

#### Instalar dependências
```bash
npm install
```

#### Configurar variáveis de ambiente
Edite o arquivo `.env` com suas configurações:
```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=sistema_entregas
JWT_SECRET=seu_jwt_secret_aqui_muito_seguro_123456789
```

#### Executar script de criação das tabelas
```bash
mysql -u root sistema_entregas < database/schema.sql
```

#### Iniciar o servidor backend
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

O backend estará rodando em `http://localhost:3001`

### 3. Configuração do Frontend

#### Navegar para o diretório do frontend
```bash
cd sistema-entregas/frontend
```

#### Instalar dependências
```bash
pnpm install
# ou
npm install
```

#### Iniciar o servidor frontend
```bash
# Desenvolvimento
pnpm run dev
# ou
npm run dev

# Build para produção
pnpm run build
# ou
npm run build
```

O frontend estará rodando em `http://localhost:5173`

### 4. Verificação da Instalação

#### Testar API do backend
```bash
curl http://localhost:3001/api/health
```

Resposta esperada:
```json
{
  "message": "API funcionando corretamente!",
  "timestamp": "2025-06-18T17:19:34.800Z"
}
```

#### Acessar o sistema
1. Abra o navegador em `http://localhost:5173`
2. Faça login com as credenciais de teste:
   - **Email**: admin@exemplo.com
   - **Senha**: admin123

## Scripts Disponíveis

### Backend
```bash
npm start          # Iniciar em produção
npm run dev        # Iniciar em desenvolvimento com nodemon
npm run init-db    # Inicializar banco de dados (alternativo)
```

### Frontend
```bash
pnpm run dev       # Servidor de desenvolvimento
pnpm run build     # Build para produção
pnpm run preview   # Preview do build de produção
pnpm run lint      # Verificar código com ESLint
```

## Configuração de Produção

### Backend
1. Configure as variáveis de ambiente adequadamente
2. Use um processo manager como PM2:
```bash
npm install -g pm2
pm2 start index.js --name "sistema-entregas-backend"
```

### Frontend
1. Faça o build da aplicação:
```bash
pnpm run build
```
2. Sirva os arquivos estáticos com nginx ou Apache

### Banco de Dados
1. Configure backup automático
2. Otimize as configurações do MySQL para produção
3. Configure SSL se necessário

## Troubleshooting

### Problemas Comuns

#### Erro de conexão com MySQL
- Verifique se o MySQL está rodando: `sudo systemctl status mysql`
- Verifique as credenciais no arquivo `.env`
- Teste a conexão: `mysql -u root -p`

#### Erro CORS no frontend
- Verifique se o backend está rodando na porta correta
- Confirme que o CORS está habilitado no backend

#### Erro de autenticação
- Verifique se o JWT_SECRET está configurado
- Limpe o localStorage do navegador
- Verifique se a senha está corretamente hasheada no banco

#### Porta já em uso
```bash
# Verificar processos na porta
lsof -i :3001  # Backend
lsof -i :5173  # Frontend

# Matar processo se necessário
kill -9 <PID>
```

### Logs e Debug

#### Backend
Os logs são exibidos no console. Para debug adicional:
```javascript
// Adicionar no código
console.log('Debug info:', variavel);
```

#### Frontend
Use as ferramentas de desenvolvedor do navegador:
- Console para logs JavaScript
- Network para requisições HTTP
- Application para localStorage/sessionStorage

## Manutenção

### Backup do Banco de Dados
```bash
mysqldump -u root sistema_entregas > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar Backup
```bash
mysql -u root sistema_entregas < backup_20250618_171900.sql
```

### Atualização de Dependências
```bash
# Backend
cd backend && npm update

# Frontend  
cd frontend && pnpm update
```

### Monitoramento
- Configure logs adequados para produção
- Use ferramentas como New Relic ou DataDog para monitoramento
- Configure alertas para erros críticos


## API Endpoints

### Autenticação
```
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/me
```

### Empresas
```
GET    /api/empresas
POST   /api/empresas
GET    /api/empresas/:id
PUT    /api/empresas/:id
DELETE /api/empresas/:id
```

### Usuários
```
GET    /api/usuarios
POST   /api/usuarios
GET    /api/usuarios/:id
PUT    /api/usuarios/:id
DELETE /api/usuarios/:id
```

### Produtos
```
GET    /api/produtos
POST   /api/produtos
GET    /api/produtos/:id
PUT    /api/produtos/:id
DELETE /api/produtos/:id
```

### Entregas
```
GET    /api/entregas
POST   /api/entregas
GET    /api/entregas/:id
PUT    /api/entregas/:id
DELETE /api/entregas/:id
PATCH  /api/entregas/:id/status
```

### Health Check
```
GET /api/health
```

## Exemplos de Uso da API

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@exemplo.com",
    "password": "admin123"
  }'
```

### Criar Produto
```bash
curl -X POST http://localhost:3001/api/produtos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu_token_jwt>" \
  -d '{
    "descricao": "Produto Teste",
    "preco_custo": 10.50,
    "preco_venda": 15.00,
    "estoque": 100
  }'
```

### Listar Entregas
```bash
curl -X GET http://localhost:3001/api/entregas \
  -H "Authorization: Bearer <seu_token_jwt>"
```

## Estrutura do Banco de Dados

### Tabela: empresas
```sql
CREATE TABLE empresas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cnpj_cpf VARCHAR(20) NOT NULL UNIQUE,
  razao_social VARCHAR(255) NOT NULL,
  endereco TEXT NOT NULL,
  logo VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Tabela: usuarios
```sql
CREATE TABLE usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  empresa_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  tipo_usuario ENUM('master', 'admin', 'entregador') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);
```

### Tabela: produtos
```sql
CREATE TABLE produtos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  empresa_id INT NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  preco_custo DECIMAL(10,2) NOT NULL,
  preco_venda DECIMAL(10,2) NOT NULL,
  estoque INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);
```

### Tabela: entregas
```sql
CREATE TABLE entregas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  empresa_id INT NOT NULL,
  produto_id INT NOT NULL,
  quantidade INT NOT NULL,
  descricao TEXT,
  cliente VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data DATE NOT NULL,
  status ENUM('pendente', 'em_transito', 'entregue') DEFAULT 'pendente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);
```

## Contribuição

### Padrões de Código

#### Frontend (React)
- Use componentes funcionais com hooks
- Mantenha componentes pequenos e reutilizáveis
- Use TypeScript para tipagem (opcional)
- Siga as convenções do ESLint configurado

#### Backend (Node.js)
- Use async/await para operações assíncronas
- Mantenha rotas organizadas em arquivos separados
- Implemente tratamento adequado de erros
- Use middleware para funcionalidades comuns

#### Banco de Dados
- Use transações para operações críticas
- Mantenha índices adequados para performance
- Normalize adequadamente as tabelas
- Use constraints para integridade dos dados

### Git Workflow
1. Crie uma branch para cada feature: `git checkout -b feature/nova-funcionalidade`
2. Faça commits pequenos e descritivos
3. Teste antes de fazer push
4. Crie pull request para review

## Licença

Este projeto é licenciado sob a MIT License - veja o arquivo LICENSE para detalhes.

## Suporte

Para suporte técnico ou dúvidas sobre o sistema:

1. Verifique a documentação acima
2. Consulte a seção de troubleshooting
3. Verifique os logs do sistema
4. Entre em contato com a equipe de desenvolvimento

## Changelog

### v1.0.0 (2025-06-18)
- ✅ Sistema completo de autenticação
- ✅ CRUD completo para todas as entidades
- ✅ Dashboard com estatísticas
- ✅ Sistema de entregas com acompanhamento
- ✅ Interface responsiva
- ✅ Integração frontend-backend
- ✅ Banco de dados MySQL configurado
- ✅ Documentação completa

## Roadmap Futuro

### Próximas Funcionalidades
- [ ] Notificações em tempo real
- [ ] Relatórios em PDF
- [ ] Integração com APIs de entrega
- [ ] App mobile
- [ ] Dashboard analytics avançado
- [ ] Sistema de backup automático
- [ ] Multi-tenancy aprimorado
- [ ] API REST documentada com Swagger

---

**Desenvolvido com ❤️ usando React, Node.js e MySQL**

# Entregas
# Entregas_backend
# Entregas_backend
# entregas_backend
