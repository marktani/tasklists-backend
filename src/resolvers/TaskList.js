const TaskList = {
  id: (parent) => parent.id,
  name: (parent) => parent.name,
  description: (parent) => parent.description,
  slug: (parent) => parent.slug,
  tasks(parent, args, ctx) {
    return ctx.prisma.tasks({ where: { taskList: { id: parent.id }, } })
  }
}

module.exports = TaskList