import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    
    let materialCode = "";
    let description = "";
    let thaiName = "";
    let specificTerm = "";
    let placeOfWork = "สถานที่ปฏิบัติงาน กฟภ.ระโนด";
    let locationCode = "";
    let remark = "";
    let imageUrl: string | null = null;

    // 📸 กรณีอัปโหลดจากหน้าต่าง "เพิ่มพัสดุเดี่ยว" (รับเป็น FormData เพราะมีรูป)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      materialCode = formData.get("materialCode")?.toString() || "";
      description = formData.get("description")?.toString() || "";
      thaiName = formData.get("thaiName")?.toString() || "";
      specificTerm = formData.get("specificTerm")?.toString() || "";
      placeOfWork = formData.get("placeOfWork")?.toString() || "สถานที่ปฏิบัติงาน กฟภ.ระโนด";
      locationCode = formData.get("locationCode")?.toString() || "";
      remark = formData.get("remark")?.toString() || "";
      
      const imageFile = formData.get("image") as File | null;

      if (imageFile && imageFile.size > 0) {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        
        // ตรวจสอบและสร้างโฟลเดอร์ uploads อัตโนมัติถ้ายังไม่มี
        try {
          await fs.access(uploadDir);
        } catch {
          await fs.mkdir(uploadDir, { recursive: true });
        }
        
        const fileExtension = path.extname(imageFile.name) || ".png";
        const filename = `${materialCode.trim()}_${Date.now()}${fileExtension}`;
        const filePath = path.join(uploadDir, filename);
        
        await fs.writeFile(filePath, buffer);
        imageUrl = `/uploads/${filename}`;
      }
    } 
    // 📄 กรณีฉุกเฉิน (เผื่อส่งเป็น JSON มา)
    else {
      const body = await req.json();
      materialCode = body.materialCode || "";
      description = body.description || "";
      thaiName = body.thaiName || "";
      specificTerm = body.specificTerm || "";
      placeOfWork = body.placeOfWork || "สถานที่ปฏิบัติงาน กฟภ.ระโนด";
      locationCode = body.locationCode || "";
      remark = body.remark || "";
    }

    if (!materialCode || !description) {
      return NextResponse.json({ error: "ข้อมูลรหัสพัสดุหรือชื่อไม่ครบถ้วน" }, { status: 400 });
    }

    // ตรวจสอบว่ารหัสพัสดุซ้ำไหม
    const existingMaterial = await prisma.material.findUnique({
      where: { materialCode: materialCode.trim() },
    });

    if (existingMaterial) {
      return NextResponse.json({ error: `รหัสพัสดุ "${materialCode}" มีอยู่ในระบบคลังแล้ว` }, { status: 400 });
    }

    // หันไปเช็ครหัสพิกัดว่ามีจริงไหมในระบบ
    let binId = null;
    if (locationCode) {
      const targetBin = await prisma.storageBin.findUnique({
        where: { code: locationCode },
      });
      if (!targetBin) {
        return NextResponse.json({ error: `ไม่พบพิกัดจัดเก็บ "${locationCode}" โปรดตรวจสอบชื่อพิกัดอีกครั้ง` }, { status: 400 });
      }
      binId = targetBin.id;
    }

    // บันทึกลงฐานข้อมูล
    const newMaterial = await prisma.material.create({
      data: {
        materialCode: materialCode.trim(),
        description: description.trim(),
        thaiName: thaiName ? thaiName.trim() : null,
        specificTerm: specificTerm ? specificTerm.trim() : null,
        placeOfWork: placeOfWork,
        remark: remark ? remark.trim() : null,
        imageUrl: imageUrl,
        binId: binId,
      },
    });

    return NextResponse.json({ success: true, material: newMaterial });
  } catch (error: any) {
    console.error("Create Material Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเขียนฐานข้อมูล" }, { status: 500 });
  }
}