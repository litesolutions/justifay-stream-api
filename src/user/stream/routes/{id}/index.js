import path from 'path'
import { readdir } from 'node:fs/promises'
import { validate as validateUUID } from 'uuid'
import fs from 'fs'

const BASE_DATA_DIR = process.env.BASE_DATA_DIR || '/'

export default function () {
  const operations = {
    GET
  }

  async function GET (ctx, next) {
    try {
      const files = await readdir(path.join(BASE_DATA_DIR, '/data/media/audio'))
      const tracks = []

      const list = files
        .map(fileName => ({
          name: fileName,
          time: fs.statSync(path.join(BASE_DATA_DIR, `/data/media/audio/${fileName}`)).mtime.getTime()
        }))
        .sort((a, b) => a.time - b.time)
        .map(file => file.name)

      let index = 0
      for (const file of list) {
        const name = file.split('.')[0]
        if (validateUUID(name)) {
          index = index + 1
          tracks.push({
            id: name,
            track_id: index
          })
        }
      }

      const track = tracks.find(({ track_id: id }) => id === ctx.params.id)

      if (!track) {
        ctx.status = 404
        ctx.throw(ctx.status, 'Not found')
      }

      const ext = '.m4a'
      const filename = track.id // uuid

      ctx.set({
        'Content-Type': 'audio/mp4',
        'Content-Disposition': `inline; filename=${filename}${ext}`,
        'X-Accel-Redirect': `/audio/${filename}${ext}` // internal redirect
      })
    } catch (err) {
      ctx.throw(ctx.status, err.message)
    }

    await next()
  }

  GET.apiDoc = {
    operationId: 'streamTrack',
    description: 'Returns streamable file',
    produces: [
      'audio/x-m4a'
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        type: 'integer',
        required: true,
        description: 'Track id'
      }
    ],
    responses: {
      200: {
        description: 'The requested streamable data.',
        schema: {
          type: 'object'
        }
      },
      default: {
        description: 'The requested data.'
      }
    }
  }

  return operations
}
