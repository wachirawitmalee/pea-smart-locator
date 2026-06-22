import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // ✅ ดัก Type Error ตรงนี้: ระบุให้ชัดเจนว่า materials คือ Array ของข้อมูลอะไรก็ได้ (any[])
    const materials: any[] = body.materials;

    if (!materials || !Array.isArray(materials)) {
      return NextResponse.json({ error: "โครงสร้างข้อมูลที่ส่งมาไม่ถูกต้อง (ต้องเป็น Array)" }, { status: 400 });
    }

    let successCount = 0;

    for (const item of materials) {
      // 💡 บังคับตรวจสอบแค่ รหัสพัสดุ และ ชื่อภาษาอังกฤษ เท่านั้น
      if (!item.materialCode || !item.description) continue; 

      const codeStr = item.materialCode.toString().trim();

      // เตรียมข้อมูลสำหรับการสร้าง (Create) หรืออัปเดต (Update)
      let updateData: any = {
        description: item.description.toString().trim(),
        thaiName: item.thaiName ? item.thaiName.toString().trim() : null,
        specificTerm: item.specificTerm ? item.specificTerm.toString().trim() : null,
        remark: item.remark ? item.remark.toString().trim() : null,
      };

      let createData: any = {
        materialCode: codeStr,
        ...updateData,
        placeOfWork: "สถานที่ปฏิบัติงาน กฟภ.ระโนด",
      };

      // 🔍 ตรวจสอบว่าใน Excel มีการใส่รหัสพิกัดมาด้วยหรือไม่ (ถ้าไม่มีก็ข้ามไป ไม่ error)
      if (item.locationCode) {
        const targetBin = await prisma.storageBin.findUnique({
          where: { code: item.locationCode.toString().trim() },
        });
        
        // ถ้าระบุพิกัดมา และพิกัดนั้นมีจริงในระบบ ให้ทำการเชื่อมโยง (Many-to-Many)
        if (targetBin) {
          updateData.bins = { set: [{ id: targetBin.id }] }; // อัปเดตทับของเดิม
          createData.bins = { connect: [{ id: targetBin.id }] }; // สร้างใหม่พร้อมผูกพิกัด
        }
      }

      // ใช้คำสั่ง upsert: มีรหัสนี้อยู่แล้วอัปเดต, ถ้าไม่มีสร้างใหม่
      await prisma.material.upsert({
        where: { materialCode: codeStr },
        update: updateData,
        create: createData,
      });

      successCount++;
    }

    return NextResponse.json({ success: true, count: successCount });
  } catch (error: any) {
    console.error("Bulk Import Server Error:", error);
    return NextResponse.json({ error: "เกิดความผิดพลาดในการเขียนข้อมูล Excel ลงฐานข้อมูล โปรดตรวจสอบความถูกต้องของไฟล์" }, { status: 500 });
  }
}