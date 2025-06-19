const express = require('express');
const usuarioController = require('../controllers/usuarioController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de usuário requerem autenticação
router.use(authenticateToken);

router.get('/', usuarioController.index);
router.get('/:id', usuarioController.show);
router.post('/', usuarioController.store);
router.put('/:id', usuarioController.update);
router.delete('/:id', usuarioController.destroy);

module.exports = router;

