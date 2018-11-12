require('dotenv').config()
const { prisma } = require('./generated/prisma-client')
const { GraphQLServer } = require('graphql-yoga')
const sgMail = require('@sendgrid/mail')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')

const Mutation = require('./resolvers/Mutation')
const Query = require('./resolvers/Query')
const Task = require('./resolvers/Task')
const TaskList = require('./resolvers/TaskList')

sgMail.setApiKey(process.env.SENDGRID_KEY)

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers: {
    Mutation,
    Query,
    Task,
    TaskList,
  },
  context: req => ({
    ...req,
    prisma,
    sgMail
  }),
})

server.express.use(cookieParser())

// middleware to decode cookie and out the userId on
// each request
server.express.use((req, res, next) => {
  const { token } = req.cookies
  if(token) {
    // TODO what happens if the token doesn't verify
    const verifiedToken = jwt.verify(token, process.env.APP_SECRET)
    req.userId = verifiedToken.userId
  } else {
    // TODO: TEMP HACK
    req.userId = 'cjoehsg0nwa110a01lfqm2a3k'
  }
  next()
})

server.start({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
},(server) => console.log('Server is running on port ' + server.port))