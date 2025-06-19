const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Rota para login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário por email
    const query = `
      SELECT u.*, e.razao_social, e.cnpj_cpf 
      FROM usuarios u 
      JOIN empresas e ON u.empresa_id = e.id 
      WHERE u.email = ?
    `;
    const usuarios = await executeQuery(query, [email]);

    if (usuarios.length === 0) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const usuario = usuarios[0];

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario,
        empresa_id: usuario.empresa_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Remover senha da resposta
    delete usuario.senha;

    res.json({
      message: 'Login realizado com sucesso',
      token,
      usuario
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para verificar token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    // Buscar dados atualizados do usuário
    const query = `
      SELECT u.*, e.razao_social, e.cnpj_cpf 
      FROM usuarios u 
      JOIN empresas e ON u.empresa_id = e.id 
      WHERE u.id = ?
    `;
    const usuarios = await executeQuery(query, [req.user.id]);

    if (usuarios.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const usuario = usuarios[0];
    delete usuario.senha;

    res.json({
      valid: true,
      usuario
    });

  } catch (error) {
    console.error('Erro na verificação do token:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para logout (opcional - apenas para limpar token no frontend)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

module.exports = router;

