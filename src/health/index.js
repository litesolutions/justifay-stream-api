import Router from '@koa/router'
import { initialize } from 'koa-openapi'
import openapiDoc from './api-doc.js'
import cors from '@koa/cors'
import apiDocs from './routes/apiDocs.js'
import healthModule from './routes/index.js'

const health = new Router()
const router = new Router()

initialize({
  router,
  basePath: '/health',
  apiDoc: openapiDoc,
  paths: [
    { path: '/apiDocs', module: apiDocs },
    { path: '/', module: healthModule }
  ]
})

health.use(cors())
health.use('/health', router.routes(), router.allowedMethods({ throw: true }))

export default health
