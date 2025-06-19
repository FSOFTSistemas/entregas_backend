const bcrypt = require('bcryptjs');
const { Usuario, Empresa } = require('../models');

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do usuário
 *         empresa_id:
 *           type: integer
 *           description: ID da empresa
 *         nome:
 *           type: string
 *           description: Nome do usuário
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário
 *         tipo_usuario:
 *           type: string
 *           enum: [master, admin, entregador]
 *           description: Tipo do usuário
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         empresa:
 *           $ref: '#/components/schemas/Empresa'
 */

class UsuarioController {
  /**
   * @swagger
   * /api/usuarios:
   *   get:
   *     summary: Lista todos os usuários
   *     tags:
   *       - Usuários
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de usuários
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Usuario'
   *       403:
   *         description: Acesso negado
   *       500:
   *         description: Erro interno do servidor
   */
  async index(req, res) {
    try {
      let whereClause = {};

      // Filtrar por empresa se não for master
      if (req.user.tipo_usuario !== 'master') {
        whereClause.empresa_id = req.user.empresa_id;
      }

      const usuarios = await Usuario.findAll({
        where: whereClause,
        include: [{
          model: Empresa,
          as: 'empresa',
          attributes: ['id', 'razao_social', 'cnpj_cpf']
        }],
        attributes: { exclude: ['senha'] },
        order: [['created_at', 'DESC']]
      });

      res.json(usuarios);

    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * @swagger
   * /api/usuarios/{id}:
   *   get:
   *     summary: Busca um usuário por ID
   *     tags:
   *       - Usuários
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do usuário
   *     responses:
   *       200:
   *         description: Usuário encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Usuario'
   *       403:
   *         description: Acesso negado
   *       404:
   *         description: Usuário não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      const usuario = await Usuario.findByPk(id, {
        include: [{
          model: Empresa,
          as: 'empresa',
          attributes: ['id', 'razao_social', 'cnpj_cpf']
        }],
        attributes: { exclude: ['senha'] }
      });

      if (!usuario) {
        return res.status(404).json({ 
          message: 'Usuário não encontrado' 
        });
      }

      // Verificar permissões
      if (req.user.tipo_usuario !== 'master' && 
          req.user.empresa_id !== usuario.empresa_id &&
          req.user.id !== usuario.id) {
        return res.status(403).json({ 
          message: 'Acesso negado.' 
        });
      }

      res.json(usuario);

    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * @swagger
   * /api/usuarios:
   *   post:
   *     summary: Cria um novo usuário
   *     tags:
   *       - Usuários
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - nome
   *               - email
   *               - senha
   *               - tipo_usuario
   *               - empresa_id
   *             properties:
   *               nome:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *               senha:
   *                 type: string
   *               tipo_usuario:
   *                 type: string
   *                 enum: [master, admin, entregador]
   *               empresa_id:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Usuário criado com sucesso
   *       400:
   *         description: Dados inválidos
   *       403:
   *         description: Acesso negado
   *       500:
   *         description: Erro interno do servidor
   */
  async store(req, res) {
    try {
      const { nome, email, senha, tipo_usuario, empresa_id } = req.body;

      // Verificar permissões
      if (req.user.tipo_usuario === 'entregador') {
        return res.status(403).json({ 
          message: 'Acesso negado. Entregadores não podem criar usuários.' 
        });
      }

      // Admins só podem criar usuários da própria empresa
      if (req.user.tipo_usuario === 'admin' && req.user.empresa_id !== empresa_id) {
        return res.status(403).json({ 
          message: 'Acesso negado. Você só pode criar usuários da sua empresa.' 
        });
      }

      // Validar dados obrigatórios
      if (!nome || !email || !senha || !tipo_usuario || !empresa_id) {
        return res.status(400).json({ 
          message: 'Todos os campos são obrigatórios' 
        });
      }

      // Verificar se email já existe
      const existingUser = await Usuario.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Email já está em uso' 
        });
      }

      // Verificar se empresa existe
      const empresa = await Empresa.findByPk(empresa_id);
      if (!empresa) {
        return res.status(400).json({ 
          message: 'Empresa não encontrada' 
        });
      }

      // Criptografar senha
      const hashedPassword = await bcrypt.hash(senha, 10);

      // Criar usuário
      const usuario = await Usuario.create({
        nome,
        email,
        senha: hashedPassword,
        tipo_usuario,
        empresa_id
      });

      // Buscar usuário criado com empresa
      const newUser = await Usuario.findByPk(usuario.id, {
        include: [{
          model: Empresa,
          as: 'empresa',
          attributes: ['id', 'razao_social', 'cnpj_cpf']
        }],
        attributes: { exclude: ['senha'] }
      });

      res.status(201).json({
        message: 'Usuário criado com sucesso',
        usuario: newUser
      });

    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ 
          message: 'Email já está em uso' 
        });
      }

      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * @swagger
   * /api/usuarios/{id}:
   *   put:
   *     summary: Atualiza um usuário
   *     tags:
   *       - Usuários
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do usuário
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               nome:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *               senha:
   *                 type: string
   *               tipo_usuario:
   *                 type: string
   *                 enum: [master, admin, entregador]
   *               empresa_id:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Usuário atualizado com sucesso
   *       400:
   *         description: Dados inválidos
   *       403:
   *         description: Acesso negado
   *       404:
   *         description: Usuário não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  async update(req, res) {
    try {
      const { id } = req.params;

      const usuario = await Usuario.findByPk(id);

      if (!usuario) {
        return res.status(404).json({ 
          message: 'Usuário não encontrado' 
        });
      }

      // Verificar permissões
      if (req.user.tipo_usuario === 'entregador') {
        return res.status(403).json({ 
          message: 'Acesso negado. Entregadores não podem atualizar usuários.' 
        });
      }

      if (req.user.tipo_usuario === 'admin' && 
          req.user.empresa_id !== usuario.empresa_id &&
          req.user.id !== usuario.id) {
        return res.status(403).json({ 
          message: 'Acesso negado.' 
        });
      }

      const { nome, email, senha, tipo_usuario, empresa_id } = req.body;

      // Preparar dados para atualização
      const updateData = {};

      if (nome) updateData.nome = nome;
      if (email) updateData.email = email;
      if (tipo_usuario) updateData.tipo_usuario = tipo_usuario;
      if (empresa_id) updateData.empresa_id = empresa_id;

      // Criptografar nova senha se fornecida
      if (senha) {
        updateData.senha = await bcrypt.hash(senha, 10);
      }

      await usuario.update(updateData);

      // Buscar usuário atualizado
      const updatedUser = await Usuario.findByPk(id, {
        include: [{
          model: Empresa,
          as: 'empresa',
          attributes: ['id', 'razao_social', 'cnpj_cpf']
        }],
        attributes: { exclude: ['senha'] }
      });

      res.json({
        message: 'Usuário atualizado com sucesso',
        usuario: updatedUser
      });

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ 
          message: 'Email já está em uso' 
        });
      }

      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * @swagger
   * /api/usuarios/{id}:
   *   delete:
   *     summary: Remove um usuário
   *     tags:
   *       - Usuários
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do usuário
   *     responses:
   *       200:
   *         description: Usuário removido com sucesso
   *       403:
   *         description: Acesso negado
   *       404:
   *         description: Usuário não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;

      const usuario = await Usuario.findByPk(id);

      if (!usuario) {
        return res.status(404).json({ 
          message: 'Usuário não encontrado' 
        });
      }

      // Verificar permissões
      if (req.user.tipo_usuario === 'entregador') {
        return res.status(403).json({ 
          message: 'Acesso negado. Entregadores não podem remover usuários.' 
        });
      }

      if (req.user.tipo_usuario === 'admin' && 
          req.user.empresa_id !== usuario.empresa_id) {
        return res.status(403).json({ 
          message: 'Acesso negado.' 
        });
      }

      // Não permitir que o usuário delete a si mesmo
      if (req.user.id === usuario.id) {
        return res.status(400).json({ 
          message: 'Você não pode deletar sua própria conta.' 
        });
      }

      await usuario.destroy();

      res.json({
        message: 'Usuário removido com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }
}

module.exports = new UsuarioController();

