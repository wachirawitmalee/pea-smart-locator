import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Tag, Factory, Calendar, Info, ImageIcon, Box, Grid3X3, Layers } from "lucide-react";

const prisma = new PrismaClient();
export const dynamic = "force-dynamic";

export default async function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const material = await prisma.material.findUnique({
    where: { id },
    include: {
      bins: { // ✅ ดึงมาแบบ Array
        include: { zone: { include: { location: { include: { zones: { include: { bins: { orderBy: { code: 'asc' } } } } } } } } }
      }
    }
  });

  if (!material) notFound();

  // ✅ หาพิกัดทั้งหมด
  const bins = material.bins || [];
const activeBinIds = bins.map((b: any) => b.id);
  
  // ใช้ Location ของอันแรกเป็นฐานวาดแผนที่ (กรณีวางข้ามคลัง จะโชว์แผนที่ของคลังแรก)
  const fullLocation = bins.length > 0 ? bins[0].zone.location : null;
  const isIndoor = fullLocation?.type === "INDOOR";

  let gridCols = 1; let gridRows = 1; const parsedOutdoorBins: any[] = [];
  if (!isIndoor && fullLocation) {
    const mainZone = fullLocation.zones[0];
    if (mainZone && mainZone.bins) {
      mainZone.bins.forEach((b: any) => {
        const match = b.code.match(/-R(\d+)-C(\d+)/);
        if (match) {
          const r = parseInt(match[1]); const c = parseInt(match[2]);
          if (r > gridRows) gridRows = r; if (c > gridCols) gridCols = c;
          parsedOutdoorBins.push({ ...b, r, c });
        }
      });
    }
  }

  const racksMap: Record<string, any[]> = {};
  if (isIndoor && fullLocation) {
    fullLocation.zones.forEach((z: any) => {
      const rackName = z.name.split(" - ชั้น ")[0];
      if (!racksMap[rackName]) racksMap[rackName] = [];
      racksMap[rackName].push(z);
    });
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans py-8 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
        
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#741F80] transition-colors group w-fit">
  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
  ย้อนกลับไปหน้าจัดการ Admin
</Link>
        
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 relative z-10">
          <div className="md:col-span-5 bg-slate-100 min-h-[300px] md:min-h-full relative flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-200">
            {material.imageUrl ? (<img src={material.imageUrl} alt={material.materialCode} className="w-full h-full object-contain max-h-[400px] rounded-2xl drop-shadow-md" />) : (<div className="flex flex-col items-center text-slate-300"><ImageIcon size={80} strokeWidth={1} /><p className="text-xs font-bold mt-3">ไม่มีรูปภาพประกอบ</p></div>)}
          </div>
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3"><span className="bg-[#741F80] text-white text-xs font-black px-3 py-1 rounded-lg tracking-wider uppercase">CODE: {material.materialCode}</span><span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-md text-[11px] font-bold text-slate-600"><Tag size={12} className="text-slate-400" /> {material.specificTerm || "ทั่วไป"}</span></div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mb-2">{material.description}</h2>
              <p className="text-base sm:text-lg font-bold text-slate-500">{material.thaiName || "-"}</p>
            </div>
            
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><MapPin size={14} /> พิกัดจัดเก็บทั้งหมด (วางอยู่ {bins.length} จุด)</span>
              {bins.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {bins.map((b: any) => (
                    <div key={b.id} className="flex items-center gap-2 bg-white border border-[#741F80]/20 px-3 py-2 rounded-xl shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-[#741F80] animate-pulse"></span>
                      <span className="text-sm font-black tracking-wider text-[#741F80]">{b.code}</span>
                    </div>
                  ))}
                </div>
              ) : (<div className="text-slate-400 font-bold text-sm">⚠️ ยังไม่ระบุตำแหน่ง</div>)}
            </div>
          </div>
        </div>

        {fullLocation && (
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-6 sm:p-8 mt-6">
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
              <div><h3 className="text-xl font-black text-[#741F80] flex items-center gap-2 mb-1">{isIndoor ? <Box size={24}/> : <Grid3X3 size={24}/>} แผนผังจำลองจุดจัดเก็บ (พบ {bins.length} จุด)</h3><p className="text-sm font-medium text-slate-500">ดูภาพรวมพิกัดคลัง {fullLocation.name}</p></div>
              <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500"><span className="w-3 h-3 rounded-full bg-[#741F80] shadow-[0_0_10px_rgba(116,31,128,0.5)]"></span> = จุดจัดเก็บพัสดุชิ้นนี้</div>
            </div>

            {isIndoor && (
              <div className="flex flex-wrap gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200/60 overflow-x-auto">
                {Object.keys(racksMap).map((rackName) => {
                  const rackZones = racksMap[rackName];
                  // ✅ เช็คว่ามีหมุดในแร็คนี้ไหม
                  const hasActiveBinInRack = rackZones.some((z: any) => z.bins.some((b: any) => activeBinIds.includes(b.id)));
                  return (
                    <div key={rackName} className={`flex flex-col border-b-[6px] rounded-b-sm pb-2 min-w-max transition-colors duration-300 ${hasActiveBinInRack ? 'border-[#741F80]/40' : 'border-slate-300'}`}>
                      <div className="flex items-center justify-between mb-3 px-2"><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${hasActiveBinInRack ? 'bg-[#741F80] text-white shadow-md' : 'text-slate-400 bg-slate-200'}`}>{rackName}</span></div>
                      <div className="flex flex-col-reverse gap-2 px-2">
                        {rackZones.map((zone: any) => (
                          <div key={zone.id} className="flex gap-2 p-1 bg-white border border-slate-100 rounded-lg">
                            <span className="text-[8px] font-bold text-slate-400 self-center w-8 text-center bg-slate-50 rounded">{zone.name.split(' - ')[1] || zone.name}</span>
                            {zone.bins.map((bin: any) => {
                              // ✅ ไฮไลต์ถ้า ID นี้อยู่ในอาเรย์พิกัดที่วางของ
                              const isActive = activeBinIds.includes(bin.id);
                              return (
                                <div key={bin.id} className={`relative w-12 h-10 rounded-md flex items-center justify-center shrink-0 transition-all ${isActive ? 'bg-[#741F80] text-white shadow-[0_10px_20px_-5px_rgba(116,31,128,0.5)] scale-110 z-10 font-black ring-2 ring-[#741F80]/30' : 'bg-slate-50 border border-slate-200 text-slate-400 font-bold'}`} title={bin.code}>
                                  {isActive && <div className="absolute -top-3 animate-bounce"><MapPin size={20} className="text-[#741F80]" fill="currentColor"/></div>}
                                  <span className="text-[9px]">{bin.code.split('-').pop()}</span>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isIndoor && (
              <div className="bg-emerald-50/30 p-6 rounded-2xl border border-emerald-100/50 overflow-x-auto flex justify-center">
                <div className="grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
                  {Array.from({ length: gridRows }).map((_, rIdx) => Array.from({ length: gridCols }).map((_, cIdx) => {
                    const r = rIdx + 1; const c = cIdx + 1;
                    const targetBin = parsedOutdoorBins.find(b => b.r === r && b.c === c);
                    // ✅ ไฮไลต์ลานสนามหลายจุดพร้อมกัน
                    const isActive = targetBin && activeBinIds.includes(targetBin.id);
                    return (
                      <div key={`${r}-${c}`} className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-emerald-500 text-white shadow-lg scale-110 z-10 font-black border-2 border-emerald-400 ring-4 ring-emerald-500/20' : targetBin ? 'bg-white border-2 border-slate-200 text-slate-400 font-bold' : 'bg-transparent border-2 border-dashed border-slate-200 opacity-50'}`} title={targetBin?.code || "ช่องว่างทางเดิน"}>
                        {isActive && <div className="absolute -top-4 text-emerald-600 animate-bounce"><MapPin size={28} fill="currentColor" /></div>}
                        {targetBin && <span className="text-[9px] opacity-70">R{r}-C{c}</span>}
                      </div>
                    );
                  }))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}