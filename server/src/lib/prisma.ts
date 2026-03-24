import { PrismaClient } from '@prisma/client'

// Une seule instance Prisma pour toute l'application
const prisma = new PrismaClient({
  log: ['error', 'warn'],
})

export default prisma
