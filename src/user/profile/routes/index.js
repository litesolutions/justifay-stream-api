import SwaggerClient from 'swagger-client'

export default function () {
  const operations = {
    GET
  }

  async function GET (ctx, next) {
    try {
      // find persona usergroup
      const specUrl = new URL('/user/user.swagger.json', process.env.USER_API_HOST) // user-api swagger docs
      const client = await new SwaggerClient({
        url: specUrl.href,
        authorizations: {
          bearer: 'Bearer ' + ctx.accessToken
        }
      })

      let response = await client.apis.Usergroups.ResonateUser_ListUsersUserGroups({
        id: ctx.profile.id
      })

      const { usergroup: usergroups } = response.body

      response = await client.apis.Users.ResonateUser_GetUserCredits({
        id: ctx.profile.id
      })

      const data = Object.assign({}, ctx.profile, {
        token: ctx.accessToken,
        usergroups: usergroups
      })

      ctx.body = {
        data,
        status: 'ok'
      }
    } catch (err) {
      ctx.status = err.status || 500
      ctx.throw(ctx.status, err.message)
    }

    await next()
  }

  GET.apiDoc = {
    operationId: 'getUserProfile',
    description: 'Returns user profile',
    summary: 'Find user profile',
    tags: ['profile'],
    produces: [
      'application/json'
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
