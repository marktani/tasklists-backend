module.exports = {
  async userByToken(root, args, ctx) {
    const user = await ctx.prisma.user({ signupToken: args.token })
    if(!user) throw new Error('Signup token is invalid')
    if(user.password) throw new Error(`You've already signed up`)
    if(user.signupTokenExpiry < Date.now()) throw new Error('Signup token has expired')

    return user
  },

  async users(root, args, ctx) {
    const { request: { userId } } = ctx
    if(!userId) return []

    const user = await ctx.prisma.user({ id: userId })
    if(!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) return []

    return ctx.prisma.users()
  },

  me(root, args, ctx) {
    if(!ctx.request.userId) return null
    return ctx.prisma.user({ id: ctx.request.userId })
  },
  
  async taskLists(root, args, ctx) {
    console.log('taskLists resolver')
    const { request: { userId } } = ctx
    if(!userId) return []

    // DECISION: do I need to limit getting all categories to admin / superadmin?

    // BIGQUESTION: is a fragment the best thing here? It removes a lot of flexibility on the front end
    // would it be better to use prisma bindings at the same time as the client so can use when needed? 
    
    // Use fragments to get related custom fields to the category
    const fragment = `
      fragment taskListsWithTaskListFields on Category {
        id
        name
        description
        slug
        taskListFields {
          id
          fieldName
          fieldType
        }
        tasks(where: {
          status_not: CLOSED
        }) {
          id
          status
        }
      }
    `

    return ctx.prisma.taskLists()
  },

  async taskList(root, args, ctx) {
    const { request: { userId } } = ctx
    if(!userId) return []
    
    // Use fragments to get related tasks to the category
    const fragment = `
      fragment taskListsWithFields on Category {
        name
        id
        slug
        description
        taskListFields {
          id
          fieldName
          fieldType
        }
      }
    `

    // BIGQUESTION: Do we really need fragments to do this? 

    // Can i run prisma bindings in parralel with prisma client so I don't have
    // to explicity state what fields to return here all the time! it removes so much flexibility
    // on the front end

    return ctx.prisma
      .taskList({ slug: args.slug })
      .$fragment(fragment)

  },

  async tasks(root, args, ctx) {
    const { request: { userId } } = ctx
    if(!userId) return []

    return ctx.prisma
      .tasks({
        where: {
          taskList: {
            slug: args.taskListSlug
          },
          status_not_in: args.excludeStatus
        }
      })
  },

  async openTasks(root, args, ctx) {
    const { request: { userId } } = ctx
    if(!userId) return []

    return ctx.prisma
      .tasks({
        where: {
          taskList: {
            slug: args.taskListSlug
          },
          status_not: 'COMPLETED'
        }
      })
  },

  async completedTasks(root, args, ctx) {
    const { request: { userId } } = ctx
    if(!userId) return []

    return ctx.prisma
      .tasks({
        where: {
          taskList: {
            slug: args.taskListSlug
          },
          status: 'COMPLETED'
        }
      })
  },

  async task(root, args, ctx) {
    const { request: { userId } } = ctx
    if(!userId) throw new Error('You must be logged in to access a task')

    const fragment = `
      fragment taskWithTaskList on Task {
        id
        title
        description
        createdBy {
          name
          id
          avatar
        }
        assignedTo {
          name 
          id
          avatar
        }
        due
        dueDate
        assets {
          id
          assetUrl
          assetType
        }
        taskList {
          name
          slug
        }
        createdAt
        updatedAt
        customFields {
          id
          fieldName
          fieldValue
          fieldType
        }
        status
      }
    `

    /* BIGQUESTION is there some way to use this syntax and get back both
    the task and the taskList ? 
    
      const task = await ctx.prisma
        .task({ id: args.id })
        .taskList()
    */
    const task = await ctx.prisma.task({ id: args.id }).$fragment(fragment)
    if(!task) throw new Error('Task not found')

    return task
  }
}