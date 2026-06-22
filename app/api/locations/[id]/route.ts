import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 🗑️ ฟังก์ชันลบผังคลังสินค้าแบบปลอดภัย
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const zones = await prisma.storageZone.findMany({ where: { locationId: id } });
    const zoneIds = zones.map((z: any) => z.id);
    const bins = await prisma.storageBin.findMany({ where: { zoneId: { in: zoneIds } } });
    const binIds = bins.map(b => b.id);

    if (binIds.length > 0) {
      await prisma.material.updateMany({
        where: { bins: { some: { id: { in: binIds } } } },
        data: { bins: { disconnect: binIds.map(bId => ({ id: bId })) } },
      });
      await prisma.storageBin.deleteMany({ where: { zoneId: { in: zoneIds } } });
    }

    if (zoneIds.length > 0) await prisma.storageZone.deleteMany({ where: { locationId: id } });
    await prisma.storageLocation.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "ลบสถานที่สำเร็จ" });
  } catch (error: any) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบสถานที่จัดเก็บ" }, { status: 500 });
  }
}

// ✏️ ฟังก์ชันแก้ไขผังคลังแบบเจาะลึกโครงสร้าง (Structural Update)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, type, racks, grid } = body;
    
    if (!name || !name.trim()) return NextResponse.json({ error: "กรุณาระบุชื่อสถานที่" }, { status: 400 });

    // 1. อัปเดตชื่อหลักก่อน
    await prisma.storageLocation.update({ where: { id }, data: { name: name.trim() } });

    // 🏗️ 2. กรณีแก้ไขโครงสร้างคลังในร่ม (INDOOR)
    if (type === "INDOOR" && racks) {
      const desiredZones: { name: string; bins: { code: string }[] }[] = [];
      
      // สร้างร่างแบบแปลนใหม่ที่แอดมินต้องการ
      for (const rack of racks) {
        for (const floor of rack.floors) {
          const zoneName = `${rack.name} - ชั้น ${floor.level}`;
          const desiredBins = Array.from({ length: floor.blocks }).map((_, i) => ({
            code: `${name.trim()}-${rack.name.trim()}-F${floor.level}-B${String(i + 1).padStart(2, "0")}`
          }));
          desiredZones.push({ name: zoneName, bins: desiredBins });
        }
      }

      const existingZones = await prisma.storageZone.findMany({ where: { locationId: id }, include: { bins: true } });

      // เปรียบเทียบโซนและจัดการ
      for (const dZone of desiredZones) {
        let eZone = existingZones.find(z => z.name === dZone.name);
        if (!eZone) {
          // โซนนี้เพิ่งถูกสร้างเพิ่มใหม่
          await prisma.storageZone.create({
            data: { locationId: id, name: dZone.name, bins: { create: dZone.bins.map(b => ({ code: b.code, status: "EMPTY" })) } }
          });
        } else {
          // โซนเดิมมีอยู่แล้ว ให้เช็คจำนวนบล็อกพิกัดภายใน
          const eBinCodes = eZone.bins.map(b => b.code);
          const dBinCodes = dZone.bins.map(b => b.code);

          // บล็อกที่ถูกเพิ่มเข้ามาใหม่
          const binsToAdd = dZone.bins.filter(b => !eBinCodes.includes(b.code));
          if (binsToAdd.length > 0) {
            await prisma.storageBin.createMany({ data: binsToAdd.map(b => ({ code: b.code, status: "EMPTY", zoneId: eZone.id })) });
          }

          // บล็อกที่ถูกลดหรือลบทิ้ง
          const binsToRemove = eZone.bins.filter(b => !dBinCodes.includes(b.code));
          if (binsToRemove.length > 0) {
            const removeIds = binsToRemove.map(b => b.id);
            // ปลดล็อกพัสดุก่อนทำลายบล็อก
            await prisma.material.updateMany({
              where: { bins: { some: { id: { in: removeIds } } } },
              data: { bins: { disconnect: removeIds.map(rid => ({ id: rid })) } }
            });
            await prisma.storageBin.deleteMany({ where: { id: { in: removeIds } } });
          }
        }
      }

      // ทำลายโซน/แร็คที่ถูกแอดมินลบทิ้งออกไป
      const dZoneNames = desiredZones.map(z => z.name);
      const zonesToRemove = existingZones.filter(z => !dZoneNames.includes(z.name));
      
      for (const zRem of zonesToRemove) {
        const removeBinIds = zRem.bins.map(b => b.id);
        if (removeBinIds.length > 0) {
          await prisma.material.updateMany({
            where: { bins: { some: { id: { in: removeBinIds } } } },
            data: { bins: { disconnect: removeBinIds.map(rid => ({ id: rid })) } }
          });
          await prisma.storageBin.deleteMany({ where: { zoneId: zRem.id } });
        }
        await prisma.storageZone.delete({ where: { id: zRem.id } });
      }
    } 
    // 🏕️ 3. กรณีแก้ไขโครงสร้างลานสนาม (OUTDOOR)
    else if (type === "OUTDOOR" && grid) {
      const desiredBinCodes = [];
      for (let r = 1; r <= grid.height; r++) {
        for (let c = 1; c <= grid.width; c++) {
          if (!grid.deactivatedCells.includes(`${r}-${c}`)) {
             desiredBinCodes.push(`${name.trim()}-R${r}-C${c}`);
          }
        }
      }

      let mainZone = await prisma.storageZone.findFirst({ where: { locationId: id, name: "ลานกว้าง" }, include: { bins: true } });
      if (!mainZone) mainZone = await prisma.storageZone.create({ data: { locationId: id, name: "ลานกว้าง" }, include: { bins: true } });

      const eBinCodes = mainZone.bins.map(b => b.code);
      const binsToAdd = desiredBinCodes.filter(c => !eBinCodes.includes(c));
      const binsToRemove = mainZone.bins.filter(b => !desiredBinCodes.includes(b.code));

      if (binsToAdd.length > 0) {
        await prisma.storageBin.createMany({ data: binsToAdd.map(code => ({ code, status: "EMPTY", zoneId: mainZone.id })) });
      }

      if (binsToRemove.length > 0) {
        const removeIds = binsToRemove.map(b => b.id);
        await prisma.material.updateMany({
          where: { bins: { some: { id: { in: removeIds } } } },
          data: { bins: { disconnect: removeIds.map(rid => ({ id: rid })) } }
        });
        await prisma.storageBin.deleteMany({ where: { id: { in: removeIds } } });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Structure Update Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปเดตโครงสร้าง" }, { status: 500 });
  }
}