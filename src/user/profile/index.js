import Router from '@koa/router'
import { initialize } from 'koa-openapi'
import openapiDoc from './api-doc.js'
import apiDocs from './routes/apiDocs.js'
import profileModule from './routes/index.js'

const profile = new Router()
const router = new Router()

initialize({
  router,
  basePath: '/user/profile',
  apiDoc: openapiDoc,
  paths: [
    { path: '/apiDocs', module: apiDocs },
    { path: '/', module: profileModule }
  ]
})

profile.use('/profile', router.routes(), router.allowedMethods({ throw: true }))

export default profile
