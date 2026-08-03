import { prisma } from './src/lib/prisma'

async function main() {
  console.log('🔄 Fetching users...')
  const users = await prisma.user.findMany({
    select: {
      id_user: true,
      nama_lengkap: true,
      email: true,
      total_balance: true
    }
  })

  if (users.length === 0) {
    console.log('❌ No users found in the database. Please create users first via login/register.')
    return
  }

  // Update everyone to 500,000 except the first one
  const zeroBalanceUserId = users[0].id_user
  
  console.log(`👤 Setting user ${users[0].nama_lengkap} (${users[0].email}) to have 0 balance...`)
  
  await prisma.user.update({
    where: { id_user: zeroBalanceUserId },
    data: { total_balance: 0 }
  })

  console.log(`💰 Setting all other users to have 500,000 balance...`)
  await prisma.user.updateMany({
    where: { id_user: { not: zeroBalanceUserId } },
    data: { total_balance: 500000 }
  })

  console.log('✅ Done!')
  
  const updatedUsers = await prisma.user.findMany({
    select: {
      nama_lengkap: true,
      email: true,
      total_balance: true
    }
  })
  
  console.log('Current balances:')
  console.table(updatedUsers)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
