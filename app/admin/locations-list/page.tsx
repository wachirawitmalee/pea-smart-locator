"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Box, 
  Grid3X3, 
  MapPin, 
  Layers, 
  Search, 
  Plus, 
  Loader2, 
  X, 
  Eye,
  ArrowLeft,
  Edit,
  Trash2
} from "lucide-react";

export default function LocationsListPage() {
  const router = useRouter();

  // 📦 States สำหรับจัดการสถานที่
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🗺️ States สำหรับจัดการการดูผังคลังย่อย
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [parsedOutdoorBins, setParsedOutdoorBins] = useState<any[]>([]);
  const [racksMap, setRacksMap] = useState<Record<string, any[]>>({});
  const [gridCols, setGridCols] = useState(1);
  const [gridRows, setGridRows] = useState(1);

  // 🚪 States สำหรับจัดการ Modal เพิ่มพัสดุเข้าบล็อก
  const [targetBin, setTargetBin] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [materialsResults, setMaterialsResults] = useState<any[]>([]);
  const [searchingMaterial, setSearchingMaterial] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 🔄 1. โหลดข้อมูลสถานที่ทั้งหมดจาก API
  const fetchLocations = async () => {
    try {
      setLoading(true);
      // เรียก API ดึงสถานที่ทั้งหมด (ต้องมี include zones และ bins มาด้วย)
      const res = await fetch("/api/locations"); 
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
        
        // ถ้าระบุสถานที่อยู่แล้วให้รีเฟรชข้อมูลผังด้วย
        if (selectedLocation) {
          const updatedLoc = data.find((l: any) => l.id === selectedLocation.id);
          if (updatedLoc) handleViewLayout(updatedLoc);
        }
      } else {
        setError("ไม่สามารถโหลดข้อมูลผังคลังได้");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 🗑️ ฟังก์ชันลบสถานที่
  const handleDeleteLocation = async (id: string, name: string) => {
    if (!confirm(`⚠️ ยืนยันการลบสถานที่ "${name}" ใช่หรือไม่?\nข้อมูลผังคลังและพิกัดทั้งหมดในนี้จะถูกลบหายไปทันที!`)) return;

    try {
      const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("ลบสถานที่สำเร็จ!");
        if (selectedLocation?.id === id) setSelectedLocation(null);
        fetchLocations();
      } else {
        const data = await res.json();
        alert(`ลบไม่สำเร็จ: ${data.error}`);
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการลบ");
    }
  };

  // 📊 2. ฟังก์ชันคำนวณและกางผังพิกัด (Indoor / Outdoor)
  const handleViewLayout = (location: any) => {
    setSelectedLocation(location);
    setTargetBin(null);
    setMaterialsResults([]);
    setSearchQuery("");

    const isIndoor = location.type === "INDOOR";
    const zones = location.zones || [];

    if (!isIndoor) {
      // ผังกลางแจ้งลานสนาม คำนวณ Grid กว้าง x ยาว
      let maxR = 1;
      let maxC = 1;
      const parsed: any[] = [];
      const mainZone = zones[0];
      
      if (mainZone && mainZone.bins) {
        mainZone.bins.forEach((b: any) => {
          const match = b.code.match(/-R(\d+)-C(\d+)/);
          if (match) {
            const r = parseInt(match[1]);
            const c = parseInt(match[2]);
            if (r > maxR) maxR = r;
            if (c > maxC) maxC = c;
            parsed.push({ ...b, r, c });
          }
        });
      }
      setGridRows(maxR);
      setGridCols(maxC);
      setParsedOutdoorBins(parsed);
    } else {
      // ผังในร่ม แยกหมวดหมู่ตามแร็คตู้ชั้นวาง
      const rMap: Record<string, any[]> = {};
      zones.forEach((z: any) => {
        const rackName = z.name.split(" - ชั้น ")[0];
        if (!rMap[rackName]) rMap[rackName] = [];
        rMap[rackName].push(z);
      });
      setRacksMap(rMap);
    }
  };

  // 🔍 3. ฟังก์ชันค้นหาพัสดุเพื่อเตรียมนำเข้าบล็อก
  const handleSearchMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearchingMaterial(true);
      const res = await fetch(`/api/materials/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (res.ok) {
        setMaterialsResults(data);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearchingMaterial(false);
    }
  };

  // 🚀 4. ฟังก์ชันผูกพัสดุเข้าพิกัดบล็อกที่เลือก
  const handleAssignMaterial = async (material: any) => {
    if (!targetBin) return;

    try {
      setSubmitting(true);

      const existingCodes = material.bins?.map((b: any) => b.code) || [];
      if (existingCodes.includes(targetBin.code)) {
        alert("พัสดุชิ้นนี้ถูกผูกเข้าพิกัดนี้อยู่แล้วครับ");
        setTargetBin(null);
        return;
      }

      const updatedLocationCodes = [...existingCodes, targetBin.code];

      const res = await fetch(`/api/materials/${material.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: material.description,
          thaiName: material.thaiName,
          specificTerm: material.specificTerm,
          placeOfWork: material.placeOfWork || "สถานที่ปฏิบัติงาน กฟภ.ระโนด",
          remark: material.remark,
          locationCodes: updatedLocationCodes 
        })
      });

      if (res.ok) {
        alert(`ผูกพัสดุเข้าพิกัด ${targetBin.code} สำเร็จเรียบร้อยแล้ว!`);
        setTargetBin(null);
        setSearchQuery("");
        setMaterialsResults([]);
        fetchLocations();
      } else {
        const errData = await res.json();
        alert(`ข้อผิดพลาด: ${errData.error || "ไม่สามารถเพิ่มพัสดุเข้าตำแหน่งได้"}`);
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans py-8 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* หัวเว็บนำทาง */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">🗺️ ระบบจัดการและตรวจสอบผังคลังพัสดุ</h1>
            <p className="text-sm font-bold text-slate-500 mt-1">คลิกเลือกสถานที่เพื่อเปิดดูบล็อก และเพิ่มพัสดุเข้าพิกัดจัดเก็บได้ทันที</p>
          </div>
          {/* ✅ เปลี่ยนปุ่มให้ย้อนกลับไปหน้าก่อนหน้าของ Admin */}
          <button 
            onClick={() => router.back()} 
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm transition-colors"
          >
            <ArrowLeft size={16} /> ย้อนกลับหน้าก่อนหน้า
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin text-[#741F80] mb-3" size={40} />
            <p className="text-sm font-bold">กำลังเตรียมโครงสร้างผังคลังระโนด...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center font-bold text-sm">❌ {error}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* รายชื่อคลังทั้งหมด (ฝั่งซ้ายมือ) */}
            <div className="lg:col-span-4 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block px-1">🏢 รายชื่อสถานที่ทั้งหมด ({locations.length})</span>
              <div className="grid grid-cols-1 gap-3">
                {locations.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-sm font-bold text-slate-400">⚠️ ยังไม่มีข้อมูลสถานที่จัดเก็บในระบบ</div>
                ) : (
                  locations.map((loc: any) => {
                    const totalZones = loc.zones?.length || 0;
                    const totalBins = loc.zones?.reduce((acc: number, z: any) => acc + (z.bins?.length || 0), 0) || 0;

                    return (
                      <div key={loc.id} className="relative group">
                        <button
                          onClick={() => handleViewLayout(loc)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                            selectedLocation?.id === loc.id
                              ? "bg-[#741F80] border-[#741F80] text-white shadow-md"
                              : "bg-white border-slate-200 text-slate-800 hover:border-[#741F80]/50 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${selectedLocation?.id === loc.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover:text-[#741F80]"}`}>
                              {loc.type === "INDOOR" ? <Box size={20} /> : <Grid3X3 size={20} />}
                            </div>
                            <div>
                              <p className="font-black text-sm leading-tight">{loc.name}</p>
                              <p className={`text-xs mt-1 font-bold ${selectedLocation?.id === loc.id ? "text-purple-200" : "text-slate-400"}`}>
                                {loc.type === "INDOOR" ? "คลังในร่ม" : "ลานสนามกลางแจ้ง"} • {totalZones} ชั้น • {totalBins} บล็อก
                              </p>
                            </div>
                          </div>
                          <Eye size={16} className={selectedLocation?.id === loc.id ? "text-white" : "text-slate-300 group-hover:text-slate-500"} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* แสดงโครงสร้างแบบจำลองแบบโต้ตอบได้ (ฝั่งขวามือ) */}
            <div className="lg:col-span-8">
              {!selectedLocation ? (
                <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center text-slate-400 min-h-[350px]">
                  <MapPin size={48} strokeWidth={1} className="mb-2 text-slate-300 animate-pulse" />
                  <p className="text-sm font-black text-slate-500">โปรดเลือกสถานที่จากฝั่งซ้ายมือ</p>
                  <p className="text-xs font-bold text-slate-400 mt-1">เพื่อจำลองแบบแปลนบล็อกคลังพัสดุ</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-6 sm:p-8 space-y-6">
                  
                  {/* รายละเอียดของคลังที่เลือกอยู่ พร้อมปุ่มแก้ไข/ลบ */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <span className="bg-[#741F80]/10 text-[#741F80] text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">กำลังตรวจสอบผัง</span>
                      <h3 className="text-xl font-black text-slate-900 mt-1.5 flex items-center gap-2">{selectedLocation.name}</h3>
                    </div>
                    {/* ✅ นำปุ่มจัดการ (แก้ไข/ลบ) กลับมา */}
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/admin/locations/${selectedLocation.id}`} 
                        className="flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-200 transition-colors"
                      >
                        <Edit size={14} /> แก้ไขผัง
                      </Link>
                      <button 
                        onClick={() => handleDeleteLocation(selectedLocation.id, selectedLocation.name)}
                        className="flex items-center gap-1.5 text-xs font-bold bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={14} /> ลบสถานที่
                      </button>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-[#741F80] bg-purple-50 border border-purple-100 p-3 rounded-xl">
                    💡 **คำแนะนำ:** คลิกที่กล่องข้อความพิกัดจัดเก็บใดๆ เพื่อเปิดหน้าต่างค้นหาและผูกเพิ่มพัสดุชิ้นใหม่เข้าตำแหน่งบล็อกนั้นๆ ได้เลยทันทีครับ!
                  </p>

                  {/* 🏗️ แสดงผังแบบ INDOOR */}
                  {selectedLocation.type === "INDOOR" && (
                    <div className="flex flex-col gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200/60 overflow-x-auto">
                      {Object.keys(racksMap).length === 0 ? (
                        <p className="text-center w-full font-bold text-slate-400 py-6">ไม่พบตู้แร็คในระบบ</p>
                      ) : (
                        Object.keys(racksMap).map((rackName) => {
                          const rackZones = racksMap[rackName];
                          return (
                            <div key={rackName} className="flex flex-col border border-slate-300 bg-white shadow-sm rounded-xl overflow-hidden min-w-max">
                              <div className="bg-slate-200 px-4 py-2 border-b border-slate-300">
                                <span className="text-sm font-black text-slate-800 flex items-center gap-2"><Layers size={16}/> {rackName}</span>
                              </div>
                              <div className="flex flex-col-reverse gap-0">
                                {rackZones.map((zone: any, index: number) => (
                                  <div key={zone.id} className={`flex gap-4 p-3 items-center ${index !== rackZones.length - 1 ? "border-b border-slate-100" : ""}`}>
                                    <span className="text-[11px] font-black text-white bg-[#741F80] px-3 py-2 rounded-lg text-center w-16 leading-tight shadow-sm">
                                      {zone.name.split(" - ")[1] || zone.name}
                                    </span>
                                    {/* ✅ แสดงบล็อกในชั้นนี้ */}
                                    <div className="flex flex-wrap gap-2">
                                      {zone.bins && zone.bins.length > 0 ? (
                                        zone.bins.map((bin: any) => (
                                          <button
                                            key={bin.id}
                                            onClick={() => setTargetBin(bin)}
                                            className={`w-14 h-12 rounded-lg border flex items-center justify-center font-bold text-xs transition-all hover:-translate-y-1 hover:border-[#741F80] hover:bg-purple-50 hover:text-[#741F80] hover:shadow-md ${
                                              targetBin?.id === bin.id
                                                ? "bg-[#741F80] border-[#741F80] text-white shadow-md ring-2 ring-purple-300"
                                                : "bg-white border-slate-300 text-slate-700 shadow-sm"
                                            }`}
                                            title={`จิ้มเพื่อเพิ่มพัสดุเข้าพิกัด: ${bin.code}`}
                                          >
                                            {bin.code.split("-").pop()}
                                          </button>
                                        ))
                                      ) : (
                                        <span className="text-xs text-slate-400 font-bold italic py-2">ไม่มีบล็อกในชั้นนี้</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* 🏕️ แสดงผังแบบ OUTDOOR */}
                  {selectedLocation.type === "OUTDOOR" && (
                    <div className="bg-emerald-50/30 p-6 rounded-2xl border border-emerald-100/50 overflow-x-auto flex justify-center">
                      {parsedOutdoorBins.length === 0 ? (
                        <p className="text-center font-bold text-slate-400 py-6">ไม่พบบล็อกพิกัดลานสนามสนาม</p>
                      ) : (
                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
                          {Array.from({ length: gridRows }).map((_, rIdx) => 
                            Array.from({ length: gridCols }).map((_, cIdx) => {
                              const r = rIdx + 1;
                              const c = cIdx + 1;
                              const bin = parsedOutdoorBins.find((b: any) => b.r === r && b.c === c);
                              return (
                                <div key={`${r}-${c}`}>
                                  {bin ? (
                                    <button
                                      onClick={() => setTargetBin(bin)}
                                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border flex flex-col items-center justify-center transition-all hover:scale-105 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 ${
                                        targetBin?.id === bin.id
                                          ? "bg-emerald-600 border-emerald-600 text-white shadow-md ring-2 ring-emerald-300"
                                          : "bg-white border-slate-300 shadow-sm"
                                      }`}
                                      title={`จิ้มเพื่อเพิ่มพัสดุเข้าลาน: ${bin.code}`}
                                    >
                                      <span className="text-[10px] font-black">R{r}-C{c}</span>
                                    </button>
                                  ) : (
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-transparent border border-dashed border-slate-200 rounded-xl opacity-30 flex items-center justify-center text-[8px] font-bold text-slate-400">
                                      ทางเดิน
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🚪 หน้าต่าง Modal ค้นหาพัสดุเพื่อยัดเข้าพิกัด */}
        {targetBin && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <span className="bg-[#741F80] text-white text-[10px] font-black px-2.5 py-1 rounded-md tracking-wider uppercase">พิกัดเป้าหมาย</span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">📥 เพิ่มพัสดุเข้าตำแหน่ง: <span className="text-[#741F80] font-mono">{targetBin.code}</span></h3>
                </div>
                <button onClick={() => setTargetBin(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 border-b border-slate-100">
                <form onSubmit={handleSearchMaterial} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="พิมพ์รหัสพัสดุ หรือ ชื่อพัสดุ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-sm font-bold bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#741F80]/20 focus:bg-white focus:border-[#741F80] transition-all text-slate-800"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searchingMaterial || !searchQuery.trim()}
                    className="bg-[#741F80] hover:bg-[#5c1866] disabled:bg-slate-300 text-white font-black px-5 py-3 rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2 shrink-0"
                  >
                    {searchingMaterial ? <Loader2 size={16} className="animate-spin" /> : "ค้นหา"}
                  </button>
                </form>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-2 bg-slate-50/50">
                {searchingMaterial ? (
                  <div className="text-center py-12 text-slate-400 font-bold text-sm flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-[#741F80] mb-2" size={24} />
                    กำลังค้นพัสดุในคลัง...
                  </div>
                ) : materialsResults.length > 0 ? (
                  materialsResults.map((mat: any) => (
                    <div key={mat.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center justify-between gap-4 hover:border-[#741F80]/40 transition-all">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black text-[#741F80] bg-purple-50 px-2 py-0.5 rounded border border-purple-100 font-mono">{mat.materialCode}</span>
                        <h4 className="text-sm font-black text-slate-800 truncate mt-1">{mat.description}</h4>
                        <p className="text-xs font-medium text-slate-400 truncate">{mat.thaiName || "-"}</p>
                      </div>
                      <button
                        onClick={() => handleAssignMaterial(mat)}
                        disabled={submitting}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-black text-xs px-3 py-2 rounded-lg transition-all flex items-center gap-1 shrink-0 shadow-sm"
                      >
                        {submitting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={14} />} นำเข้า
                      </button>
                    </div>
                  ))
                ) : searchQuery && !searchingMaterial ? (
                  <div className="text-center py-12 text-slate-400 font-bold text-sm">
                    ❌ ไม่พบพัสดุตามที่คุณค้นหา
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 font-bold text-xs">
                    🔍 พิมพ์ค้นหารหัสพัสดุด้านบน แล้วเลือกชิ้นที่ต้องการเพื่อนำเข้าพิกัดได้เลยครับ
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}