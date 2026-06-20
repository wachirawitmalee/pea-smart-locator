"use client";

import { useState } from "react";
import { 
  Map, Factory, Tent, Plus, Trash2, Layers, 
  Grid3X3, Save, RefreshCw, X, Loader2, CheckCircle2, XCircle, MousePointerClick, Box, LayoutGrid 
} from "lucide-react";

export default function LocationBuilderPage() {
  const [popup, setPopup] = useState<{ show: boolean; type: "loading" | "success" | "error"; message: string }>({
    show: false, type: "loading", message: ""
  });

  const showPopup = (type: "loading" | "success" | "error", message: string) => setPopup({ show: true, type, message });
  const closePopup = () => setPopup({ ...popup, show: false });

  const [locType, setLocType] = useState<"indoor" | "outdoor">("indoor");
  const [locationName, setLocationName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 📦 โครงสร้างแร็คใหม่: ให้แต่ละชั้น (level) สามารถกำหนด blocks ได้เอง
  const [racks, setRacks] = useState([
    { 
      id: 1, 
      name: "แร็ค A", 
      floors: [
        { level: 0, blocks: 4 },
        { level: 1, blocks: 4 },
        { level: 2, blocks: 4 }
      ] 
    }
  ]);
  
  const [gridSize, setGridSize] = useState({ width: 5, height: 5 });
  const [deactivatedCells, setDeactivatedCells] = useState<string[]>([]);

  // ⚙️ ฟังก์ชันเพิ่มแร็ค
  const addRack = () => {
    const newId = racks.length ? Math.max(...racks.map(r => r.id)) + 1 : 1;
    const charLabel = String.fromCharCode(65 + (racks.length % 26)); 
    setRacks([...racks, { 
      id: newId, 
      name: `แร็ค ${charLabel}`, 
      floors: [{ level: 0, blocks: 4 }, { level: 1, blocks: 4 }, { level: 2, blocks: 4 }]
    }]);
  };

  const removeRack = (id: number) => {
    if (racks.length <= 1) return showPopup("error", "อาคารในร่มจำเป็นต้องมีโครงสร้างชั้นวางของอย่างน้อย 1 ชุด");
    setRacks(racks.filter(r => r.id !== id));
  };

  const updateRackName = (id: number, name: string) => {
    setRacks(racks.map(r => r.id === id ? { ...r, name } : r));
  };

  // ⚙️ ฟังก์ชันปรับจำนวนชั้น: เพิ่มหรือลบ level ใน array ให้ตรงกับที่พิมพ์
  const updateRackFloorCount = (id: number, count: number) => {
    const validCount = Math.max(1, Math.min(10, count)); // ล็อกสูงสุด 10 ชั้นเพื่อไม่ให้ล้นหน้าจอ
    setRacks(racks.map(r => {
      if (r.id !== id) return r;
      const newFloors = [...r.floors];
      if (validCount > newFloors.length) {
        // แอดชั้นเพิ่ม
        for (let i = newFloors.length; i < validCount; i++) newFloors.push({ level: i, blocks: 4 });
      } else if (validCount < newFloors.length) {
        // ลบชั้นออก
        newFloors.splice(validCount);
      }
      return { ...r, floors: newFloors };
    }));
  };

  // ⚙️ ฟังก์ชันแก้ไขจำนวนช่องบล็อกรายชั้น
  const updateFloorBlocks = (rackId: number, level: number, blocks: number) => {
    const validBlocks = Math.max(1, Math.min(20, blocks));
    setRacks(racks.map(r => {
      if (r.id !== rackId) return r;
      const newFloors = r.floors.map(f => f.level === level ? { ...f, blocks: validBlocks } : f);
      return { ...r, floors: newFloors };
    }));
  };

  const toggleCell = (r: number, c: number) => {
    const key = `${r}-${c}`;
    if (deactivatedCells.includes(key)) setDeactivatedCells(deactivatedCells.filter(cell => cell !== key));
    else setDeactivatedCells([...deactivatedCells, key]);
  };

  const handleSaveLocation = async () => {
    if (!locationName.trim()) return showPopup("error", "กรุณาระบุชื่อเรียกสถานที่หลัก เช่น คลังโปร่ง 1, ลานเสาไฟฟ้า");

    setIsSaving(true);
    showPopup("loading", "กำลังทำการประมวลผลคำนวณและแตกพิกัดย่อยลงสู่ฐานข้อมูล...");

    const payload = locType === "indoor" 
      ? { name: locationName.trim(), type: "INDOOR", racks }
      : { name: locationName.trim(), type: "OUTDOOR", grid: { width: gridSize.width, height: gridSize.height, deactivatedCells } };

    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (res.ok) {
        showPopup("success", "บันทึกและสร้างโครงสร้างผังพิกัดจัดเก็บเรียบร้อยแล้ว!");
        setLocationName("");
        setRacks([{ id: 1, name: "แร็ค A", floors: [{ level: 0, blocks: 4 }, { level: 1, blocks: 4 }, { level: 2, blocks: 4 }] }]);
        setGridSize({ width: 5, height: 5 });
        setDeactivatedCells([]);
      } else {
        showPopup("error", data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (error) {
      showPopup("error", "ระบบขัดข้อง ไม่สามารถทำการเชื่อมต่อเซิร์ฟเวอร์ฐานข้อมูลได้");
    } finally {
      setIsSaving(false);
    }
  };

  // คำนวณความจุรหัสที่จะเกิดขึ้นรวมทั้งหมด
  const totalIndoorBins = racks.reduce((sum, r) => sum + r.floors.reduce((fSum, f) => fSum + f.blocks, 0), 0);
  const totalOutdoorBins = (gridSize.width * gridSize.height) - deactivatedCells.length;

  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
      
      {/* 🔮 GLOBAL SMART POPUP OVERLAY */}
      {popup.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center relative border border-slate-100">
            {popup.type !== "loading" && (
              <button onClick={closePopup} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full"><X size={20} /></button>
            )}
            <div className="mb-6">
              {popup.type === "loading" && <Loader2 size={64} className="text-[#741F80] animate-spin" />}
              {popup.type === "success" && <div className="text-emerald-500"><CheckCircle2 size={64} /></div>}
              {popup.type === "error" && <div className="text-red-500"><XCircle size={64} /></div>}
            </div>
            <h3 className={`text-2xl font-black mb-2 ${popup.type === "error" ? "text-red-600" : popup.type === "success" ? "text-emerald-600" : "text-[#741F80]"}`}>
              {popup.type === "loading" ? "กำลังดำเนินการ..." : popup.type === "success" ? "สำเร็จ!" : "เกิดข้อผิดพลาด"}
            </h3>
            <p className="text-slate-600 font-medium text-sm leading-relaxed mb-6">{popup.message}</p>
            {popup.type !== "loading" && (
              <button onClick={closePopup} className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all ${popup.type === "success" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}`}>ตกลง</button>
            )}
          </div>
        </div>
      )}

      {/* 📄 ส่วนหัวข้อหน้าจอ */}
      <div className="mb-6">
        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Map className="text-[#741F80]" size={32} /> ตัวสร้างโครงสร้างสถานที่</h2>
        <p className="text-slate-500 font-medium text-sm mt-1">ออกแบบสถาปัตยกรรมภายในอาคารคลังพัสดุแบบเจาะลึก หรือจัดการลานสนามกลางแจ้ง</p>
      </div>
      
      <div className="flex bg-slate-200/50 p-1 rounded-xl mb-6 w-fit border border-slate-200 shadow-sm">
        <button onClick={() => setLocType("indoor")} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${locType === "indoor" ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Factory size={18} /> โครงสร้างอาคารในร่ม
        </button>
        <button onClick={() => setLocType("outdoor")} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${locType === "outdoor" ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Tent size={18} /> ลานกลางแจ้ง
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ⚙️ ฝั่งซ้าย: ฟอร์มตั้งค่า Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">ชื่อสถานที่หลักจริง *</label>
              <input type="text" value={locationName} onChange={(e) => setLocationName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#741F80] font-bold text-slate-800 text-lg shadow-inner" placeholder="เช่น คลังโปร่ง 1" />
            </div>

            {/* INDOOR MULTI-RACK FORM */}
            {locType === "indoor" ? (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-sm text-blue-900 flex items-center gap-1.5"><Box size={16} className="text-blue-600" /> จัดการชั้นวางของ (Racks)</h4>
                  <button onClick={addRack} className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 border border-blue-200/50 shadow-sm">
                    <Plus size={14} /> เพิ่มชั้นวางของ
                  </button>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  {racks.map((rack) => (
                    <div key={rack.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 relative">
                      <button onClick={() => removeRack(rack.id)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50" title="ลบแร็คนี้">
                        <Trash2 size={16} />
                      </button>

                      <div className="flex gap-3 mb-3">
                        <div className="flex-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ชื่อแร็ค</label>
                          <input type="text" value={rack.name} onChange={(e) => updateRackName(rack.id, e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold mt-1" />
                        </div>
                        <div className="w-24">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">จำนวนชั้น</label>
                          <input type="number" value={rack.floors.length} onChange={(e) => updateRackFloorCount(rack.id, parseInt(e.target.value) || 1)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold mt-1 text-center" min="1" max="10" />
                        </div>
                      </div>

                      {/* ย่อยระดับชั้น: ระบุบล็อกไม่เท่ากันได้ */}
                      <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 mb-1 border-b border-slate-100 pb-1">จัดการความจุ (บล็อก/ช่อง) ของแต่ละชั้น</p>
                        {rack.floors.map((floor) => (
                          <div key={floor.level} className="flex items-center justify-between gap-3">
                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded w-16 text-center">ชั้น {floor.level}</span>
                            <div className="flex items-center gap-2 flex-1">
                              <input type="range" min="1" max="20" value={floor.blocks} onChange={(e) => updateFloorBlocks(rack.id, floor.level, parseInt(e.target.value))} className="flex-1 h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                              <input type="number" min="1" max="20" value={floor.blocks} onChange={(e) => updateFloorBlocks(rack.id, floor.level, parseInt(e.target.value) || 1)} className="w-14 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-center" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-500">ความจุรวม: <span className="text-blue-600 font-black text-base">{totalIndoorBins}</span> ช่อง</div>
                  <button onClick={handleSaveLocation} disabled={isSaving} className="bg-[#741F80] hover:bg-[#5b1865] text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md">
                    <Save size={16} /> บันทึก
                  </button>
                </div>
              </div>
            ) : (
              /* OUTDOOR FORM */
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="font-black text-sm text-emerald-900 flex items-center gap-1.5"><LayoutGrid size={16} className="text-emerald-600" /> ขนาดกริดพื้นที่สนาม</h4>
                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-slate-400">กว้าง (คอลัมน์)</label>
                    <input type="number" value={gridSize.width} onChange={(e) => setGridSize({...gridSize, width: Math.max(1, Math.min(15, parseInt(e.target.value) || 1))})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-center mt-1" min="1" max="15" />
                  </div>
                  <div className="text-slate-300 font-black text-sm mt-4">X</div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-slate-400">ยาว (แถว)</label>
                    <input type="number" value={gridSize.height} onChange={(e) => setGridSize({...gridSize, height: Math.max(1, Math.min(15, parseInt(e.target.value) || 1))})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-center mt-1" min="1" max="15" />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-500">พิกัดใช้งาน: <span className="text-emerald-600 font-black text-base">{totalOutdoorBins}</span> ช่อง</div>
                  <button onClick={handleSaveLocation} disabled={isSaving || totalOutdoorBins === 0} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex gap-2 shadow-md">
                    <Save size={16} /> บันทึก
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🗺️ ฝั่งขวา: จอพรีวิวเสมือนจริง */}
        <div className="lg:col-span-7 bg-slate-100 border border-slate-200 rounded-[2rem] p-6 min-h-[500px] flex flex-col">
          <div className="border-b border-slate-200 pb-3 mb-4 flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">ผังพรีวิวจำลองพิกัดจริง</span>
            {locType === "indoor" && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">ชั้น 0 อยู่ล่างสุด</span>}
          </div>

          <div className="flex-1 flex flex-col justify-center items-center w-full">
            
            {locType === "indoor" && (
              <div className="w-full space-y-6 max-h-[65vh] overflow-y-auto p-2">
                {racks.map((rack) => (
                  <div key={rack.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm border-b-[6px] border-blue-400">
                    <div className="text-xs font-black text-slate-700 mb-3 bg-slate-100 px-3 py-1 rounded-md w-fit">{rack.name || "ชั้นวาง"}</div>
                    
                    <div className="flex flex-col-reverse gap-2">
                      {rack.floors.map((floor) => (
                        <div key={floor.level} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                          <span className="w-14 text-[9px] font-black text-slate-400 text-center bg-white border rounded py-1 shrink-0 shadow-sm">ชั้น {floor.level}</span>
                          <div className="flex gap-1.5 overflow-x-auto w-full py-0.5">
                            {Array.from({ length: floor.blocks }).map((_, bIdx) => (
                              <div key={bIdx} className="w-14 h-10 bg-white border border-slate-200 rounded-md flex items-center justify-center text-[8px] font-bold text-slate-500 shadow-inner shrink-0" title={`B${String(bIdx + 1).padStart(2, "0")}`}>
                                B{String(bIdx + 1).padStart(2, "0")}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 🎯 ลานสนามกลางแจ้ง: จัดให้ตารางอยู่กึ่งกลางสวยงาม 100% */}
            {locType === "outdoor" && (
              <div className="flex flex-col items-center justify-center p-2 w-full h-full">
                <p className="text-[10px] font-bold text-slate-400 mb-4 flex items-center gap-1"><MousePointerClick size={12}/> ท่านสามารถกดคลิกสลับบล็อกที่จำลองเป็น "ทางเดินรถ/สิ่งกีดขวาง" ได้จริง</p>
                
                {/* เพิ่ม flex justify-center และ items-center */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-inner overflow-auto w-full flex justify-center items-center max-h-[60vh]">
                  <div className="grid gap-1.5 mx-auto w-fit" style={{ gridTemplateColumns: `repeat(${gridSize.width}, minmax(0, 1fr))` }}>
                    {Array.from({ length: gridSize.height }).map((_, rIdx) => (
                      Array.from({ length: gridSize.width }).map((_, cIdx) => {
                        const r = rIdx + 1, c = cIdx + 1, key = `${r}-${c}`, isDeactivated = deactivatedCells.includes(key);
                        return (
                          <div 
                            key={key} 
                            onClick={() => toggleCell(r, c)}
                            className={`
                              w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center text-[9px] font-black cursor-pointer transition-all select-none
                              ${isDeactivated 
                                ? 'bg-slate-100 border-2 border-dashed border-slate-300 text-slate-300 hover:bg-slate-200' 
                                : 'bg-emerald-50 border-2 border-emerald-300 text-emerald-700 hover:scale-105 hover:shadow-md shadow-sm'}
                            `}
                          >
                            {isDeactivated ? "ทางเดิน" : `R${r}C${c}`}
                          </div>
                        );
                      })
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}