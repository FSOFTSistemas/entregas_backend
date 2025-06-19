
CREATE DATABASE IF NOT EXISTS sistema_entregas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sistema_entregas;

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS empresas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cnpj_cpf VARCHAR(20) NOT NULL UNIQUE,
    razao_social VARCHAR(255) NOT NULL,
    endereco TEXT NOT NULL,
    logo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo_usuario ENUM('master', 'admin', 'entregador') NOT NULL,
    empresa_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE RESTRICT
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    preco_custo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    preco_venda DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estoque INT NOT NULL DEFAULT 0,
    empresa_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE RESTRICT
);

-- Tabela de entregas
CREATE TABLE IF NOT EXISTS entregas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    descricao TEXT NOT NULL,
    cliente VARCHAR(255),
    data DATE NOT NULL,
    status ENUM('pendente', 'em_transito', 'entregue', 'cancelada') NOT NULL DEFAULT 'pendente',
    empresa_id INT NOT NULL,
    entregador_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE RESTRICT,
    FOREIGN KEY (entregador_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Índices para melhorar performance
CREATE INDEX idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_produtos_empresa ON produtos(empresa_id);
CREATE INDEX idx_entregas_empresa ON entregas(empresa_id);
CREATE INDEX idx_entregas_produto ON entregas(produto_id);
CREATE INDEX idx_entregas_entregador ON entregas(entregador_id);
CREATE INDEX idx_entregas_status ON entregas(status);
CREATE INDEX idx_entregas_data ON entregas(data);

-- Dados iniciais para teste
-- Inserir empresa de exemplo
INSERT INTO empresas (cnpj_cpf, razao_social, endereco, logo) VALUES 
('12.345.678/0001-90', 'Empresa Exemplo LTDA', 'Rua das Flores, 123 - Centro - São Paulo/SP', NULL);

-- Inserir usuário master inicial (senha: admin123)
INSERT INTO usuarios (nome, email, senha, tipo_usuario, empresa_id) VALUES 
('Administrador Master', 'admin@exemplo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'master', 1);

-- Inserir alguns produtos de exemplo
INSERT INTO produtos (descricao, preco_custo, preco_venda, estoque, empresa_id) VALUES 
('Produto A', 10.50, 15.00, 100, 1),
('Produto B', 25.00, 35.00, 50, 1),
('Produto C', 8.75, 12.50, 200, 1);

-- Inserir algumas entregas de exemplo
INSERT INTO entregas (produto_id, quantidade, descricao, cliente, data, status, empresa_id) VALUES 
(1, 5, 'Entrega para cliente João', 'João Silva', CURDATE(), 'pendente', 1),
(2, 2, 'Entrega para cliente Maria', 'Maria Santos', CURDATE(), 'em_transito', 1),
(3, 10, 'Entrega para cliente Pedro', 'Pedro Oliveira', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'entregue', 1);

