import express from 'express'
import { restAPIRouter } from './routers/api'
import {
  initialize as initializeRequestId,
  requestId,
} from './framework/express/middlewares/request-id'
import { initialize as intiializeLogger } from './framework/express/middlewares/logger'
import { setupRequestLogger } from './framework/express/middlewares/request-logger'
import { mediaServeRouter } from './routers/media/serve'

// https://stackoverflow.com/a/14631683

initializeRequestId()
intiializeLogger()

const app = express()
// to know ip address
app.set('trust proxy', true)
// attach requestId per express request
app.use(requestId())
setupRequestLogger(app)

// REST API router
app.use(`/api/rest/`, restAPIRouter)
app.use(`/m/`, mediaServeRouter)

/*
  use this app for supertest!
*/
export { app }
