const express = require('express');
const produtoController = require('../controllers/produtoController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de produto requerem autenticação
router.use(authenticateToken);

router.get('/', produtoController.index);
router.get('/:id', produtoController.show);
router.post('/', produtoController.store);
router.put('/:id', produtoController.update);
router.delete('/:id', produtoController.destroy);

module.exports = router;

