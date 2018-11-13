const Task = {
  id: (parent) => parent.id,
  title: (parent) => parent.title,
  description: (parent) => {
    console.log('Task Resolver', parent)
    return parent.description
  },
  dueDate: (parent) => parent.dueDate,
  due: (parent) => parent.due,
  createdAt: (parent) => parent.createdAt,
  updatedAt: (parent) => parent.updatedAt,
  customFields: (parent) => parent.customFields,
  status: (parent) => parent.status,
}

module.exports = Task