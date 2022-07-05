export default function (uploadService) {
  const operations = {
    POST,
    GET
  }

  async function GET (ctx, next) {
    ctx.set('Content-Type', 'text/html')

    ctx.body = `
      <!doctype html>
      <html>
        <body>
          <form action="/api/user/upload" enctype="multipart/form-data" method="post">
          <input type="file" name="uploads" multiple="multiple"><br>
          <button type="submit">Upload</button>
        </body>
      </html>
    `

    await next()
  }

  async function POST (ctx, next) {
    try {
      const uploads = ctx.request.files.uploads

      ctx.status = 202

      ctx.body = {
        data: Array.isArray(uploads)
          ? await Promise.all(uploads.map(uploadService(ctx).processFile))
          : await uploadService(ctx).processFile(uploads),
        status: 202
      }
    } catch (err) {
      ctx.throw(ctx.status, err.message)
    }

    await next()
  }

  POST.apiDoc = {
    operationId: 'uploadFile',
    description: 'Upload audio or image file',
    summary: 'Upload file',
    tags: ['upload'],
    produces: [
      'application/json'
    ],
    consumes: ['multipart/form-data'],
    parameters: [
      {
        in: 'formData',
        name: 'uploads',
        type: 'file',
        description: 'The file to upload.'
      }
    ],
    responses: {
      400: {
        description: 'Bad request',
        schema: {
          $ref: '#/responses/BadRequest'
        }
      },
      404: {
        description: 'Not found',
        schema: {
          $ref: '#/responses/NotFound'
        }
      },
      default: {
        description: 'error payload',
        schema: {
          $ref: '#/definitions/Error'
        }
      }
    }
  }

  return operations
}
