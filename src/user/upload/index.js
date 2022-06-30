import Router from '@koa/router'
import { initialize } from 'koa-openapi'
import openapiDoc from './api-doc.js'
import path from 'path'
import koaBody from 'koa-body'
import bytes from 'bytes'
import apiDocs from './routes/apiDocs.js'
import uploadService from './services/uploadService.js'
import uploadModule from './routes/index.js'

const BASE_DATA_DIR = process.env.BASE_DATA_DIR || '/'

const upload = new Router()
const router = new Router()

initialize({
  router,
  basePath: '/user/upload',
  apiDoc: openapiDoc,
  paths: [
    { path: '/apiDocs', module: apiDocs },
    { path: '/', module: uploadModule }
  ],
  dependencies: {
    uploadService: uploadService
  }
})

upload
  .use(koaBody({
    multipart: true,
    formidable: {
      uploadDir: path.join(BASE_DATA_DIR, '/data/media/incoming/'),
      maxFileSize: bytes('2 GB')
    },
    onError: (err, ctx) => {
      if (/maxFileSize/.test(err.message)) {
        ctx.status = 400
        ctx.throw(400, err.message)
      }
    }
  }))
  .use(router.routes())
  .use(router.allowedMethods({
    throw: true
  }))

upload.use('/upload', router.routes(), router.allowedMethods({ throw: true }))

export default upload
