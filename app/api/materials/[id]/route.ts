import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

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
      
      // ✅ ดึงพิกัดทั้งหมดที่ส่งมาเป็น Array
      locationCodes = formData.getAll("locationCodes").map(s => s.toString()).filter(Boolean);

      const imageFile = formData.get("image") as File | null;
      if (imageFile && imageFile.size > 0) {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        try { await fs.access(uploadDir); } catch { await fs.mkdir(uploadDir, { recursive: true }); }
        const fileExtension = path.extname(imageFile.name) || ".png";
        const filename = `edit_${id}_${Date.now()}${fileExtension}`;
        const filePath = path.join(uploadDir, filename);
        await fs.writeFile(filePath, buffer);
        updateData.imageUrl = `/uploads/${filename}`;
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

    // ✅ อัปเดตพิกัดแบบ Many-to-Many
    const targetBins = await prisma.storageBin.findMany({
      where: { code: { in: locationCodes } }
    });

    const updated = await prisma.material.update({
      where: { id },
      data: {
        ...updateData,
        bins: { set: targetBins.map(b => ({ id: b.id })) } // รีเซ็ตและผูกพิกัดใหม่ทั้งหมด
      }
    });

    return NextResponse.json({ success: true, material: updated });
  } catch (error) {
    return NextResponse.json({ error: "แก้ไขข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}