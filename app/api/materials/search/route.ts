import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const cleanQuery = query.trim();

    let whereClause = {};

    if (cleanQuery) {
      // ลบขีดและช่องว่างออกเพื่อตรวจสอบว่าเป็นตัวเลขล้วนหรือไม่
      const noHyphenQuery = cleanQuery.replace(/[-\s]/g, "");
      let peaFormatQuery = cleanQuery;

      // 💡 อัลกอริทึมอัจฉริยะ: หากพิมพ์มาแค่ตัวเลขล้วน จะแปลงเป็น Format กฟภ. (X-XX-XXX-XXXX) อัตโนมัติ
      if (/^\d+$/.test(noHyphenQuery)) {
        const p1 = noHyphenQuery.substring(0, 1);
        const p2 = noHyphenQuery.substring(1, 3);
        const p3 = noHyphenQuery.substring(3, 6);
        const p4 = noHyphenQuery.substring(6, 10);
        
        // ประกอบร่างกลับเข้าไปใหม่ โดยเติมขีดคั่น
        const parts = [p1, p2, p3, p4].filter(Boolean);
        peaFormatQuery = parts.join("-");
      }

      whereClause = {
        OR: [
          { materialCode: { contains: cleanQuery } },      // ค้นหาแบบตรงๆ ตามที่พิมพ์มา
          { materialCode: { contains: peaFormatQuery } },  // ค้นหาแบบแอบเติมขีดให้แล้ว (เช่น พิมพ์ 237 -> หา 2-37)
          { materialCode: { contains: noHyphenQuery } },   // ค้นหาแบบลบขีดออกหมด (เผื่อข้อมูลในระบบบันทึกมาแบบไม่มีขีด)
          { description: { contains: cleanQuery } },       // ค้นหาคำอธิบายภาษาอังกฤษ
          { thaiName: { contains: cleanQuery } },          // ค้นหาชื่อภาษาไทย
          { specificTerm: { contains: cleanQuery } },      // ค้นหาศัพท์เฉพาะ
          { placeOfWork: { contains: cleanQuery } },       // ค้นหาสถานที่ปฏิบัติงาน
          { remark: { contains: cleanQuery } },            // ค้นหาหมายเหตุ
        ],
      };
    }

    const materials = await prisma.material.findMany({
      where: whereClause,
      include: {
        bins: {
          include: {
            zone: {
              include: {
                location: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(materials);
  } catch (error: any) {
    console.error("Critical Search API Error:", error);
    return NextResponse.json({ error: error.message || "เกิดความผิดพลาดในการประมวลผลคำสั่งหลังบ้าน" }, { status: 500 });
  }
}