const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario, Empresa } = require('../models');

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário
 *         password:
 *           type: string
 *           description: Senha do usuário
 *     LoginResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: Token JWT de autenticação
 *         user:
 *           $ref: '#/components/schemas/Usuario'
 */

class AuthController {
  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Realiza login do usuário
   *     tags:
   *       - Autenticação
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login realizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       401:
   *         description: Credenciais inválidas
   *       500:
   *         description: Erro interno do servidor
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          message: 'Email e senha são obrigatórios' 
        });
      }

      // Buscar usuário com empresa
      const user = await Usuario.findOne({
        where: { email },
        include: [{
          model: Empresa,
          as: 'empresa',
          attributes: ['id', 'razao_social', 'cnpj_cpf']
        }]
      });

      if (!user) {
        return res.status(401).json({ 
          message: 'Credenciais inválidas' 
        });
      }

      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.senha);
      if (!isValidPassword) {
        return res.status(401).json({ 
          message: 'Credenciais inválida' 
        });
      }

      // Gerar token JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          tipo_usuario: user.tipo_usuario,
          empresa_id: user.empresa_id
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Remover senha da resposta
      const userResponse = {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo_usuario: user.tipo_usuario,
        empresa_id: user.empresa_id,
        empresa: user.empresa,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      res.json({
        message: 'Login realizado com sucesso',
        token,
        user: userResponse
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Retorna informações do usuário autenticado
   *     tags:
   *       - Autenticação
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Informações do usuário
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Usuario'
   *       401:
   *         description: Token inválido ou expirado
   *       500:
   *         description: Erro interno do servidor
   */
  async me(req, res) {
    try {
      const user = await Usuario.findByPk(req.user.id, {
        include: [{
          model: Empresa,
          as: 'empresa',
          attributes: ['id', 'razao_social', 'cnpj_cpf']
        }],
        attributes: { exclude: ['senha'] }
      });

      if (!user) {
        return res.status(404).json({ 
          message: 'Usuário não encontrado' 
        });
      }

      res.json(user);

    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Registra um novo usuário (apenas para masters)
   *     tags:
   *       - Autenticação
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
  async register(req, res) {
    try {
      const { nome, email, senha, tipo_usuario, empresa_id } = req.body;

      // Verificar se o usuário logado é master
      if (req.user.tipo_usuario !== 'master') {
        return res.status(403).json({ 
          message: 'Acesso negado. Apenas usuários master podem criar novos usuários.' 
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
      const user = await Usuario.create({
        nome,
        email,
        senha: hashedPassword,
        tipo_usuario,
        empresa_id
      });

      // Buscar usuário criado com empresa
      const newUser = await Usuario.findByPk(user.id, {
        include: [{
          model: Empresa,
          as: 'empresa',
          attributes: ['id', 'razao_social', 'cnpj_cpf']
        }],
        attributes: { exclude: ['senha'] }
      });

      res.status(201).json({
        message: 'Usuário criado com sucesso',
        user: newUser
      });

    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }
}

module.exports = new AuthController();

