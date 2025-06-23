const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Entrega = sequelize.define('Entrega', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    empresa_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'empresas',
        key: 'id'
      }
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cliente: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    data: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pendente', 'em_transito', 'entregue'),
      allowNull: false,
      defaultValue: 'pendente'
    },
    entregador_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    }
  }, {
    tableName: 'entregas',
    timestamps: true,
    underscored: true
  });

  return Entrega;
};
