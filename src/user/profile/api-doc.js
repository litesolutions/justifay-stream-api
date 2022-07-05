const apiDoc = {
  swagger: '2.0',
  info: {
    title: 'Profile API',
    version: '1.0.0-0'
  },
  securityDefinitions: {
    Bearer: { type: 'apiKey', name: 'Authorization', in: 'header' }
  },
  definitions: {
    Error: {
      type: 'object',
      properties: {
        code: {
          type: 'string'
        },
        message: {
          type: 'string'
        }
      },
      required: [
        'code',
        'message'
      ]
    }
  },
  responses: {
    BadRequest: {
      description: 'Bad request',
      schema: {
        $ref: '#/definitions/Error'
      }
    },
    NotFound: {
      description: 'No profile found.',
      schema: {
        $ref: '#/definitions/Error'
      }
    }
  },
  paths: {},
  security: [
    { Bearer: [] }
  ],
  tags: [{ name: 'profile' }]
}

export default apiDoc
