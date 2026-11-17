const fastify = require('fastify')({ logger: true })
const cors = require('fastify-cors')
fastify.register(cors)

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

fastify.get('/api/health', async () => {
  return { status: 'ok' }
})

fastify.get('/api/tasks', async () => {
  return await prisma.task.findMany()
})

fastify.post('/api/tasks', async (request) => {
  const { address, clientName, type, companyCode, defaultWorks } = request.body
  return await prisma.task.create({
    data: { 
      address, 
      clientName,
      type,
      companyCode: companyCode || null,
      defaultWorks: defaultWorks || null
    }
  })
})

fastify.get('/api/tasks/:id/act', async (request) => {
  const { id } = request.params
  return await prisma.act.findFirst({
    where: { taskId: id }
  })
})

fastify.delete('/api/tasks/:id', async (request) => {
  const { id } = request.params
  // Сначала удаляем связанный акт
  await prisma.act.deleteMany({
    where: { taskId: id }
  })
  // Потом саму задачу
  return await prisma.task.delete({
    where: { id }
  })
})

fastify.post('/api/acts', async (request) => {
  const { taskId, clientFio, works, totalAmount, signatureBase64 } = request.body
  
  const act = await prisma.act.create({
    data: {
      taskId,
      clientFio,
      works,
      totalAmount,
      signatureBase64
    }
  })

  await prisma.task.update({
    where: { id: taskId },
    data: { status: 'done' }
  })

  return act
})

const start = async () => {
  try {
    await fastify.listen(process.env.PORT || 3000, '0.0.0.0')
    console.log('Сервер запущен')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()