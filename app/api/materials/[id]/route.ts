import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.material.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "ลบพัสดุสำเร็จ" });
  } catch (error) {
    return NextResponse.json({ error: "ลบข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const contentType = req.headers.get("content-type") || "";

    let updateData: any = {};
    let locationCodes: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      updateData.description = formData.get("description")?.toString() || "";
      updateData.thaiName = formData.get("thaiName")?.toString() || "";
      updateData.specificTerm = formData.get("specificTerm")?.toString() || "";
      updateData.placeOfWork = formData.get("placeOfWork")?.toString() || "";
      updateData.remark = formData.get("remark")?.toString() || "";
      
      // ดึงพิกัดทั้งหมดที่ส่งมาเป็น Array
      locationCodes = formData.getAll("locationCodes").map((s: any) => s.toString()).filter(Boolean);

      const imageFile = formData.get("image") as File | null;
      if (imageFile && imageFile.size > 0) {
        // 💡 แปลงไฟล์รูปภาพส่งไปฝากไว้ที่ ImgBB 
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const base64String = buffer.toString('base64');
        
        const imgbbApiKey = process.env.IMGBB_API_KEY;
        if (!imgbbApiKey) {
          return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า IMGBB_API_KEY ในระบบ" }, { status: 500 });
        }

        const imgbbFormData = new FormData();
        imgbbFormData.append("key", imgbbApiKey);
        imgbbFormData.append("image", base64String);

        const uploadRes = await fetch("https://api.imgbb.com/1/upload", {
          method: "POST",
          body: imgbbFormData,
        });

        const uploadData = await uploadRes.json();

        if (uploadData.success) {
          // ดึง URL ที่ ImgBB ตอบกลับมา
          updateData.imageUrl = uploadData.data.url;
        } else {
          console.error("ImgBB Upload Error:", uploadData);
          return NextResponse.json({ error: "อัปโหลดรูปภาพไปที่ ImgBB ไม่สำเร็จ" }, { status: 500 });
        }
      }
    } else {
      const body = await req.json();
      updateData.description = body.description;
      updateData.thaiName = body.thaiName;
      updateData.specificTerm = body.specificTerm;
      updateData.placeOfWork = body.placeOfWork;
      updateData.remark = body.remark;
      locationCodes = body.locationCodes || [];
    }

    // อัปเดตพิกัดแบบ Many-to-Many
    const targetBins = await prisma.storageBin.findMany({
      where: { code: { in: locationCodes } }
    });

    const updated = await prisma.material.update({
      where: { id },
      data: {
        ...updateData,
        bins: { set: targetBins.map((b: any) => ({ id: b.id })) } 
      }
    });

    return NextResponse.json({ success: true, material: updated });
  } catch (error) {
    return NextResponse.json({ error: "แก้ไขข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}