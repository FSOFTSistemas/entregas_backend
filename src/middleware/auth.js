const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Token de acesso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar se o usuário é admin ou master
const requireAdmin = (req, res, next) => {
  if (req.user.tipo_usuario !== 'admin' && req.user.tipo_usuario !== 'master') {
    return res.status(403).json({ message: 'Acesso negado. Permissão de administrador requerida.' });
  }
  next();
};

// Middleware para verificar se o usuário é master
const requireMaster = (req, res, next) => {
  if (req.user.tipo_usuario !== 'master') {
    return res.status(403).json({ message: 'Acesso negado. Permissão de master requerida.' });
  }
  next();
};

// Middleware para verificar se o usuário pertence à mesma empresa
const checkEmpresa = (req, res, next) => {
  // Se for master, pode acessar qualquer empresa
  if (req.user.tipo_usuario === 'master') {
    return next();
  }
  
  // Para outros usuários, verificar se pertencem à mesma empresa
  const empresaId = req.params.empresaId || req.body.empresa_id;
  if (empresaId && parseInt(empresaId) !== req.user.empresa_id) {
    return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para acessar dados desta empresa.' });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireMaster,
  checkEmpresa
};

