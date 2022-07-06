import Router from '@koa/router'
import { initialize } from 'koa-openapi'
import openapiDoc from './api-doc.js'
import apiDocs from './routes/apiDocs.js'
import streamModule from './routes/{id}/index.js'

const stream = new Router()
const router = new Router()

initialize({
  router,
  basePath: '/user/stream',
  apiDoc: openapiDoc,
  paths: [
    { path: '/apiDocs', module: apiDocs },
    { path: '/:id', module: streamModule }
  ]
})

stream.use('/stream', router.routes(), router.allowedMethods({ throw: true }))

export default stream
