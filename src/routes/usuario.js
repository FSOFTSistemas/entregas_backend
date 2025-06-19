const express = require('express');
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/database');
const { authenticateToken, requireAdmin, checkEmpresa } = require('../middleware/auth');

const router = express.Router();

// Listar usuários da empresa
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT u.id, u.nome, u.email, u.tipo_usuario, u.empresa_id, u.created_at, u.updated_at,
             e.razao_social, e.cnpj_cpf
      FROM usuarios u 
      JOIN empresas e ON u.empresa_id = e.id
    `;
    let params = [];

    // Se não for master, filtrar pela empresa do usuário
    if (req.user.tipo_usuario !== 'master') {
      query += ' WHERE u.empresa_id = ?';
      params.push(req.user.empresa_id);
    }

    query += ' ORDER BY u.nome';
    
    const usuarios = await executeQuery(query, params);
    res.json(usuarios);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar usuário por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT u.id, u.nome, u.email, u.tipo_usuario, u.empresa_id, u.created_at, u.updated_at,
             e.razao_social, e.cnpj_cpf
      FROM usuarios u 
      JOIN empresas e ON u.empresa_id = e.id 
      WHERE u.id = ?
    `;
    const usuarios = await executeQuery(query, [id]);

    if (usuarios.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const usuario = usuarios[0];

    // Verificar se o usuário pode acessar este registro
    if (req.user.tipo_usuario !== 'master' && usuario.empresa_id !== req.user.empresa_id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar novo usuário (admin ou master)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { nome, email, senha, tipo_usuario, empresa_id } = req.body;

    if (!nome || !email || !senha || !tipo_usuario || !empresa_id) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    // Validar tipo de usuário
    const tiposValidos = ['master', 'admin', 'entregador'];
    if (!tiposValidos.includes(tipo_usuario)) {
      return res.status(400).json({ message: 'Tipo de usuário inválido' });
    }

    // Apenas master pode criar outros masters
    if (tipo_usuario === 'master' && req.user.tipo_usuario !== 'master') {
      return res.status(403).json({ message: 'Apenas usuários master podem criar outros masters' });
    }

    // Verificar se o usuário pode criar usuários para esta empresa
    if (req.user.tipo_usuario !== 'master' && parseInt(empresa_id) !== req.user.empresa_id) {
      return res.status(403).json({ message: 'Você só pode criar usuários para sua própria empresa' });
    }

    // Verificar se já existe usuário com este email
    const checkQuery = 'SELECT id FROM usuarios WHERE email = ?';
    const existing = await executeQuery(checkQuery, [email]);

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Já existe um usuário com este email' });
    }

    // Verificar se a empresa existe
    const empresaQuery = 'SELECT id FROM empresas WHERE id = ?';
    const empresa = await executeQuery(empresaQuery, [empresa_id]);

    if (empresa.length === 0) {
      return res.status(400).json({ message: 'Empresa não encontrada' });
    }

    // Criptografar senha
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    const query = `
      INSERT INTO usuarios (nome, email, senha, tipo_usuario, empresa_id, created_at) 
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    const result = await executeQuery(query, [nome, email, senhaHash, tipo_usuario, empresa_id]);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      id: result.insertId
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar usuário
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha, tipo_usuario, empresa_id } = req.body;

    if (!nome || !email || !tipo_usuario || !empresa_id) {
      return res.status(400).json({ message: 'Nome, email, tipo de usuário e empresa são obrigatórios' });
    }

    // Verificar se o usuário existe
    const checkQuery = 'SELECT * FROM usuarios WHERE id = ?';
    const existing = await executeQuery(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const usuarioExistente = existing[0];

    // Verificar permissões
    const isOwnProfile = parseInt(id) === req.user.id;
    const canEdit = req.user.tipo_usuario === 'master' || 
                   (req.user.tipo_usuario === 'admin' && usuarioExistente.empresa_id === req.user.empresa_id) ||
                   isOwnProfile;

    if (!canEdit) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Validar tipo de usuário
    const tiposValidos = ['master', 'admin', 'entregador'];
    if (!tiposValidos.includes(tipo_usuario)) {
      return res.status(400).json({ message: 'Tipo de usuário inválido' });
    }

    // Apenas master pode alterar tipo para master ou alterar empresa
    if ((tipo_usuario === 'master' || parseInt(empresa_id) !== usuarioExistente.empresa_id) && 
        req.user.tipo_usuario !== 'master') {
      return res.status(403).json({ message: 'Permissão insuficiente para esta operação' });
    }

    // Verificar se já existe outro usuário com este email
    const duplicateQuery = 'SELECT id FROM usuarios WHERE email = ? AND id != ?';
    const duplicate = await executeQuery(duplicateQuery, [email, id]);

    if (duplicate.length > 0) {
      return res.status(400).json({ message: 'Já existe outro usuário com este email' });
    }

    let query = `
      UPDATE usuarios 
      SET nome = ?, email = ?, tipo_usuario = ?, empresa_id = ?, updated_at = NOW()
    `;
    let params = [nome, email, tipo_usuario, empresa_id];

    // Se senha foi fornecida, incluir na atualização
    if (senha) {
      const saltRounds = 10;
      const senhaHash = await bcrypt.hash(senha, saltRounds);
      query += ', senha = ?';
      params.push(senhaHash);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await executeQuery(query, params);

    res.json({ message: 'Usuário atualizado com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Deletar usuário (admin ou master)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Não permitir que o usuário delete a si mesmo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Você não pode deletar sua própria conta' });
    }

    // Verificar se o usuário existe
    const checkQuery = 'SELECT * FROM usuarios WHERE id = ?';
    const existing = await executeQuery(checkQuery, [id]);

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const usuario = existing[0];

    // Verificar permissões
    if (req.user.tipo_usuario !== 'master' && usuario.empresa_id !== req.user.empresa_id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Apenas master pode deletar outros masters
    if (usuario.tipo_usuario === 'master' && req.user.tipo_usuario !== 'master') {
      return res.status(403).json({ message: 'Apenas usuários master podem deletar outros masters' });
    }

    const query = 'DELETE FROM usuarios WHERE id = ?';
    await executeQuery(query, [id]);

    res.json({ message: 'Usuário deletado com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;

