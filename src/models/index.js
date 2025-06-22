const { sequelize } = require('../config/database');

// Importar todos os modelos
const Empresa = require('./Empresa')(sequelize);
const Usuario = require('./Usuario')(sequelize);
const Produto = require('./Produto')(sequelize);
const Entrega = require('./Entrega')(sequelize);
const EntregaProduto = require('./EntregaProduto')(sequelize);

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


// Novo relacionamento N:N entre Entrega e Produto utilizando a tabela pivot
Produto.belongsToMany(Entrega, {
  through: EntregaProduto,
  foreignKey: 'produto_id',
  otherKey: 'entrega_id',
  as: 'entregas'
});

Entrega.belongsToMany(Produto, {
  through: EntregaProduto,
  foreignKey: 'entrega_id',
  otherKey: 'produto_id',
  as: 'produtos'
});

Usuario.hasMany(Entrega, {
  foreignKey: 'entregador_id',
  as: 'entregas_entregador',
  onDelete: 'SET NULL'
});

Entrega.belongsTo(Usuario, {
  foreignKey: 'entregador_id',
  as: 'entregador'
});

// Sincronizar modelos com o banco de dados
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: false });
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
  EntregaProduto,
  syncDatabase
};

