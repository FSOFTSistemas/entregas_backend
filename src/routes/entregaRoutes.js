const express = require('express');
const entregaController = require('../controllers/entregaController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de entrega requerem autenticação
router.use(authenticateToken);

router.get('/', entregaController.index);
router.get('/:id', entregaController.show);
router.post('/', entregaController.store);
router.put('/:id', entregaController.update);
router.patch('/:id/status', entregaController.updateStatus);
router.delete('/:id', entregaController.destroy);

module.exports = router;

