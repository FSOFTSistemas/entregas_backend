const { Empresa, Usuario, Produto, Entrega } = require('../models');

/**
 * @swagger
 * components:
 *   schemas:
 *     Empresa:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único da empresa
 *         cnpj_cpf:
 *           type: string
 *           description: CNPJ ou CPF da empresa
 *         razao_social:
 *           type: string
 *           description: Razão social da empresa
 *         endereco:
 *           type: string
 *           description: Endereço da empresa
 *         logo:
 *           type: string
 *           description: URL do logo da empresa
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

class EmpresaController {
  /**
   * @swagger
   * /api/empresas:
   *   get:
   *     summary: Lista todas as empresas
   *     tags:
   *       - Empresas
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de empresas
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Empresa'
   *       403:
   *         description: Acesso negado
   *       500:
   *         description: Erro interno do servidor
   */
  async index(req, res) {
    try {
      // Apenas usuários master podem listar todas as empresas
      if (req.user.tipo_usuario !== 'master') {
        return res.status(403).json({ 
          message: 'Acesso negado. Apenas usuários master podem listar empresas.' 
        });
      }

      const empresas = await Empresa.findAll({
        order: [['created_at', 'DESC']]
      });

      res.json(empresas);

    } catch (error) {
      console.error('Erro ao listar empresas:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' + error.message
      });
    }
  }

  /**
   * @swagger
   * /api/empresas/{id}:
   *   get:
   *     summary: Busca uma empresa por ID
   *     tags:
   *       - Empresas
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID da empresa
   *     responses:
   *       200:
   *         description: Empresa encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Empresa'
   *       403:
   *         description: Acesso negado
   *       404:
   *         description: Empresa não encontrada
   *       500:
   *         description: Erro interno do servidor
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      // Verificar permissões
      if (req.user.tipo_usuario !== 'master' && req.user.empresa_id !== parseInt(id)) {
        return res.status(403).json({ 
          message: 'Acesso negado.' 
        });
      }

      const empresa = await Empresa.findByPk(id);

      if (!empresa) {
        return res.status(404).json({ 
          message: 'Empresa não encontrada' 
        });
      }

      res.json(empresa);

    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * @swagger
   * /api/empresas:
   *   post:
   *     summary: Cria uma nova empresa
   *     tags:
   *       - Empresas
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - cnpj_cpf
   *               - razao_social
   *               - endereco
   *             properties:
   *               cnpj_cpf:
   *                 type: string
   *               razao_social:
   *                 type: string
   *               endereco:
   *                 type: string
   *               logo:
   *                 type: string
   *     responses:
   *       201:
   *         description: Empresa criada com sucesso
   *       400:
   *         description: Dados inválidos
   *       403:
   *         description: Acesso negado
   *       500:
   *         description: Erro interno do servidor
   */
  async store(req, res) {
    try {
      // Apenas usuários master podem criar empresas
      if (req.user.tipo_usuario !== 'master') {
        return res.status(403).json({ 
          message: 'Acesso negado. Apenas usuários master podem criar empresas.' 
        });
      }

      const { cnpj_cpf, razao_social, endereco, logo } = req.body;

      if (!cnpj_cpf || !razao_social || !endereco) {
        return res.status(400).json({ 
          message: 'CNPJ/CPF, razão social e endereço são obrigatórios' 
        });
      }

      const empresa = await Empresa.create({
        cnpj_cpf,
        razao_social,
        endereco,
        logo
      });

      res.status(201).json({
        message: 'Empresa criada com sucesso',
        empresa
      });

    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ 
          message: 'CNPJ/CPF já está em uso' 
        });
      }

      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * @swagger
   * /api/empresas/{id}:
   *   put:
   *     summary: Atualiza uma empresa
   *     tags:
   *       - Empresas
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID da empresa
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               cnpj_cpf:
   *                 type: string
   *               razao_social:
   *                 type: string
   *               endereco:
   *                 type: string
   *               logo:
   *                 type: string
   *     responses:
   *       200:
   *         description: Empresa atualizada com sucesso
   *       400:
   *         description: Dados inválidos
   *       403:
   *         description: Acesso negado
   *       404:
   *         description: Empresa não encontrada
   *       500:
   *         description: Erro interno do servidor
   */
  async update(req, res) {
    try {
      const { id } = req.params;

      // Apenas usuários master podem atualizar empresas
      if (req.user.tipo_usuario !== 'master') {
        return res.status(403).json({ 
          message: 'Acesso negado. Apenas usuários master podem atualizar empresas.' 
        });
      }

      const empresa = await Empresa.findByPk(id);

      if (!empresa) {
        return res.status(404).json({ 
          message: 'Empresa não encontrada' 
        });
      }

      const { cnpj_cpf, razao_social, endereco, logo } = req.body;

      await empresa.update({
        cnpj_cpf: cnpj_cpf || empresa.cnpj_cpf,
        razao_social: razao_social || empresa.razao_social,
        endereco: endereco || empresa.endereco,
        logo: logo !== undefined ? logo : empresa.logo
      });

      res.json({
        message: 'Empresa atualizada com sucesso',
        empresa
      });

    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ 
          message: 'CNPJ/CPF já está em uso' 
        });
      }

      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * @swagger
   * /api/empresas/{id}:
   *   delete:
   *     summary: Remove uma empresa
   *     tags:
   *       - Empresas
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID da empresa
   *     responses:
   *       200:
   *         description: Empresa removida com sucesso
   *       403:
   *         description: Acesso negado
   *       404:
   *         description: Empresa não encontrada
   *       500:
   *         description: Erro interno do servidor
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;

      // Apenas usuários master podem remover empresas
      if (req.user.tipo_usuario !== 'master') {
        return res.status(403).json({ 
          message: 'Acesso negado. Apenas usuários master podem remover empresas.' 
        });
      }

      const empresa = await Empresa.findByPk(id);

      if (!empresa) {
        return res.status(404).json({ 
          message: 'Empresa não encontrada' 
        });
      }

      await empresa.destroy();

      res.json({
        message: 'Empresa removida com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover empresa:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }
}

module.exports = new EmpresaController();

