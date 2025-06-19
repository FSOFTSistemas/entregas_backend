const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Listar entregas da empresa
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, data_inicio, data_fim } = req.query;
    
    let query = `
      SELECT e.*, p.descricao as produto_descricao, p.preco_venda,
             emp.razao_social, emp.cnpj_cpf,
             u.nome as entregador_nome
      FROM entregas e 
      JOIN produtos p ON e.produto_id = p.id
      JOIN empresas emp ON e.empresa_id = emp.id
      LEFT JOIN usuarios u ON e.entregador_id = u.id
    `;
    let params = [];
    let conditions = [];

    // Se não for master, filtrar pela empresa do usuário
    if (req.user.tipo_usuario !== 'master') {
      conditions.push('e.empresa_id = ?');
      params.push(req.user.empresa_id);
    }

    // Filtrar por status se fornecido
    if (status) {
      conditions.push('e.status = ?');
      params.push(status);
    }

    // Filtrar por data se fornecido
    if (data_inicio) {
      conditions.push('DATE(e.data) >= ?');
      params.push(data_inicio);
    }

    if (data_fim) {
      conditions.push('DATE(e.data) <= ?');
      params.push(data_fim);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY e.created_at DESC';
    
    const entregas = await executeQuery(query, params);
    res.json(entregas);
  } catch (error) {
    console.error('Erro ao listar entregas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar entrega por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT e.*, p.descricao as produto_descricao, p.preco_venda,
             emp.razao_social, emp.cnpj_cpf,
             u.nome as entregador_nome, u.email as entregador_email
      FROM entregas e 
      JOIN produtos p ON e.produto_id = p.id
      JOIN empresas emp ON e.empresa_id = emp.id
      LEFT JOIN usuarios u ON e.entregador_id = u.id
      WHERE e.id = ?
    `;
    const entregas = await executeQuery(query, [id]);

    if (entregas.length === 0) {
      return res.status(404).json({ message: 'Entrega não encontrada' });
    }

    const entrega = entregas[0];

    // Verificar se o usuário pode acessar esta entrega
    if (req.user.tipo_usuario !== 'master' && entrega.empresa_id !== req.user.empresa_id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json(entrega);
  } catch (error) {
    console.error('Erro ao buscar entrega:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar nova entrega
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { produto_id, quantidade, descricao, cliente, data, empresa_id, entregador_id } = req.body;

    if (!produto_id || !quantidade || !descricao || !data || !empresa_id) {
      return res.status(400).json({ message: 'Produto, quantidade, descrição, data e empresa são obrigatórios' });
    }

    // Verificar se o usuário pode criar entregas para esta empresa
    if (req.user.tipo_usuario !== 'master' && parseInt(empresa_id) !== req.user.empresa_id) {
      return res.status(403).json({ message: 'Você só pode criar entregas para sua própria empresa' });
    }

    // Validar quantidade
    if (quantidade <= 0) {
      return res.status(400).json({ message: 'Quantidade deve ser maior que zero' });
    }

    // Verificar se o produto existe e pertence à empresa
    const produtoQuery = 'SELECT * FROM produtos WHERE id = ? AND empresa_id = ?';
    const produtos = await executeQuery(produtoQuery, [produto_id, empresa_id]);

    if (produtos.length === 0) {
      return res.status(400).json({ message: 'Produto não encontrado ou não pertence à empresa' });
    }

    const produto = produtos[0];

    // Verificar se há estoque suficiente
    if (produto.estoque < quantidade) {
      return res.status(400).json({ message: 'Estoque insuficiente' });
    }

    // Verificar se o entregador existe e pertence à empresa (se fornecido)
    if (entregador_id) {
      const entregadorQuery = 'SELECT * FROM usuarios WHERE id = ? AND empresa_id = ? AND tipo_usuario = ?';
      const entregadores = await executeQuery(entregadorQuery, [entregador_id, empresa_id, 'entregador']);

      if (entregadores.length === 0) {
        return res.status(400).json({ message: 'Entregador não encontrado ou não pertence à empresa' });
      }
    }

    // Iniciar transação para criar entrega e atualizar estoque
    const connection = await require('../config/database').pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Criar entrega
      const entregaQuery = `
        INSERT INTO entregas (produto_id, quantidade, descricao, cliente, data, status, empresa_id, entregador_id, created_at) 
        VALUES (?, ?, ?, ?, ?, 'pendente', ?, ?, NOW())
      `;
      const [result] = await connection.execute(entregaQuery, [produto_id, quantidade, descricao, cliente, data, empresa_id, entregador_id]);

      // Atualizar estoque do produto
      const updateEstoqueQuery = 'UPDATE produtos SET estoque = estoque - ?, updated_at = NOW() WHERE id = ?';
      await connection.execute(updateEstoqueQuery, [quantidade, produto_id]);

      await connection.commit();
      connection.release();

      res.status(201).json({
        message: 'Entrega criada com sucesso',
        id: result.insertId
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Erro ao criar entrega:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar entrega
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { produto_id, quantidade, descricao, cliente, data, status, entregador_id } = req.body;

    if (!produto_id || !quantidade || !descricao || !data || !status) {
      return res.status(400).json({ message: 'Produto, quantidade, descrição, data e status são obrigatórios' });
    }

    // Verificar se a entrega existe
    const checkQuery = 'SELECT * FROM entregas WHERE id = ?';
    const existing = await executeQuery(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Entrega não encontrada' });
    }

    const entrega = existing[0];

    // Verificar permissões
    if (req.user.tipo_usuario !== 'master' && entrega.empresa_id !== req.user.empresa_id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Validar status
    const statusValidos = ['pendente', 'em_transito', 'entregue', 'cancelada'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    // Validar quantidade
    if (quantidade <= 0) {
      return res.status(400).json({ message: 'Quantidade deve ser maior que zero' });
    }

    // Verificar se o produto existe e pertence à empresa
    const produtoQuery = 'SELECT * FROM produtos WHERE id = ? AND empresa_id = ?';
    const produtos = await executeQuery(produtoQuery, [produto_id, entrega.empresa_id]);

    if (produtos.length === 0) {
      return res.status(400).json({ message: 'Produto não encontrado ou não pertence à empresa' });
    }

    // Verificar se o entregador existe e pertence à empresa (se fornecido)
    if (entregador_id) {
      const entregadorQuery = 'SELECT * FROM usuarios WHERE id = ? AND empresa_id = ? AND tipo_usuario = ?';
      const entregadores = await executeQuery(entregadorQuery, [entregador_id, entrega.empresa_id, 'entregador']);

      if (entregadores.length === 0) {
        return res.status(400).json({ message: 'Entregador não encontrado ou não pertence à empresa' });
      }
    }

    const query = `
      UPDATE entregas 
      SET produto_id = ?, quantidade = ?, descricao = ?, cliente = ?, data = ?, status = ?, entregador_id = ?, updated_at = NOW() 
      WHERE id = ?
    `;
    await executeQuery(query, [produto_id, quantidade, descricao, cliente, data, status, entregador_id, id]);

    res.json({ message: 'Entrega atualizada com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar entrega:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar status da entrega
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status é obrigatório' });
    }

    // Verificar se a entrega existe
    const checkQuery = 'SELECT * FROM entregas WHERE id = ?';
    const existing = await executeQuery(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Entrega não encontrada' });
    }

    const entrega = existing[0];

    // Verificar permissões
    if (req.user.tipo_usuario !== 'master' && entrega.empresa_id !== req.user.empresa_id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Validar status
    const statusValidos = ['pendente', 'em_transito', 'entregue', 'cancelada'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    const query = 'UPDATE entregas SET status = ?, updated_at = NOW() WHERE id = ?';
    await executeQuery(query, [status, id]);

    res.json({ message: 'Status da entrega atualizado com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar status da entrega:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Deletar entrega
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a entrega existe
    const checkQuery = 'SELECT * FROM entregas WHERE id = ?';
    const existing = await executeQuery(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Entrega não encontrada' });
    }

    const entrega = existing[0];

    // Verificar permissões
    if (req.user.tipo_usuario !== 'master' && entrega.empresa_id !== req.user.empresa_id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Apenas permitir deletar entregas pendentes ou canceladas
    if (entrega.status !== 'pendente' && entrega.status !== 'cancelada') {
      return res.status(400).json({ message: 'Apenas entregas pendentes ou canceladas podem ser deletadas' });
    }

    // Iniciar transação para deletar entrega e restaurar estoque
    const connection = await require('../config/database').pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Deletar entrega
      const deleteQuery = 'DELETE FROM entregas WHERE id = ?';
      await connection.execute(deleteQuery, [id]);

      // Restaurar estoque se a entrega estava pendente
      if (entrega.status === 'pendente') {
        const updateEstoqueQuery = 'UPDATE produtos SET estoque = estoque + ?, updated_at = NOW() WHERE id = ?';
        await connection.execute(updateEstoqueQuery, [entrega.quantidade, entrega.produto_id]);
      }

      await connection.commit();
      connection.release();

      res.json({ message: 'Entrega deletada com sucesso' });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error('Erro ao deletar entrega:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Listar entregas por entregador
router.get('/entregador/:entregadorId', authenticateToken, async (req, res) => {
  try {
    const { entregadorId } = req.params;
    
    const query = `
      SELECT e.*, p.descricao as produto_descricao, p.preco_venda,
             emp.razao_social, emp.cnpj_cpf
      FROM entregas e 
      JOIN produtos p ON e.produto_id = p.id
      JOIN empresas emp ON e.empresa_id = emp.id
      WHERE e.entregador_id = ? AND e.empresa_id = ?
      ORDER BY e.created_at DESC
    `;
    
    const entregas = await executeQuery(query, [entregadorId, req.user.empresa_id]);
    res.json(entregas);
  } catch (error) {
    console.error('Erro ao listar entregas do entregador:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;

