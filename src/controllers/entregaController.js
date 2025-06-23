const { Entrega, Produto, Empresa, Usuario, EntregaProduto } = require('../models');

/**
 * @swagger
 * components:
 *   schemas:
 *     Entrega:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único da entrega
 *         empresa_id:
 *           type: integer
 *           description: ID da empresa
 *         produtos:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               descricao:
 *                 type: string
 *               preco_venda:
 *                 type: number
 *                 format: float
 *               quantidade:
 *                 type: integer
 *               preco_unitario:
 *                 type: number
 *                 format: float
 *         descricao:
 *           type: string
 *           description: Descrição da entrega
 *         cliente:
 *           type: string
 *           description: Nome do cliente
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Timestamp da criação
 *         data:
 *           type: string
 *           format: date
 *           description: Data da entrega
 *         status:
 *           type: string
 *           enum: [pendente, em_transito, entregue]
 *           description: Status da entrega
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         empresa:
 *           $ref: '#/components/schemas/Empresa'
 */

class EntregaController {
  /**
   * @swagger
   * /api/entregas:
   *   get:
   *     summary: Lista todas as entregas
   *     tags:
   *       - Entregas
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pendente, em_transito, entregue]
   *         description: Filtrar por status
   *     responses:
   *       200:
   *         description: Lista de entregas
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Entrega'
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

      // Filtrar por status se fornecido
      if (req.query.status) {
        whereClause.status = req.query.status;
      }

      const entregas = await Entrega.findAll({
        where: whereClause,
        include: [
          {
            model: Produto,
            as: 'produtos',
            attributes: ['id', 'descricao', 'preco_venda'],
            through: { attributes: ['quantidade', 'preco_unitario'] }
          },
          {
            model: Empresa,
            as: 'empresa',
            attributes: ['id', 'razao_social', 'cnpj_cpf']
          },
          {
            model: Usuario,
            as: 'entregador',
            attributes: ['id', 'nome', 'email']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json(entregas);

    } catch (error) {
      console.error('Erro ao listar entregas:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * @swagger
   * /api/entregas/{id}:
   *   get:
   *     summary: Busca uma entrega por ID
   *     tags:
   *       - Entregas
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID da entrega
   *     responses:
   *       200:
   *         description: Entrega encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Entrega'
   *       403:
   *         description: Acesso negado
   *       404:
   *         description: Entrega não encontrada
   *       500:
   *         description: Erro interno do servidor
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      const entrega = await Entrega.findByPk(id, {
        include: [
          {
            model: Produto,
            as: 'produtos',
            attributes: ['id', 'descricao', 'preco_venda'],
            through: { attributes: ['quantidade', 'preco_unitario'] }
          },
          {
            model: Empresa,
            as: 'empresa',
            attributes: ['id', 'razao_social', 'cnpj_cpf']
          }
        ]
      });

      if (!entrega) {
        return res.status(404).json({ 
          message: 'Entrega não encontrada' 
        });
      }

      // Verificar permissões
      if (req.user.tipo_usuario !== 'master' && 
          req.user.empresa_id !== entrega.empresa_id) {
        return res.status(403).json({ 
          message: 'Acesso negado.' 
        });
      }

      res.json(entrega);

    } catch (error) {
      console.error('Erro ao buscar entrega:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * @swagger
   * /api/entregas:
   *   post:
   *     summary: Cria uma nova entrega
   *     tags:
   *       - Entregas
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - produtos
   *               - data
   *             properties:
   *               produtos:
   *                 type: array
   *                 items:
   *                   type: object
   *                   required: [produto_id, quantidade, preco_unitario]
   *                   properties:
   *                     produto_id:
   *                       type: integer
   *                     quantidade:
   *                       type: integer
   *                     preco_unitario:
   *                       type: number
   *                       format: float
   *               descricao:
   *                 type: string
   *               cliente:
   *                 type: string
   *               data:
   *                 type: string
   *                 format: date
   *     responses:
   *       201:
   *         description: Entrega criada com sucesso
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
          message: 'Acesso negado. Entregadores não podem criar entregas.' 
        });
      }
      const { produtos, descricao, cliente, data } = req.body;

      if (!Array.isArray(produtos) || produtos.length === 0) {
        return res.status(400).json({ 
          message: 'É necessário informar ao menos um produto na entrega.' 
        });
      }

      const entrega = await Entrega.create({
        empresa_id: req.user.empresa_id,
        descricao,
        cliente,
        data,
        status: 'pendente'
      });

      // Salvar os produtos na tabela pivot
      for (const item of produtos) {
        const produto = await Produto.findByPk(item.produto_id);
        if (!produto) {
          return res.status(400).json({ 
            message: `Produto com ID ${item.produto_id} não encontrado.` 
          });
        }
        await entrega.addProduto(produto, { 
          through: { quantidade: item.quantidade, preco_unitario: item.preco_unitario } 
        });
      }

      // Buscar entrega criada com relacionamentos
      const newEntrega = await Entrega.findByPk(entrega.id, {
        include: [
          {
            model: Produto,
            as: 'produtos',
            attributes: ['id', 'descricao', 'preco_venda'],
            through: { attributes: ['quantidade', 'preco_unitario'] }
          },
          {
            model: Empresa,
            as: 'empresa',
            attributes: ['id', 'razao_social', 'cnpj_cpf']
          }
        ]
      });

      res.status(201).json({
        message: 'Entrega criada com sucesso',
        entrega: newEntrega
      });

    } catch (error) {
      console.error('Erro ao criar entrega:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * @swagger
   * /api/entregas/{id}:
   *   put:
   *     summary: Atualiza uma entrega
   *     tags:
   *       - Entregas
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID da entrega
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               descricao:
   *                 type: string
   *               cliente:
   *                 type: string
   *               data:
   *                 type: string
   *                 format: date
   *               status:
   *                 type: string
   *                 enum: [pendente, em_transito, entregue]
   *               entregador_id:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Entrega atualizada com sucesso
   *       400:
   *         description: Dados inválidos
   *       403:
   *         description: Acesso negado
   *       404:
   *         description: Entrega não encontrada
   *       500:
   *         description: Erro interno do servidor
   */
  async update(req, res) {
    try {
      const { id } = req.params;

      const entrega = await Entrega.findByPk(id);

      if (!entrega) {
        return res.status(404).json({ 
          message: 'Entrega não encontrada' 
        });
      }

      // Verificar se o usuário pode atualizar esta entrega
      if (req.user.tipo_usuario !== 'master' && 
          req.user.empresa_id !== entrega.empresa_id) {
        return res.status(403).json({ 
          message: 'Acesso negado.' 
        });
      }
      const { descricao, cliente, data, status, entregador_id } = req.body;

      if (entregador_id === undefined || entregador_id === null) {
        return res.status(400).json({
          message: 'O campo entregador_id é obrigatório na atualização.'
        });
      }

      // Preparar dados para atualização
      const updateData = {};
      if (descricao !== undefined) updateData.descricao = descricao;
      if (cliente !== undefined) updateData.cliente = cliente;
      if (data !== undefined) updateData.data = data;
      if (status !== undefined) updateData.status = status;
      if (entregador_id !== undefined) updateData.entregador_id = entregador_id;

      await entrega.update(updateData);

      // Buscar entrega atualizada
      const updatedEntrega = await Entrega.findByPk(id, {
        include: [
          {
            model: Produto,
            as: 'produtos',
            attributes: ['id', 'descricao', 'preco_venda'],
            through: { attributes: ['quantidade', 'preco_unitario'] }
          },
          {
            model: Empresa,
            as: 'empresa',
            attributes: ['id', 'razao_social', 'cnpj_cpf']
          }
        ]
      });

      res.json({
        message: 'Entrega atualizada com sucesso',
        entrega: updatedEntrega
      });

    } catch (error) {
      console.error('Erro ao atualizar entrega:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * @swagger
   * /api/entregas/{id}/status:
   *   patch:
   *     summary: Atualiza apenas o status de uma entrega
   *     tags:
   *       - Entregas
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID da entrega
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [pendente, em_transito, entregue]
   *     responses:
   *       200:
   *         description: Status da entrega atualizado com sucesso
   *       400:
   *         description: Dados inválidos
   *       403:
   *         description: Acesso negado
   *       404:
   *         description: Entrega não encontrada
   *       500:
   *         description: Erro interno do servidor
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ 
          message: 'Status é obrigatório' 
        });
      }

