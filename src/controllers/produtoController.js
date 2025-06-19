const { Produto, Empresa } = require('../models');

/**
 * @swagger
 * components:
 *   schemas:
 *     Produto:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único do produto
 *         empresa_id:
 *           type: integer
 *           description: ID da empresa
 *         descricao:
 *           type: string
 *           description: Descrição do produto
 *         preco_custo:
 *           type: number
 *           format: float
 *           description: Preço de custo do produto
 *         preco_venda:
 *           type: number
 *           format: float
 *           description: Preço de venda do produto
 *         estoque:
 *           type: integer
 *           description: Quantidade em estoque
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         empresa:
 *           $ref: '#/components/schemas/Empresa'
 */

class ProdutoController {
  /**
   * @swagger
   * /api/produtos:
   *   get:
   *     summary: Lista todos os produtos
   *     tags:
   *       - Produtos
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de produtos
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Produto'
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

      const produtos = await Produto.findAll({
        where: whereClause,
        include: [{
          model: Empresa,
          as: 'empresa',
          attributes: ['id', 'razao_social', 'cnpj_cpf']
        }],
        order: [['created_at', 'DESC']]
      });

      res.json(produtos);

    } catch (error) {
      console.error('Erro ao listar produtos:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * @swagger
   * /api/produtos/{id}:
   *   get:
   *     summary: Busca um produto por ID
   *     tags:
   *       - Produtos
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do produto
   *     responses:
   *       200:
   *         description: Produto encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Produto'
   *       403:
   *         description: Acesso negado
   *       404:
   *         description: Produto não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      const produto = await Produto.findByPk(id, {
        include: [{
          model: Empresa,
          as: 'empresa',
          attributes: ['id', 'razao_social', 'cnpj_cpf']
        }]
      });

      if (!produto) {
        return res.status(404).json({ 
          message: 'Produto não encontrado' 
        });
      }

      // Verificar permissões
      if (req.user.tipo_usuario !== 'master' && 
          req.user.empresa_id !== produto.empresa_id) {
        return res.status(403).json({ 
          message: 'Acesso negado.' 
        });
      }

      res.json(produto);

    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * @swagger
   * /api/produtos:
   *   post:
   *     summary: Cria um novo produto
   *     tags:
   *       - Produtos
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - descricao
   *               - preco_custo
   *               - preco_venda
   *               - estoque
   *             properties:
   *               descricao:
   *                 type: string
   *               preco_custo:
   *                 type: number
   *                 format: float
   *               preco_venda:
   *                 type: number
   *                 format: float
   *               estoque:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Produto criado com sucesso
   *       400:
   *         description: Dados inválidos
   *       403:
   *         description: Acesso negado
   *       500:
   *         description: Erro interno do servidor
   */
  async store(req, res) {
    try {
      // Verificar permissões
      if (req.user.tipo_usuario === 'entregador') {
        return res.status(403).json({ 
          message: 'Acesso negado. Entregadores não podem criar produtos.' 
        });
      }

      const { descricao, preco_custo, preco_venda, estoque } = req.body;

      if (!descricao || preco_custo === undefined || preco_venda === undefined || estoque === undefined) {
        return res.status(400).json({ 
          message: 'Descrição, preço de custo, preço de venda e estoque são obrigatórios' 
        });
      }

      // Usar empresa do usuário logado (exceto para masters que podem especificar)
      const empresa_id = req.user.tipo_usuario === 'master' && req.body.empresa_id 
        ? req.body.empresa_id 
        : req.user.empresa_id;

      const produto = await Produto.create({
        empresa_id,
        descricao,
        preco_custo,
        preco_venda,
        estoque
      });

      // Buscar produto criado com empresa
      const newProduct = await Produto.findByPk(produto.id, {
        include: [{
          model: Empresa,
          as: 'empresa',
          attributes: ['id', 'razao_social', 'cnpj_cpf']
        }]
      });

      res.status(201).json({
        message: 'Produto criado com sucesso',
        produto: newProduct
      });

    } catch (error) {
      console.error('Erro ao criar produto:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * @swagger
   * /api/produtos/{id}:
   *   put:
   *     summary: Atualiza um produto
   *     tags:
   *       - Produtos
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do produto
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               descricao:
   *                 type: string
   *               preco_custo:
   *                 type: number
   *                 format: float
   *               preco_venda:
   *                 type: number
   *                 format: float
   *               estoque:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Produto atualizado com sucesso
   *       400:
   *         description: Dados inválidos
   *       403:
   *         description: Acesso negado
   *       404:
   *         description: Produto não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  async update(req, res) {
    try {
      const { id } = req.params;

      // Verificar permissões
      if (req.user.tipo_usuario === 'entregador') {
        return res.status(403).json({ 
          message: 'Acesso negado. Entregadores não podem atualizar produtos.' 
        });
      }

      const produto = await Produto.findByPk(id);

      if (!produto) {
        return res.status(404).json({ 
          message: 'Produto não encontrado' 
        });
      }

      // Verificar se o usuário pode atualizar este produto
      if (req.user.tipo_usuario !== 'master' && 
          req.user.empresa_id !== produto.empresa_id) {
        return res.status(403).json({ 
          message: 'Acesso negado.' 
        });
      }

      const { descricao, preco_custo, preco_venda, estoque } = req.body;

      // Preparar dados para atualização
      const updateData = {};

      if (descricao !== undefined) updateData.descricao = descricao;
      if (preco_custo !== undefined) updateData.preco_custo = preco_custo;
      if (preco_venda !== undefined) updateData.preco_venda = preco_venda;
      if (estoque !== undefined) updateData.estoque = estoque;

      await produto.update(updateData);

      // Buscar produto atualizado
      const updatedProduct = await Produto.findByPk(id, {
        include: [{
          model: Empresa,
          as: 'empresa',
          attributes: ['id', 'razao_social', 'cnpj_cpf']
        }]
      });

      res.json({
        message: 'Produto atualizado com sucesso',
        produto: updatedProduct
      });

    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * @swagger
   * /api/produtos/{id}:
   *   delete:
   *     summary: Remove um produto
   *     tags:
   *       - Produtos
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID do produto
   *     responses:
   *       200:
   *         description: Produto removido com sucesso
   *       403:
   *         description: Acesso negado
   *       404:
   *         description: Produto não encontrado
   *       500:
   *         description: Erro interno do servidor
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;

      // Verificar permissões
      if (req.user.tipo_usuario === 'entregador') {
        return res.status(403).json({ 
          message: 'Acesso negado. Entregadores não podem remover produtos.' 
        });
      }

      const produto = await Produto.findByPk(id);

      if (!produto) {
        return res.status(404).json({ 
          message: 'Produto não encontrado' 
        });
      }

      // Verificar se o usuário pode remover este produto
      if (req.user.tipo_usuario !== 'master' && 
          req.user.empresa_id !== produto.empresa_id) {
        return res.status(403).json({ 
          message: 'Acesso negado.' 
        });
      }

      await produto.destroy();

      res.json({
        message: 'Produto removido com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover produto:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }
}

module.exports = new ProdutoController();

