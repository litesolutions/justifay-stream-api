import fs from 'fs'
import sequelize, { Sequelize, DataTypes } from 'sequelize'
import config from '../../config/databases.js'
import path from 'path'

const filename = new URL('', import.meta.url).pathname
const dirname = new URL('.', import.meta.url).pathname

const basename = path.basename(filename)
const env = process.env.NODE_ENV || 'development'
const db = {}

const databases = Object.keys(config[env].databases)

for (let i = 0; i < databases.length; ++i) {
  const database = databases[i]
  const dbPath = config[env].databases[database]

  db[database] = new Sequelize(dbPath.database, dbPath.username, dbPath.password, dbPath)
}

fs
  .readdirSync(path.join(dirname, './userapi'))
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.cjs')
  })
  .forEach(file => {
    const model = import('./userapi/' + file)

    db[model.name] = model(db.UserAPI, DataTypes)
  })

db.sequelize = sequelize
db.Sequelize = Sequelize

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

export default db
