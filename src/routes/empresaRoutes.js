const express = require('express');
const empresaController = require('../controllers/empresaController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de empresa requerem autenticação
router.use(authenticateToken);

router.get('/', empresaController.index);
router.get('/:id', empresaController.show);
router.post('/', empresaController.store);
router.put('/:id', empresaController.update);
router.delete('/:id', empresaController.destroy);

module.exports = router;

