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
  const { address, clientName } = request.body
  return await prisma.task.create({
    data: { address, clientName }
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

  // Меняем статус задания на "done", чтобы было видно, что акт заполнен
  await prisma.task.update({
    where: { id: taskId },
    data: { status: 'done' }
  })

  return act
})

const start = async () => {
  try {
    await fastify.listen(3000, '0.0.0.0')
    console.log('Сервер: http://localhost:3000')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()