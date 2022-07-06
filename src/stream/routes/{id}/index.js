import path from 'path'
import { readdir } from 'node:fs/promises'
import { validate as validateUUID } from 'uuid'

const BASE_DATA_DIR = process.env.BASE_DATA_DIR || '/'

export default function () {
  const operations = {
    GET
  }

  async function GET (ctx, next) {
    try {
      const files = await readdir(path.join(BASE_DATA_DIR, '/data/media/audio'))
      const tracks = []

      for (const [index, file] of files.entries()) {
        const name = file.split('.')[0]
        if (validateUUID(name)) {
          tracks.push({
            id: name,
            track_id: index + 1
          })
        }
      }

      console.log(tracks)

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
