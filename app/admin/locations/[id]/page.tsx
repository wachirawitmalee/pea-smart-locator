"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Save, Trash2, Box, Grid3X3, Plus, Minus, 
  MapPin, Loader2, Search, X 
} from "lucide-react";

export default function EditLocationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // 📦 State พื้นฐานของสถานที่
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"INDOOR" | "OUTDOOR">("INDOOR");

  // 🏗️ State โครงสร้างคลัง
  const [racks, setRacks] = useState<{ name: string; floors: { level: number; blocks: number }[] }[]>([]);
  const [grid, setGrid] = useState({ width: 5, height: 5, deactivatedCells: [] as string[] });
  
  // 🔍 State สำหรับเก็บข้อมูลหมุด/บล็อกเดิมที่มีในฐานข้อมูล (เพื่อใช้เปิด Modal)
  const [loadedBins, setLoadedBins] = useState<any[]>([]);

  // 🚪 State สำหรับ Modal เพิ่มพัสดุเข้าบล็อก
  const [targetBin, setTargetBin] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [materialsResults, setMaterialsResults] = useState<any[]>([]);
  const [searchingMaterial, setSearchingMaterial] = useState(false);
  const [submittingMaterial, setSubmittingMaterial] = useState(false);

  // 🔄 1. ดึงข้อมูลสถานที่และแปลงกลับมาเป็นโครงสร้างให้หน้าเว็บแสดงผลเพื่อแก้ไข
  const fetchLocationData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/locations");
      const data = await res.json();
      const loc = data.find((l: any) => l.id === id);

      if (loc) {
        setName(loc.name);
        setType(loc.type);

        const allBins: any[] = [];

        if (loc.type === "INDOOR") {
          const rMap: any = {};
          loc.zones.forEach((z: any) => {
            const [rName, floorStr] = z.name.split(" - ชั้น ");
            if (!rMap[rName]) rMap[rName] = { name: rName, floors: [] };
            rMap[rName].floors.push({ level: parseInt(floorStr) || 1, blocks: z.bins?.length || 0 });
            z.bins?.forEach((b: any) => allBins.push(b));
          });
          setRacks(Object.values(rMap));
        } else {
          let maxR = 1, maxC = 1;
          const activeCodes: string[] = [];
          
          loc.zones[0]?.bins?.forEach((b: any) => {
            allBins.push(b);
            activeCodes.push(b.code);
            const match = b.code.match(/-R(\d+)-C(\d+)/);
            if (match) {
              if (parseInt(match[1]) > maxR) maxR = parseInt(match[1]);
              if (parseInt(match[2]) > maxC) maxC = parseInt(match[2]);
            }
          });

          const deactivated: string[] = [];
          for (let r = 1; r <= maxR; r++) {
            for (let c = 1; c <= maxC; c++) {
              if (!activeCodes.includes(`${loc.name.trim()}-R${r}-C${c}`)) {
                deactivated.push(`${r}-${c}`);
              }
            }
          }
          setGrid({ width: maxC, height: maxR, deactivatedCells: deactivated });
        }
        setLoadedBins(allBins);
      } else {
        alert("ไม่พบข้อมูลสถานที่จัดเก็บนี้");
        router.push("/admin/locations-list");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationData();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 💾 2. บันทึกการแก้ไขโครงสร้าง
  const handleSaveLayout = async () => {
    if (!name.trim()) return alert("กรุณาตั้งชื่อสถานที่");
    try {
      setSaving(true);
      const res = await fetch(`/api/locations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, racks, grid }),
      });

      if (res.ok) {
        alert("บันทึกการแก้ไขผังคลังเรียบร้อยแล้ว!");
        fetchLocationData(); // โหลดใหม่เพื่อให้ไอดีบล็อกอัปเดต
      } else {
        const err = await res.json();
        alert(`เกิดข้อผิดพลาด: ${err.error}`);
      }
    } catch (error) {
      alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSaving(false);
    }
  };

  // 🗑️ 3. ลบสถานที่ทิ้งแบบถาวร
  const handleDeleteLocation = async () => {
    if (!confirm(`⚠️ ยืนยันการลบ "${name}" อย่างถาวรใช่หรือไม่?\nพัสดุในคลังนี้จะถูกปลดพิกัดทั้งหมด!`)) return;
    try {
      const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("ลบสถานที่เรียบร้อย");
        router.push("/admin/locations-list");
      } else {
        alert("ลบข้อมูลไม่สำเร็จ");
      }
    } catch (error) {
      alert("เซิร์ฟเวอร์ขัดข้อง");
    }
  };

  // --- ฟังก์ชันจัดการ INDOOR ---
  const addRack = () => setRacks([...racks, { name: `แร็ค ${String.fromCharCode(65 + racks.length)}`, floors: [{ level: 1, blocks: 5 }] }]);
  const removeRack = (idx: number) => setRacks(racks.filter((_, i) => i !== idx));
  const addFloor = (rackIdx: number) => {
    const newRacks = [...racks];
    newRacks[rackIdx].floors.push({ level: newRacks[rackIdx].floors.length + 1, blocks: 5 });
    setRacks(newRacks);
  };
  const updateBlocks = (rackIdx: number, floorIdx: number, delta: number) => {
    const newRacks = [...racks];
    const current = newRacks[rackIdx].floors[floorIdx].blocks;
    if (current + delta >= 1) newRacks[rackIdx].floors[floorIdx].blocks = current + delta;
    setRacks(newRacks);
  };

  // --- ฟังก์ชันจัดการ OUTDOOR ---
  const toggleGridCell = (r: number, c: number) => {
    const cellKey = `${r}-${c}`;
    const newDeactivated = grid.deactivatedCells.includes(cellKey)
      ? grid.deactivatedCells.filter(key => key !== cellKey)
      : [...grid.deactivatedCells, cellKey];
    setGrid({ ...grid, deactivatedCells: newDeactivated });
  };

  // --- ฟังก์ชันค้นหาและผูกพัสดุเข้าบล็อก (Modal) ---
  const handleBlockClick = (expectedCode: string) => {
    // เช็คว่าโค้ดนี้มีในฐานข้อมูลที่เพิ่งโหลดมาหรือไม่
    const existingBin = loadedBins.find(b => b.code === expectedCode);
    if (existingBin) {
      setTargetBin(existingBin);
      setSearchQuery("");
      setMaterialsResults([]);
    } else {
      alert("⚠️ บล็อกนี้เป็นบล็อกใหม่ที่ยังไม่ได้บันทึกลงระบบ กรุณากดปุ่ม 'บันทึกการแก้ไข' ก่อนเพิ่มพัสดุครับ");
    }
  };

  const handleSearchMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setSearchingMaterial(true);
      const res = await fetch(`/api/materials/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) setMaterialsResults(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingMaterial(false);
    }
  };

  const handleAssignMaterial = async (material: any) => {
    if (!targetBin) return;
    try {
      setSubmittingMaterial(true);
      const existingCodes = material.bins?.map((b: any) => b.code) || [];
      if (existingCodes.includes(targetBin.code)) {
        alert("พัสดุถูกผูกกับบล็อกนี้อยู่แล้ว");
        setTargetBin(null);
        return;
      }
      const res = await fetch(`/api/materials/${material.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: material.description,
          thaiName: material.thaiName,
          specificTerm: material.specificTerm,
          placeOfWork: material.placeOfWork || "สถานที่ปฏิบัติงาน กฟภ.ระโนด",
          remark: material.remark,
          locationCodes: [...existingCodes, targetBin.code] 
        })
      });

      if (res.ok) {
        alert(`เพิ่มพัสดุเข้าพิกัด ${targetBin.code} เรียบร้อย!`);
        setTargetBin(null);
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึกพัสดุ");
      }
    } catch (err) {
      alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setSubmittingMaterial(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 size={40} className="animate-spin text-[#741F80]" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      
      {/* 🚀 หัวเว็บ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <Link href="/admin/locations-list" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#741F80] mb-2">
            <ArrowLeft size={16} /> กลับหน้ารายการสถานที่
          </Link>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Box className="text-[#741F80]" size={32} /> แก้ไขสถานที่และผังคลัง
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleDeleteLocation} className="bg-red-50 text-red-600 hover:bg-red-100 px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition-colors">
            <Trash2 size={16} /> ลบสถานที่นี้
          </button>
          <button onClick={handleSaveLayout} disabled={saving} className="bg-[#741F80] text-white hover:bg-[#5b1865] px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-md transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
            บันทึกการแก้ไข
          </button>
        </div>
      </div>

      {/* 📝 ฟอร์มตั้งชื่อและประเภท (ประเภทจะล็อกไว้ไม่ให้แก้เพื่อกันผังพัง) */}
      <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">ชื่อสถานที่ / อาคาร</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น คลังอาคาร 1, ลานหม้อแปลง" className="w-full font-bold bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-[#741F80] outline-none" />
        </div>
        <div>
          <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wider">รูปแบบผัง (ไม่สามารถเปลี่ยนได้)</label>
          <div className="w-full font-bold bg-slate-100 text-slate-500 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-2">
            {type === "INDOOR" ? <><Box size={18}/> คลังในร่ม (ตู้แร็ค/ชั้นวาง)</> : <><Grid3X3 size={18}/> ลานสนามกลางแจ้ง (ตีตาราง)</>}
          </div>
        </div>
      </div>

      {/* 🏗️ พื้นที่สร้างโครงสร้าง */}
      <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-800">เครื่องมือจัดการบล็อกพิกัด</h3>
            <p className="text-xs font-bold text-[#741F80] bg-purple-50 p-2 rounded-lg mt-2">💡 คุณสามารถคลิกที่พิกัดบล็อก เพื่อเพิ่มพัสดุใส่บล็อกนั้นได้ทันที (เฉพาะบล็อกที่บันทึกแล้ว)</p>
          </div>
          {type === "INDOOR" && (
            <button onClick={addRack} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-colors"><Plus size={16} /> เพิ่มตู้แร็ค</button>
          )}
        </div>

        {/* --- โหมด INDOOR --- */}
        {type === "INDOOR" && (
          <div className="flex gap-6 overflow-x-auto pb-6">
            {racks.map((rack, rIdx) => (
              <div key={rIdx} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl min-w-[320px] flex flex-col gap-4 relative">
                <button onClick={() => removeRack(rIdx)} className="absolute -top-3 -right-3 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white p-1.5 rounded-full border border-white shadow-sm transition-all"><X size={14}/></button>
                <input type="text" value={rack.name} onChange={(e) => { const newRacks = [...racks]; newRacks[rIdx].name = e.target.value; setRacks(newRacks); }} className="w-full text-sm font-black bg-white border border-slate-200 rounded-lg px-3 py-2 text-center text-[#741F80]" />
                <div className="flex flex-col-reverse gap-3">
                  {rack.floors.map((floor, fIdx) => (
                    <div key={fIdx} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-3">
                      <span className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-3 rounded text-center w-12">ชั้น {floor.level}</span>
                      <div className="flex-1 flex flex-wrap gap-1.5">
                        {Array.from({ length: floor.blocks }).map((_, bIdx) => {
                          const expectedCode = `${name.trim()}-${rack.name.trim()}-F${floor.level}-B${String(bIdx + 1).padStart(2, "0")}`;
                          const isSaved = loadedBins.some(b => b.code === expectedCode);
                          return (
                            <div 
                              key={bIdx} 
                              onClick={() => handleBlockClick(expectedCode)}
                              className={`w-10 h-10 border rounded flex items-center justify-center text-[9px] font-bold cursor-pointer transition-colors ${isSaved ? 'bg-white border-slate-300 text-slate-700 hover:border-[#741F80] hover:bg-purple-50' : 'bg-slate-100 border-dashed border-slate-300 text-slate-400'}`}
                              title={isSaved ? "คลิกเพื่อเพิ่มพัสดุ" : "บล็อกใหม่: ต้องบันทึกก่อนเพิ่มพัสดุ"}
                            >
                              B{String(bIdx + 1).padStart(2, "0")}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex flex-col gap-1 ml-auto">
                        <button onClick={() => updateBlocks(rIdx, fIdx, 1)} className="bg-slate-100 hover:bg-slate-200 p-1 rounded text-slate-600"><Plus size={14}/></button>
                        <button onClick={() => updateBlocks(rIdx, fIdx, -1)} className="bg-slate-100 hover:bg-slate-200 p-1 rounded text-slate-600"><Minus size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => addFloor(rIdx)} className="w-full py-2 bg-slate-200/50 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-500 border border-dashed border-slate-300 transition-colors">+ เพิ่มชั้นใหม่</button>
              </div>
            ))}
          </div>
        )}

        {/* --- โหมด OUTDOOR --- */}
        {type === "OUTDOOR" && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div><label className="text-xs font-bold text-slate-500 mb-1 block">เพิ่มความกว้าง (คอลัมน์)</label><input type="number" min={1} max={20} value={grid.width} onChange={(e) => setGrid({...grid, width: parseInt(e.target.value) || 1})} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-24 font-bold outline-none focus:border-[#741F80]" /></div>
              <div><label className="text-xs font-bold text-slate-500 mb-1 block">เพิ่มความยาว (แถว)</label><input type="number" min={1} max={20} value={grid.height} onChange={(e) => setGrid({...grid, height: parseInt(e.target.value) || 1})} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-24 font-bold outline-none focus:border-[#741F80]" /></div>
            </div>
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 overflow-x-auto flex justify-center">
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${grid.width}, minmax(0, 1fr))` }}>
                {Array.from({ length: grid.height }).map((_, rIdx) => 
                  Array.from({ length: grid.width }).map((_, cIdx) => {
                    const r = rIdx + 1; const c = cIdx + 1;
                    const cellKey = `${r}-${c}`;
                    const expectedCode = `${name.trim()}-R${r}-C${c}`;
                    const isDeactivated = grid.deactivatedCells.includes(cellKey);
                    const isSaved = loadedBins.some(b => b.code === expectedCode);

                    return (
                      <div 
                        key={cellKey} 
                        onClick={() => !isDeactivated && handleBlockClick(expectedCode)}
                        className="relative group"
                      >
                        <button onClick={(e) => { e.stopPropagation(); toggleGridCell(r, c); }} className="absolute -top-2 -right-2 z-10 bg-slate-800 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${isDeactivated ? 'bg-transparent border-dashed border-slate-300 opacity-50' : isSaved ? 'bg-white border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 shadow-sm' : 'bg-slate-100 border-dashed border-slate-300'}`}>
                          {!isDeactivated && <span className="text-[10px] font-black text-slate-600">R{r}-C{c}</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🚪 Modal เพิ่มพัสดุ */}
      {targetBin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="bg-[#741F80] text-white text-[10px] font-black px-2.5 py-1 rounded-md">เพิ่มพัสดุเข้าพิกัด</span>
                <h3 className="text-xl font-black text-slate-900 mt-1 font-mono">{targetBin.code}</h3>
              </div>
              <button onClick={() => setTargetBin(null)} className="p-2 hover:bg-slate-200 rounded-xl"><X size={20} /></button>
            </div>
            <div className="p-6 border-b border-slate-100">
              <form onSubmit={handleSearchMaterial} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="พิมพ์ค้นหาพัสดุ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-100 rounded-xl pl-10 pr-4 py-3 font-bold outline-none focus:ring-2 focus:ring-[#741F80]/20" />
                </div>
                <button type="submit" disabled={searchingMaterial || !searchQuery.trim()} className="bg-[#741F80] text-white px-5 rounded-xl font-black flex items-center gap-2 disabled:bg-slate-300">{searchingMaterial ? <Loader2 size={16} className="animate-spin" /> : "ค้นหา"}</button>
              </form>
            </div>
            <div className="p-4 flex-1 overflow-y-auto bg-slate-50 space-y-2">
              {materialsResults.map((mat) => (
                <div key={mat.id} className="bg-white p-3 rounded-xl border flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black text-[#741F80] bg-purple-50 px-2 py-0.5 rounded font-mono">{mat.materialCode}</span>
                    <h4 className="text-sm font-black truncate mt-1">{mat.description}</h4>
                  </div>
                  <button onClick={() => handleAssignMaterial(mat)} disabled={submittingMaterial} className="bg-emerald-500 text-white font-black text-xs px-3 py-2 rounded-lg flex items-center gap-1"><Plus size={14} /> เพิ่มลงบล็อกนี้</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}