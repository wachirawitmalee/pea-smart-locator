import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 🔍 GET: ดึงข้อมูลสถานที่จัดเก็บและโครงสร้างภายในทั้งหมดไปใช้งาน
export async function GET() {
  try {
    const locations = await prisma.storageLocation.findMany({
      include: {
        zones: {
          include: {
            bins: {
              orderBy: { code: 'asc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(locations);
  } catch (error: any) {
    console.error("Fetch Locations Error:", error);
    return NextResponse.json({ error: "ดึงข้อมูลสถานที่จัดเก็บไม่สำเร็จ" }, { status: 500 });
  }
}

// 💾 POST: บันทึกโครงสร้างสถานที่ใหม่ (รองรับแบบหลายแร็ค และเริ่มนับชั้นจาก 0)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type, racks, grid } = body;

    // ตรวจสอบค่าจำเป็นพื้นฐาน
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "กรุณาระบุชื่อสถานที่จัดเก็บหลัก" }, { status: 400 });
    }

    // ตรวจสอบชื่อสถานที่ซ้ำในฐานข้อมูล
    const existingLoc = await prisma.storageLocation.findUnique({
      where: { name: name.trim() },
    });

    if (existingLoc) {
      return NextResponse.json({ error: "ชื่ออาคารหรือลานสนามนี้มีอยู่ในระบบแล้ว โปรดใช้ชื่ออื่น" }, { status: 400 });
    }

    let createdLocation;

    // 🏗️ กรณีที่ 1: คลังสินค้าในร่ม (INDOOR - ปรับปรุงเป็นแบบหลายชั้นวาง/แร็ค)
    if (type === "INDOOR" && racks && Array.isArray(racks)) {
      const zonesToCreate = [];

      // วนลูปตามจำนวนชั้นวาง (Rack) ที่แอดมินสร้างไว้
      for (const rack of racks) {
        // วนลูปสร้างระดับชั้น โดยเริ่มนับจากชั้น 0 (ชั้นพื้นดิน) จนถึงชั้นบนสุด (floorCount - 1)
        for (let floor = 0; floor < rack.floorCount; floor++) {
          zonesToCreate.push({
            name: `${rack.name} - ชั้น ${floor}`, // บันทึกลงตารางโซน เช่น "แร็ค A - ชั้น 0"
            bins: {
              create: Array.from({ length: rack.blocks }).map((_, index) => ({
                // เจนรหัสพิกัดสมบูรณ์ในรูปแบบ: [ชื่อคลัง]-[ชื่อแร็ค]-F[ชั้น]-B[ช่อง]
                code: `${name.trim()}-${rack.name.trim()}-F${floor}-B${String(index + 1).padStart(2, "0")}`,
                status: "EMPTY",
              })),
            },
          });
        }
      }

      // บันทึกลงฐานข้อมูลรวดเดียวด้วย Nested Relation ของ Prisma
      createdLocation = await prisma.storageLocation.create({
        data: {
          name: name.trim(),
          type: "INDOOR",
          zones: {
            create: zonesToCreate,
          },
        },
      });
    } 
    // 🏕️ กรณีที่ 2: ลานกลางแจ้งพื้นที่สนาม (OUTDOOR - ตารางกริดเว้นทางเดินรถ)
    else if (type === "OUTDOOR" && grid) {
      const deactivated = grid.deactivatedCells || [];
      const binsToCreate = [];

      for (let r = 1; r <= grid.height; r++) {
        for (let c = 1; c <= grid.width; c++) {
          const cellKey = `${r}-${c}`;
          // สร้างพิกัดเฉพาะช่องที่เปิดใช้งาน (ไม่ใช่ช่องทางเดินรถหรือสิ่งกีดขวาง)
          if (!deactivated.includes(cellKey)) {
            binsToCreate.push({
              code: `${name.trim()}-R${r}-C${c}`,
              status: "EMPTY",
            });
          }
        }
      }

      createdLocation = await prisma.storageLocation.create({
        data: {
          name: name.trim(),
          type: "OUTDOOR",
          zones: {
            create: [
              {
                name: "ลานกว้าง",
                bins: {
                  create: binsToCreate,
                },
              },
            ],
          },
        },
      });
    } else {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูลโครงสร้าง" }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "สร้างโครงสร้างสถานที่และระบบพิกัดจัดเก็บเรียบร้อยแล้ว",
      location: createdLocation 
    });

  } catch (error: any) {
    console.error("Critical Location Creation Error:", error);
    return NextResponse.json({ error: error.message || "เกิดข้อผิดพลาดทางเทคนิคในเซิร์ฟเวอร์หลังบ้าน" }, { status: 500 });
  }
}