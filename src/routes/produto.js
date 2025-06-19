const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken, checkEmpresa } = require('../middleware/auth');

const router = express.Router();

// Listar produtos da empresa
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT p.*, e.razao_social, e.cnpj_cpf
      FROM produtos p 
      JOIN empresas e ON p.empresa_id = e.id
    `;
    let params = [];

    // Se não for master, filtrar pela empresa do usuário
    if (req.user.tipo_usuario !== 'master') {
      query += ' WHERE p.empresa_id = ?';
      params.push(req.user.empresa_id);
    }

    query += ' ORDER BY p.descricao';
    
    const produtos = await executeQuery(query, params);
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar produto por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT p.*, e.razao_social, e.cnpj_cpf
      FROM produtos p 
      JOIN empresas e ON p.empresa_id = e.id 
      WHERE p.id = ?
    `;
    const produtos = await executeQuery(query, [id]);

    if (produtos.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    const produto = produtos[0];

    // Verificar se o usuário pode acessar este produto
    if (req.user.tipo_usuario !== 'master' && produto.empresa_id !== req.user.empresa_id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json(produto);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar novo produto
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { descricao, preco_custo, preco_venda, estoque, empresa_id } = req.body;

    if (!descricao || preco_custo === undefined || preco_venda === undefined || estoque === undefined || !empresa_id) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    // Verificar se o usuário pode criar produtos para esta empresa
    if (req.user.tipo_usuario !== 'master' && parseInt(empresa_id) !== req.user.empresa_id) {
      return res.status(403).json({ message: 'Você só pode criar produtos para sua própria empresa' });
    }

    // Validar valores numéricos
    if (preco_custo < 0 || preco_venda < 0 || estoque < 0) {
      return res.status(400).json({ message: 'Preços e estoque não podem ser negativos' });
    }

    // Verificar se a empresa existe
    const empresaQuery = 'SELECT id FROM empresas WHERE id = ?';
    const empresa = await executeQuery(empresaQuery, [empresa_id]);

    if (empresa.length === 0) {
      return res.status(400).json({ message: 'Empresa não encontrada' });
    }

    const query = `
      INSERT INTO produtos (descricao, preco_custo, preco_venda, estoque, empresa_id, created_at) 
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    const result = await executeQuery(query, [descricao, preco_custo, preco_venda, estoque, empresa_id]);

    res.status(201).json({
      message: 'Produto criado com sucesso',
      id: result.insertId
    });

  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar produto
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, preco_custo, preco_venda, estoque, empresa_id } = req.body;

    if (!descricao || preco_custo === undefined || preco_venda === undefined || estoque === undefined || !empresa_id) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    // Verificar se o produto existe
    const checkQuery = 'SELECT * FROM produtos WHERE id = ?';
    const existing = await executeQuery(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    const produto = existing[0];

    // Verificar permissões
    if (req.user.tipo_usuario !== 'master' && produto.empresa_id !== req.user.empresa_id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Verificar se o usuário pode alterar a empresa do produto
    if (parseInt(empresa_id) !== produto.empresa_id && req.user.tipo_usuario !== 'master') {
      return res.status(403).json({ message: 'Você não pode transferir produtos para outra empresa' });
    }

    // Validar valores numéricos
    if (preco_custo < 0 || preco_venda < 0 || estoque < 0) {
      return res.status(400).json({ message: 'Preços e estoque não podem ser negativos' });
    }

    const query = `
      UPDATE produtos 
      SET descricao = ?, preco_custo = ?, preco_venda = ?, estoque = ?, empresa_id = ?, updated_at = NOW() 
      WHERE id = ?
    `;
    await executeQuery(query, [descricao, preco_custo, preco_venda, estoque, empresa_id, id]);

    res.json({ message: 'Produto atualizado com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Deletar produto
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o produto existe
    const checkQuery = 'SELECT * FROM produtos WHERE id = ?';
    const existing = await executeQuery(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    const produto = existing[0];

    // Verificar permissões
    if (req.user.tipo_usuario !== 'master' && produto.empresa_id !== req.user.empresa_id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Verificar se existem entregas vinculadas ao produto
    const entregasQuery = 'SELECT COUNT(*) as count FROM entregas WHERE produto_id = ?';
    const entregasCount = await executeQuery(entregasQuery, [id]);

    if (entregasCount[0].count > 0) {
      return res.status(400).json({ message: 'Não é possível deletar produto com entregas vinculadas' });
    }

    const query = 'DELETE FROM produtos WHERE id = ?';
    await executeQuery(query, [id]);

    res.json({ message: 'Produto deletado com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar estoque do produto
router.patch('/:id/estoque', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { estoque } = req.body;

    if (estoque === undefined) {
      return res.status(400).json({ message: 'Estoque é obrigatório' });
    }

    // Verificar se o produto existe
    const checkQuery = 'SELECT * FROM produtos WHERE id = ?';
    const existing = await executeQuery(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    const produto = existing[0];

    // Verificar permissões
    if (req.user.tipo_usuario !== 'master' && produto.empresa_id !== req.user.empresa_id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Validar estoque
    if (estoque < 0) {
      return res.status(400).json({ message: 'Estoque não pode ser negativo' });
    }

    const query = 'UPDATE produtos SET estoque = ?, updated_at = NOW() WHERE id = ?';
    await executeQuery(query, [estoque, id]);

    res.json({ message: 'Estoque atualizado com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;

