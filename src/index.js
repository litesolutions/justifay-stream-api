import Koa from 'koa'
import logger from 'koa-logger'
import compress from 'koa-compress'
import error from 'koa-json-error'
import mount from 'koa-mount'
import etag from 'koa-etag'
import session from 'koa-session'
import koaCash from 'koa-cash'
import { koaSwagger } from 'koa2-swagger-ui'
import cors from '@koa/cors'

import KeyGrip from 'keygrip'

import koaCashConfig from './config/cache.js'
import errorConfig from './config/error.js'
import compressConfig from './config/compression.js'
import sessionConfig from './config/session.js'

/**
 * Koa apps
 */
import health from './health/index.js'
import user from './user/index.js'

const app = new Koa({
  keys: new KeyGrip([process.env.APP_KEY, process.env.APP_KEY_2], 'sha256'),
  proxy: true
})

const origins = [
  'http://localhost:8080',
  'https://localhost:8080',
  'https://id.justifay.com',
  'https://stream.justifay.com',
  'https://justifay.com'
]

const buildSwaggerOpts = (routes) => {
  return routes.map(route => {
    const { pathname, prefix = '', name, type = 'apiDoc' } = route
    const basePath = process.env.API_PREFIX + prefix + pathname
    const url = new URL(basePath + '/apiDocs', 'http://localhost')
    const params = {
      type,
      basePath
    }

    url.search = new URLSearchParams(params)

    return {
      url: url.pathname + url.search,
      name
    }
  })
}

app
  .use(logger())
  .use(session(sessionConfig, app))
  .use(compress(compressConfig()))
  .use(error(errorConfig()))
  .use(koaSwagger({
    swaggerOptions: {
      urls: buildSwaggerOpts([
        {
          pathname: '/health',
          name: 'Health API Service'
        },
        {
          pathname: '/upload',
          prefix: '/user',
          name: 'Upload API Service'
        },
        {
          pathname: '/profile',
          prefix: '/user',
          name: 'Profile API Service'
        }
      ])
    }
  })) // swagger-ui at /docs
  .use(koaCash(koaCashConfig()))
  .use(etag()) // required for koa-cash to propertly set 304
  .use(cors({
    origin: async (req) => {
      if (req.header.origin && origins.includes(req.header.origin)) return req.header.origin
    },
    credentials: true,
    headers: ['Content-Type', 'Authorization']
  }))

app.use(health.routes())
app.use(mount('/user', user))

export default app
