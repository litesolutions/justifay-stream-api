import { Queue, QueueEvents } from 'bullmq'
import { promises as fs } from 'fs'
import path from 'path'
import shasum from 'shasum'
import winston from 'winston'
import { v4 as uuidv4 } from 'uuid'
import dimensions from 'image-size'
import * as mm from 'music-metadata'
import { fileTypeFromFile } from 'file-type'

import sharpConfig from '../../../config/sharp.js'

import {
  REDIS_CONFIG
} from '../../../config/redis.js'

import {
  // HIGH_RES_AUDIO_MIME_TYPES,
  SUPPORTED_AUDIO_MIME_TYPES,
  SUPPORTED_IMAGE_MIME_TYPES
} from '../../../config/supported-media-types.js'

const BASE_DATA_DIR = process.env.BASE_DATA_DIR || '/'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'upload' },
  transports: [
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.simple()
    }),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error'
    })
  ]
})

const queueOptions = {
  prefix: 'justifay',
  connection: REDIS_CONFIG
}

const audioQueue = new Queue('convert-audio', queueOptions)

const queueEvents = new QueueEvents('convert-audio', queueOptions)

queueEvents.on('completed', async ({ jobId }) => {
  console.log(`Job with id ${jobId} has been completed`)

  try {
    const job = await audioQueue.getJob(jobId)

    console.log(job)

    // const file = await File.findOne({
    //   where: {
    //     id: job.data.filename
    //   }
    // })

    // const metadata = file.metadata || { variants: [] }
    // const variants = metadata.variants || []
    //
    // for (const result of job.returnvalue) {
    //   variants.push({
    //     format: 'm4a',
    //     size: result.size,
    //     name: 'audiofile'
    //   })
    // }
    //
    // metadata.variants = variants

    // await File.update({
    //   metadata: metadata,
    //   status: 'ok'
    // }, {
    //   where: {
    //     id: job.data.filename // uuid
    //   }
    // })
  } catch (err) {
    logger.error(err)
  }
})

queueEvents.on('error', (err) => {
  logger.error(err)
})

queueEvents.on('failed', (job, err) => {
  logger.error(err)
})

const audioDurationQueue = new Queue('audio-duration', queueOptions)
const audioDurationQueueEvents = new QueueEvents('audio-duration', queueOptions)

audioDurationQueueEvents.on('completed', async ({ jobId }) => {
  try {
    const job = await audioDurationQueue.getJob(jobId)

    console.log(job)

    // const file = await File.findOne({
    //   where: {
    //     id: job.data.filename
    //   }
    // })
    //
    // await Track.update({
    //   duration: job.returnvalue
    // }, {
    //   where: {
    //     url: file.id
    //   }
    // })
  } catch (err) {
    logger.error(err)
  }
})

const imageQueue = new Queue('convert', queueOptions)
const imageQueueEvents = new QueueEvents('convert', queueOptions)

imageQueueEvents.on('completed', async ({ jobId }) => {
  console.log(`Job with id ${jobId} has been completed`)

  try {
    const job = await imageQueue.getJob(jobId)

    console.log(job)

    // await File.update({
    //   status: 'ok'
    // }, {
    //   where: {
    //     id: job.data.filename // uuid
    //   }
    // })
  } catch (err) {
    logger.error(err)
  }
})

const uploadService = (ctx) => {
  return {
    /*
     * Process a file then queue it for upload
     * @param {object} ctx Koa context
     * @returns {Promise} Promise object containing image
     */
    async processFile (file) {
      const { size: fileSize, path: filePath } = file
      const type = await fileTypeFromFile(filePath)
      const mime = type !== null ? type.mime : file.type

      const isImage = SUPPORTED_IMAGE_MIME_TYPES
        .includes(mime)

      const isAudio = SUPPORTED_AUDIO_MIME_TYPES
        .includes(mime)

      if (!isImage && !isAudio) {
        ctx.status = 400
        ctx.throw(400, `File type not supported: ${mime}`)
      }

      const buffer = await fs.readFile(file.path)
      const sha1sum = shasum(buffer)

      // const result = await File.create(file, { raw: true })

      // const { id: filename, filename: originalFilename } = result.dataValues // uuid/v4
      const filename = uuidv4()

      await fs.rename(
        file.path,
        path.join(BASE_DATA_DIR, `/data/media/incoming/${filename}`)
      )

      const data = {
        filename,
        user_id: ctx.profile.id,
        size: fileSize,
        mime,
        hash: sha1sum
      }

      if (isAudio) {
        logger.info('Parsing audio metadata')

        const metadata = await mm.parseFile(path.join(BASE_DATA_DIR, `/data/media/incoming/${filename}`), {
          duration: true,
          skipCovers: true
        })

        logger.info('Done parsing audio metadata')

        logger.info('Creating new track')

        const track = {
          title: metadata.common.title || file.name,
          creator_id: ctx.profile.id,
          url: filename,
          duration: metadata.format.duration || 0,
          artist: metadata.common.artist,
          album: metadata.common.album,
          year: metadata.common.year,
          album_artist: metadata.common.albumartist,
          number: metadata.common.track.no,
          createdAt: new Date().getTime() / 1000 | 0
        }

        // await Track.create(track)

        if (!metadata.format.duration) {
          audioDurationQueue.add({ filename })
        }

        data.metadata = metadata.common
        data.track = track
        // data.track = track.get({ plain: true })

        logger.info('Adding audio to queue')

        const job = await audioQueue.add('audio', { filename })

        logger.info(`Job created with id: ${job.id}`)
      }

      if (isImage) {
        const { config = 'artwork' } = ctx.request.body // sharp config key
        //
        const { width, height } = await dimensions(path.join(BASE_DATA_DIR, `/data/media/incoming/${filename}`))
        //
        // const file = await File.findOne({
        //   where: {
        //     id: filename
        //   }
        // })
        //
        // const metadata = file.metadata || {}
        //
        // file.metadata = Object.assign(metadata, { dimensions: { width, height } })
        //
        // await file.save()

        logger.info('Adding image to queue')

        data.image = { dimensions: { width, height } }

        imageQueue.add('image', { filename, config: sharpConfig[config] })
      }

      return data
    }
  }
}

export default uploadService
