const { randomBytes } = require('crypto')
const { promisify } = require('util')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const cookieSettings = {
  httpOnly: true, 
  maxAge: 1000 * 60 * 60 *24 * 365, // 1 year cookie
}

module.exports = {
  async createUser(parent, args, ctx, info) {
    // TODO For better error handling check if user already exists 
    // and return custom error:
    // https://www.prisma.io/docs/prisma-client/features/check-existence-JAVASCRIPT-pyl1/

    const email = args.email.toLowerCase()
    const signupToken = (await promisify(randomBytes)(20)).toString('hex')
    const signupTokenExpiry = Date.now() + (3600000 * 24 * 14) // 1 week

    const user = await ctx.prisma.createUser({
      ...args,
      email,
      signupToken,
      signupTokenExpiry
    })

    // Send email to user with link to signup incl token
    // TODO improve signup email
    
    ctx.sgMail.send({
      to: email,
      from: process.env.COMPANY_EMAIL,
      subject: `Your ${process.env.COMPANY_NAME} devlist invite`,
      text: `You've been invited to join the ${process.env.COMPANY_NAME} devlist. Visit ${process.env.FRONTEND_URL}/signup?token=${signupToken}`,
      html: `<strong>You've been invited to join the ${process.env.COMPANY_NAME} devlist.</strong> Click <a href="${process.env.FRONTEND_URL}/signup?token=${signupToken}">here to get started</a>`,
    })

    // ToDo if .send fails then delete the user from the database and send a good error message

    return user
  },

  async signUp(parent, args, ctx, info) {
    const user = await ctx.prisma.user({ signupToken: args.token })

    // TODO what's the flow for if a token has expired, how do we send them a new one? 

    // TODO improve error messages
    if(!user) throw new Error('Signup token is invalid')
    if(user.password) throw new Error(`You've already signed up`)
    if(user.signupTokenExpiry < Date.now()) throw new Error('Signup token has expired')

    const password = await bcrypt.hash(args.password, 10)

    const signedUpUser = await ctx.prisma.updateUser({
      where: { signupToken: args.token },
      data: { password }
    })

    const token = jwt.sign({ userId: signedUpUser.id }, process.env.APP_SECRET)

    ctx.response.cookie('token', token, cookieSettings)

    return signedUpUser
  },

  async signIn(parent, {email, password}, ctx, info) {
    const user = await ctx.prisma.user({ email })    
    if(!user) throw new Error('this is an error')

    const matchingPass = await bcrypt.compare(password, user.password)
    if(!matchingPass) throw new Error('Incorrect password')

    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET)
    ctx.response.cookie('token', token, cookieSettings)

    return user
  },

  async signOut(parent, args, ctx, info) {
    ctx.response.clearCookie('token')
    return { message: 'Success' }
  }
}