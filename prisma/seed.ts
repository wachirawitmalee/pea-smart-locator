import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  const admin = await prisma.user.upsert({
    where: { username: 'admin_ranot' },
    update: {},
    create: { username: 'admin_ranot', password: 'password123', role: 'ADMIN' },
  })

  const openStorage = await prisma.storageType.upsert({
    where: { name: 'คลังโปร่ง' },
    update: {},
    create: { name: 'คลังโปร่ง' },
  })
  
  await prisma.storageType.upsert({
    where: { name: 'คลังทึบ' },
    update: {},
    create: { name: 'คลังทึบ' },
  })

  const locationA308 = await prisma.location.upsert({
    where: { code: 'A-3-08' },
    update: {},
    create: { code: 'A-3-08', zone: 'A', floor: 3, block: 8, mapX: 150.5, mapY: 200.0, storageTypeId: openStorage.id },
  })

  await prisma.material.upsert({
    where: { materialCode: '1030140011' },
    update: {},
    create: {
      materialCode: '1030140011',
      description: 'CLEVIS THIMBLE FOR PREFORMED DEADEND',
      thaiName: 'ห่วงรองรับสายยึดโยง',
      specificTerm: 'Clevis',
      placeOfWork: 'สถานที่ปฏิบัติงาน กฟภ.ระโนด', 
      locationId: locationA308.id,
    },
  })

  console.log('Seeding finished successfully! 🎉')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })