export default (sequelize, DataTypes) => {
  const UserGroup = sequelize.define('UserGroup', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      validate: {
        isUUID: 4
      },
      unique: true,
      field: 'id'
    },
    ownerID: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4
      },
      unique: true,
      field: 'owner_id'
    },
    displayName: {
      type: DataTypes.STRING,
      field: 'display_name'
    },
    description: {
      type: DataTypes.STRING,
      field: 'description'
    },
    shortBio: {
      type: DataTypes.STRING,
      field: 'short_bio'
    },
    updatedAt: {
      field: 'updated_at',
      allowNull: false,
      type: DataTypes.DATE
    },
    createdAt: {
      field: 'created_at',
      allowNull: false,
      type: DataTypes.DATE
    },
    deletedAt: {
      field: 'deleted_at',
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    paranoid: true,
    modelName: 'UserGroup',
    tableName: 'user_groups'
  })

  return UserGroup
}
