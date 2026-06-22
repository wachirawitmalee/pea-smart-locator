import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')
  
  // 💡 ปิดการสร้างข้อมูล User เนื่องจากไม่มีตารางนี้ในระบบโครงสร้างปัจจุบันแล้ว
  // หากต้องการใส่ข้อมูลเริ่มต้น (Seed) ให้ตารางอื่น สามารถมาเขียนเพิ่มได้ที่นี่ในอนาคต

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })