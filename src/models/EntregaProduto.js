

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EntregaProduto = sequelize.define('EntregaProduto', {
    entrega_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'entregas',
        key: 'id'
      }
    },
    produto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'produtos',
        key: 'id'
      }
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    preco_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    }
  }, {
    tableName: 'entrega_produtos',
    timestamps: false,
    underscored: true
  });

  return EntregaProduto;
};