const bcrypt = require('bcryptjs')

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    timestamps: false,
    underscored: true
  })

  User.associate = models => {
    User.hasMany(models.Class, { foreignKey: { allowNull: false } })
  }

  User.prototype.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password)
  }

  User.hook('beforeCreate', user => {
    user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(11))
  })

  return User
}
