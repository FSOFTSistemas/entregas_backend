const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken, requireMaster } = require('../middleware/auth');

const router = express.Router();

// Listar todas as empresas (apenas master)
router.get('/', authenticateToken, requireMaster, async (req, res) => {
  try {
    const query = 'SELECT * FROM empresas ORDER BY razao_social';
    const empresas = await executeQuery(query);
    res.json(empresas);
  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar empresa por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário pode acessar esta empresa
    if (req.user.tipo_usuario !== 'master' && parseInt(id) !== req.user.empresa_id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const query = 'SELECT * FROM empresas WHERE id = ?';
    const empresas = await executeQuery(query, [id]);

    if (empresas.length === 0) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    res.json(empresas[0]);
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar nova empresa (apenas master)
router.post('/', authenticateToken, requireMaster, async (req, res) => {
  try {
    const { cnpj_cpf, razao_social, endereco, logo } = req.body;

    if (!cnpj_cpf || !razao_social || !endereco) {
      return res.status(400).json({ message: 'CNPJ/CPF, razão social e endereço são obrigatórios' });
    }

    // Verificar se já existe empresa com este CNPJ/CPF
    const checkQuery = 'SELECT id FROM empresas WHERE cnpj_cpf = ?';
    const existing = await executeQuery(checkQuery, [cnpj_cpf]);

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Já existe uma empresa com este CNPJ/CPF' });
    }

    const query = `
      INSERT INTO empresas (cnpj_cpf, razao_social, endereco, logo, created_at) 
      VALUES (?, ?, ?, ?, NOW())
    `;
    const result = await executeQuery(query, [cnpj_cpf, razao_social, endereco, logo]);

    res.status(201).json({
      message: 'Empresa criada com sucesso',
      id: result.insertId
    });

  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar empresa
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { cnpj_cpf, razao_social, endereco, logo } = req.body;

    // Verificar se o usuário pode editar esta empresa
    if (req.user.tipo_usuario !== 'master' && parseInt(id) !== req.user.empresa_id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    if (!cnpj_cpf || !razao_social || !endereco) {
      return res.status(400).json({ message: 'CNPJ/CPF, razão social e endereço são obrigatórios' });
    }

    // Verificar se a empresa existe
    const checkQuery = 'SELECT id FROM empresas WHERE id = ?';
    const existing = await executeQuery(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    // Verificar se já existe outra empresa com este CNPJ/CPF
    const duplicateQuery = 'SELECT id FROM empresas WHERE cnpj_cpf = ? AND id != ?';
    const duplicate = await executeQuery(duplicateQuery, [cnpj_cpf, id]);

    if (duplicate.length > 0) {
      return res.status(400).json({ message: 'Já existe outra empresa com este CNPJ/CPF' });
    }

    const query = `
      UPDATE empresas 
      SET cnpj_cpf = ?, razao_social = ?, endereco = ?, logo = ?, updated_at = NOW() 
      WHERE id = ?
    `;
    await executeQuery(query, [cnpj_cpf, razao_social, endereco, logo, id]);

    res.json({ message: 'Empresa atualizada com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Deletar empresa (apenas master)
router.delete('/:id', authenticateToken, requireMaster, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a empresa existe
    const checkQuery = 'SELECT id FROM empresas WHERE id = ?';
    const existing = await executeQuery(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Empresa não encontrada' });
    }

    // Verificar se existem usuários vinculados à empresa
    const usersQuery = 'SELECT COUNT(*) as count FROM usuarios WHERE empresa_id = ?';
    const usersCount = await executeQuery(usersQuery, [id]);

    if (usersCount[0].count > 0) {
      return res.status(400).json({ message: 'Não é possível deletar empresa com usuários vinculados' });
    }

    const query = 'DELETE FROM empresas WHERE id = ?';
    await executeQuery(query, [id]);

    res.json({ message: 'Empresa deletada com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar empresa:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;