      const entrega = await Entrega.findByPk(id);

      if (!entrega) {
        return res.status(404).json({ 
          message: 'Entrega não encontrada' 
        });
      }

      // Verificar se o usuário pode atualizar esta entrega
      if (req.user.tipo_usuario !== 'master' && 
          req.user.empresa_id !== entrega.empresa_id) {
        return res.status(403).json({ 
          message: 'Acesso negado.' 
        });
      }

      await entrega.update({ status });

      // Buscar entrega atualizada
      const updatedEntrega = await Entrega.findByPk(id, {
        include: [
          {
            model: Produto,
            as: 'produto',
            attributes: ['id', 'descricao', 'preco_venda']
          },
          {
            model: Empresa,
            as: 'empresa',
            attributes: ['id', 'razao_social', 'cnpj_cpf']
          }
        ]
      });

      res.json({
        message: 'Status da entrega atualizado com sucesso',
        entrega: updatedEntrega
      });

    } catch (error) {
      console.error('Erro ao atualizar status da entrega:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * @swagger
   * /api/entregas/{id}:
   *   delete:
   *     summary: Remove uma entrega
   *     tags:
   *       - Entregas
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID da entrega
   *     responses:
   *       200:
   *         description: Entrega removida com sucesso
   *       403:
   *         description: Acesso negado
   *       404:
   *         description: Entrega não encontrada
   *       500:
   *         description: Erro interno do servidor
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;

      // Verificar permissões
      if (req.user.tipo_usuario === 'entregador') {
        return res.status(403).json({ 
          message: 'Acesso negado. Entregadores não podem remover entregas.' 
        });
      }

      const entrega = await Entrega.findByPk(id);

      if (!entrega) {
        return res.status(404).json({ 
          message: 'Entrega não encontrada' 
        });
      }

      // Verificar se o usuário pode remover esta entrega
      if (req.user.tipo_usuario !== 'master' && 
          req.user.empresa_id !== entrega.empresa_id) {
        return res.status(403).json({ 
          message: 'Acesso negado.' 
        });
      }

      await entrega.destroy();
      await EntregaProduto.destroy({ where: { entrega_id: entrega.id } });

      res.json({
        message: 'Entrega removida com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover entrega:', error);
      res.status(500).json({ 
        message: 'Erro interno do servidor' 
      });
    }
  }

 async baixarEstoque (req, res) {
  try {
    const entregaId = req.params.id;

    // Buscar produtos da entrega
    const produtosEntrega = await EntregaProduto.findAll({ where: { entrega_id: entregaId } });

    if (!produtosEntrega || produtosEntrega.length === 0) {
      return res.status(404).json({ error: 'Nenhum produto encontrado para essa entrega' });
    }

    for (const item of produtosEntrega) {
      const produto = await Produto.findByPk(item.produto_id);
      if (!produto) {
        return res.status(404).json({ error: `Produto ${item.produto_id} não encontrado` });
      }

      if (produto.estoque < item.quantidade) {
        return res.status(400).json({ error: `Estoque insuficiente para o produto ${produto.id}` });
      }

      produto.estoque -= item.quantidade;
      await produto.save();
    }

    return res.json({ message: 'Estoque atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao baixar estoque:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

}

module.exports = new EntregaController();

