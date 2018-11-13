const TaskList = {
  id: (parent) => parent.id,
  name: (parent) => parent.name,
  description: (parent) => {
    console.log('TaskList resolver', parent)
    return parent.description
  },
  slug: (parent) => parent.slug,
  tasks(parent, args, ctx) {
    return ctx.prisma.tasks({ where: { taskList: { id: parent.id }, } })
  },
  totalTaskCount: async (parent, args, ctx) => {
    const length = await ctx.prisma.tasksConnection({ where: { taskList: { id: parent.id }, } }).aggregate().count()
    return length
  },
  closedTaskCount: (parent) => 0,
}

module.exports = TaskList