const { sequelize } = require('../config/database');

// Importar todos os modelos
const Empresa = require('./Empresa')(sequelize);
const Usuario = require('./Usuario')(sequelize);
const Produto = require('./Produto')(sequelize);
const Entrega = require('./Entrega')(sequelize);

// Definir associações
// Empresa tem muitos usuários, produtos e entregas
Empresa.hasMany(Usuario, { 
  foreignKey: 'empresa_id', 
  as: 'usuarios',
  onDelete: 'CASCADE'
});
Usuario.belongsTo(Empresa, { 
  foreignKey: 'empresa_id', 
  as: 'empresa' 
});

Empresa.hasMany(Produto, { 
  foreignKey: 'empresa_id', 
  as: 'produtos',
  onDelete: 'CASCADE'
});
Produto.belongsTo(Empresa, { 
  foreignKey: 'empresa_id', 
  as: 'empresa' 
});

Empresa.hasMany(Entrega, { 
  foreignKey: 'empresa_id', 
  as: 'entregas',
  onDelete: 'CASCADE'
});
Entrega.belongsTo(Empresa, { 
  foreignKey: 'empresa_id', 
  as: 'empresa' 
});

// Produto tem muitas entregas
Produto.hasMany(Entrega, { 
  foreignKey: 'produto_id', 
  as: 'entregas',
  onDelete: 'CASCADE'
});
Entrega.belongsTo(Produto, { 
  foreignKey: 'produto_id', 
  as: 'produto' 
});

// Sincronizar modelos com o banco de dados
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados com o banco de dados.');
  } catch (error) {
    console.error('❌ Erro ao sincronizar modelos:', error);
  }
};

module.exports = {
  sequelize,
  Empresa,
  Usuario,
  Produto,
  Entrega,
  syncDatabase
};

