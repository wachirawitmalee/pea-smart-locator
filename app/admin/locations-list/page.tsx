"use client";

import { useState, useEffect } from "react";
import { MapPin, Box, Factory, Tent, Layers, Trash2, Edit3, Loader2, CheckCircle2, XCircle, X, AlertTriangle, RefreshCw, Save, Plus, LayoutGrid, Grid3X3, MousePointerClick } from "lucide-react";

export default function LocationsListPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 POPUPS
  const [popup, setPopup] = useState<{ show: boolean; type: "loading" | "success" | "error"; message: string }>({ show: false, type: "loading", message: "" });
  const showPopup = (type: "loading" | "success" | "error", message: string) => setPopup({ show: true, type, message });
  const closePopup = () => setPopup({ ...popup, show: false });

  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: "", name: "" });

  // ✏️ ADVANCED EDIT MODAL STATE
  const [editModal, setEditModal] = useState({ show: false, id: "", name: "", type: "INDOOR" });
  const [racks, setRacks] = useState<any[]>([]);
  const [gridSize, setGridSize] = useState({ width: 5, height: 5 });
  const [deactivatedCells, setDeactivatedCells] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/locations?t=${Date.now()}`);
      const data = await res.json();
      if (Array.isArray(data)) setLocations(data);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchLocations(); }, []);

  const executeDelete = async () => {
    const targetId = confirmDelete.id; const targetName = confirmDelete.name;
    setConfirmDelete({ show: false, id: "", name: "" });
    showPopup("loading", `กำลังลบ "${targetName}"...`);
    try {
      const res = await fetch(`/api/locations/${targetId}`, { method: "DELETE" });
      if (res.ok) { showPopup("success", `ลบ "${targetName}" เรียบร้อยแล้ว!`); fetchLocations(); } 
      else { showPopup("error", "ไม่สามารถทำการลบข้อมูลได้"); }
    } catch (error) { showPopup("error", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้"); }
  };

  // 🛠️ เปิด Modal แล้วแปลงข้อมูลจาก DB กลับมาเป็นรูปแบบฟอร์ม Builder
  const openEditModal = (loc: any) => {
    setEditModal({ show: true, id: loc.id, name: loc.name, type: loc.type });
    
    if (loc.type === "INDOOR") {
      const parsedRacks: any[] = [];
      loc.zones.forEach((zone: any) => {
        const parts = zone.name.split(" - ชั้น ");
        const rackName = parts[0] || zone.name;
        const level = parseInt(parts[1] || "0");
        const blocksCount = zone.bins ? zone.bins.length : 0;

        let rack = parsedRacks.find(r => r.name === rackName);
        if (!rack) {
          rack = { id: Math.random(), name: rackName, floors: [] };
          parsedRacks.push(rack);
        }
        rack.floors.push({ level, blocks: blocksCount });
      });
      parsedRacks.forEach(r => r.floors.sort((a: any, b: any) => a.level - b.level));
      setRacks(parsedRacks.length > 0 ? parsedRacks : [{ id: 1, name: "แร็ค A", floors: [{ level: 0, blocks: 4 }] }]);
    } 
    else if (loc.type === "OUTDOOR") {
      let maxR = 5, maxC = 5;
      const activeKeys: string[] = [];
      
      if (loc.zones.length > 0 && loc.zones[0].bins) {
        loc.zones[0].bins.forEach((b: any) => {
          const match = b.code.match(/-R(\d+)-C(\d+)/);
          if (match) {
            const r = parseInt(match[1]); const c = parseInt(match[2]);
            if (r > maxR) maxR = r; if (c > maxC) maxC = c;
            activeKeys.push(`${r}-${c}`);
          }
        });
      }
      setGridSize({ width: maxC, height: maxR });
      
      const deact: string[] = [];
      for(let r=1; r<=maxR; r++) {
        for(let c=1; c<=maxC; c++) {
          if(!activeKeys.includes(`${r}-${c}`)) deact.push(`${r}-${c}`);
        }
      }
      setDeactivatedCells(deact);
    }
  };

  // --- ฟังก์ชันจัดการ Racks (เหมือน Location Builder) ---
  const addRack = () => {
    const charLabel = String.fromCharCode(65 + (racks.length % 26)); 
    setRacks([...racks, { id: Math.random(), name: `แร็ค ${charLabel}`, floors: [{ level: 0, blocks: 4 }, { level: 1, blocks: 4 }] }]);
  };
  const removeRack = (id: number) => {
    if (racks.length <= 1) return alert("ต้องมีโครงสร้างชั้นวางอย่างน้อย 1 ชุด");
    setRacks(racks.filter(r => r.id !== id));
  };
  const updateRackName = (id: number, name: string) => setRacks(racks.map(r => r.id === id ? { ...r, name } : r));
  const updateRackFloorCount = (id: number, count: number) => {
    const validCount = Math.max(1, Math.min(10, count));
    setRacks(racks.map(r => {
      if (r.id !== id) return r;
      const newFloors = [...r.floors];
      if (validCount > newFloors.length) { for (let i = newFloors.length; i < validCount; i++) newFloors.push({ level: i, blocks: 4 }); } 
      else if (validCount < newFloors.length) { newFloors.splice(validCount); }
      return { ...r, floors: newFloors };
    }));
  };
  const updateFloorBlocks = (rackId: number, level: number, blocks: number) => {
    const validBlocks = Math.max(1, Math.min(20, blocks));
    setRacks(racks.map(r => {
      if (r.id !== rackId) return r;
      return { ...r, floors: r.floors.map((f: any) => f.level === level ? { ...f, blocks: validBlocks } : f) };
    }));
  };
  const toggleCell = (r: number, c: number) => {
    const key = `${r}-${c}`;
    if (deactivatedCells.includes(key)) setDeactivatedCells(deactivatedCells.filter(cell => cell !== key));
    else setDeactivatedCells([...deactivatedCells, key]);
  };

  // 💾 บันทึกโครงสร้างใหม่
  const handleSaveEdit = async () => {
    if (!editModal.name.trim()) return alert("กรุณาระบุชื่อสถานที่");
    showPopup("loading", "กำลังเปรียบเทียบและอัปเดตโครงสร้างผัง...");
    setIsSaving(true);
    
    const payload = editModal.type === "INDOOR" 
      ? { name: editModal.name, type: "INDOOR", racks }
      : { name: editModal.name, type: "OUTDOOR", grid: { width: gridSize.width, height: gridSize.height, deactivatedCells } };

    try {
      const res = await fetch(`/api/locations/${editModal.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        setEditModal({ show: false, id: "", name: "", type: "INDOOR" });
        showPopup("success", "ปรับเปลี่ยนโครงสร้างสถานที่สำเร็จ! พัสดุเดิมปลอดภัย 100%");
        fetchLocations();
      } else { alert("เกิดข้อผิดพลาดในการบันทึก"); }
    } catch (error) { alert("เชื่อมต่อไม่ได้"); } finally { setIsSaving(false); }
  };

  return (
    <div className="relative animate-in fade-in duration-500 max-w-6xl mx-auto flex flex-col h-full pb-12">
      {/* POPUPS */}
      {popup.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"><div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center"><div className="mb-6">{popup.type === "loading" && <Loader2 size={64} className="text-[#741F80] animate-spin" />}{popup.type === "success" && <div className="text-emerald-500"><CheckCircle2 size={64} /></div>}{popup.type === "error" && <div className="text-red-500"><XCircle size={64} /></div>}</div><h3 className="text-2xl font-black mb-6">{popup.message}</h3>{popup.type !== "loading" && <button onClick={closePopup} className="w-full py-3 rounded-xl font-bold text-white bg-[#741F80]">ตกลง</button>}</div></div>
      )}

      {confirmDelete.show && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"><div className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4 shadow-2xl"><h3 className="text-2xl font-black text-center mb-6">คำเตือนร้ายแรง!</h3><p className="text-center text-slate-600 mb-6">คุณแน่ใจหรือไม่ว่าต้องการลบ "{confirmDelete.name}" ? <br/><span className="text-xs mt-2 block bg-slate-50 p-2 rounded-lg text-slate-500">พัสดุที่เคยวางอยู่จะถูกปลดล็อกเป็นช่องว่างทันที</span></p><div className="flex gap-3"><button onClick={() => setConfirmDelete({ show: false, id: "", name: "" })} className="px-6 py-3 rounded-xl font-bold bg-slate-100 flex-1">ยกเลิก</button><button onClick={executeDelete} className="px-6 py-3 rounded-xl font-bold text-white bg-red-500 flex-1">ยืนยันลบ</button></div></div></div>
      )}

      {/* ✏️ ADVANCED EDIT STRUCTURE MODAL */}
      {editModal.show && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Edit3 className="text-blue-500"/> แก้ไขโครงสร้างสถานที่จัดเก็บ</h3>
              <button onClick={() => setEditModal({...editModal, show: false})} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <div className="mb-6">
                <label className="block text-xs font-black text-slate-400 mb-1">ชื่ออาคาร/สถานที่หลัก</label>
                <input type="text" value={editModal.name} onChange={(e) => setEditModal({...editModal, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500" />
              </div>

              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <p className="text-xs font-bold text-blue-700 mb-4 bg-white p-2 rounded-lg border border-blue-200">
                  ⚠️ ระบบจะปลดล็อกเฉพาะ "พัสดุที่วางอยู่ในบล็อกที่คุณกดลบ" เท่านั้น บล็อกอื่นๆ และพัสดุที่ยังอยู่จะปลอดภัย 100%
                </p>

                {/* INDOOR EDITOR */}
                {editModal.type === "INDOOR" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center"><h4 className="font-black text-sm text-blue-900 flex items-center gap-1.5"><Box size={16} /> จัดการชั้นวาง (Racks)</h4><button onClick={addRack} className="bg-white text-blue-700 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm"><Plus size={14} /> เพิ่มชั้นวาง</button></div>
                    <div className="space-y-4">
                      {racks.map((rack) => (
                        <div key={rack.id} className="bg-white border border-slate-200 rounded-2xl p-4 relative">
                          <button onClick={() => removeRack(rack.id)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50"><Trash2 size={16} /></button>
                          <div className="flex gap-3 mb-3">
                            <div className="flex-1"><label className="text-[10px] font-black text-slate-400">ชื่อแร็ค</label><input type="text" value={rack.name} onChange={(e) => updateRackName(rack.id, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold mt-1" /></div>
                            <div className="w-24"><label className="text-[10px] font-black text-slate-400">จำนวนชั้น</label><input type="number" value={rack.floors.length} onChange={(e) => updateRackFloorCount(rack.id, parseInt(e.target.value) || 1)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold mt-1 text-center" min="1" max="10" /></div>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                            {rack.floors.map((floor: any) => (
                              <div key={floor.level} className="flex items-center justify-between gap-3"><span className="text-xs font-bold text-slate-600 bg-white px-2 py-1 rounded border shadow-sm w-16 text-center">ชั้น {floor.level}</span><div className="flex items-center gap-2 flex-1"><input type="range" min="1" max="20" value={floor.blocks} onChange={(e) => updateFloorBlocks(rack.id, floor.level, parseInt(e.target.value))} className="flex-1 h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer" /><input type="number" min="1" max="20" value={floor.blocks} onChange={(e) => updateFloorBlocks(rack.id, floor.level, parseInt(e.target.value) || 1)} className="w-14 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-center" /></div></div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* OUTDOOR EDITOR */}
                {editModal.type === "OUTDOOR" && (
                  <div className="space-y-4">
                    <h4 className="font-black text-sm text-emerald-900 flex items-center gap-1.5"><LayoutGrid size={16} /> แก้ไขขนาดกริดพื้นที่สนาม</h4>
                    <div className="flex gap-4 bg-white p-3 rounded-xl border"><div className="flex-1"><label className="text-[10px] font-black text-slate-400">กว้าง (คอลัมน์)</label><input type="number" value={gridSize.width} onChange={(e) => setGridSize({...gridSize, width: Math.max(1, Math.min(20, parseInt(e.target.value) || 1))})} className="w-full border rounded-lg px-3 py-2 text-xs font-bold text-center mt-1" /></div><div className="text-slate-300 font-black text-sm mt-4">X</div><div className="flex-1"><label className="text-[10px] font-black text-slate-400">ยาว (แถว)</label><input type="number" value={gridSize.height} onChange={(e) => setGridSize({...gridSize, height: Math.max(1, Math.min(20, parseInt(e.target.value) || 1))})} className="w-full border rounded-lg px-3 py-2 text-xs font-bold text-center mt-1" /></div></div>
                    <div className="bg-white p-4 rounded-xl border overflow-auto w-full flex justify-center max-h-[300px]">
                      <div className="grid gap-1.5 mx-auto w-fit" style={{ gridTemplateColumns: `repeat(${gridSize.width}, minmax(0, 1fr))` }}>
                        {Array.from({ length: gridSize.height }).map((_, rIdx) => Array.from({ length: gridSize.width }).map((_, cIdx) => {
                          const r = rIdx + 1, c = cIdx + 1, key = `${r}-${c}`, isDeactivated = deactivatedCells.includes(key);
                          return (<div key={key} onClick={() => toggleCell(r, c)} className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-[9px] font-black cursor-pointer transition-all select-none ${isDeactivated ? 'bg-slate-100 border-2 border-dashed border-slate-300 text-slate-300' : 'bg-emerald-50 border-2 border-emerald-300 text-emerald-700 hover:scale-105 shadow-sm'}`}>{isDeactivated ? "X" : `R${r}C${c}`}</div>);
                        }))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end p-6 border-t border-slate-100 bg-slate-50 shrink-0 rounded-b-[2rem]">
              <button onClick={() => setEditModal({ ...editModal, show: false })} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors text-sm">ยกเลิก</button>
              <button onClick={handleSaveEdit} disabled={isSaving} className="px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 text-sm shadow-md flex items-center gap-2">{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} บันทึกโครงสร้างใหม่</button>
            </div>
          </div>
        </div>
      )}

      {/* Header หน้าจอ */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div><h2 className="text-2xl font-black text-slate-800 mb-1 flex items-center gap-2"><MapPin className="text-[#741F80]" /> รายการผังคลังและสนามทั้งหมด</h2><p className="text-slate-500 font-medium text-sm">แสดงและปรับแต่งโครงสร้างสถานที่จัดเก็บในระบบ</p></div>
        <button onClick={fetchLocations} className="text-sm font-bold text-[#741F80] bg-[#741F80]/10 hover:bg-[#741F80]/20 px-4 py-2.5 rounded-xl flex items-center gap-2"><RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> รีเฟรชข้อมูลผัง</button>
      </div>

      {isLoading ? (<div className="flex flex-col items-center justify-center py-20 text-[#741F80]"><Loader2 size={48} className="animate-spin mb-4" /><p className="font-bold">กำลังดึงข้อมูล...</p></div>) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map(loc => {
            const totalBins = loc.zones.reduce((sum: any, zone: any) => sum + (zone.bins ? zone.bins.length : 0), 0);
            const isIndoor = loc.type === "INDOOR";
            return (
              <div key={loc.id} className="group bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-lg transition-all relative">
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg shadow-sm">
                  {/* ปุ่มนี้ตอนนี้กดแก้ไขโครงสร้างลึกได้แล้ว! */}
                  <button onClick={() => openEditModal(loc)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-md"><Edit3 size={16} /></button>
                  <button onClick={() => setConfirmDelete({ show: true, id: loc.id, name: loc.name })} className="p-2 text-red-500 hover:bg-red-50 rounded-md"><Trash2 size={16} /></button>
                </div>
                <div className="flex items-center gap-3 mb-4 pr-16"><div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isIndoor ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>{isIndoor ? <Factory size={24} /> : <Tent size={24} />}</div><div><h3 className="font-black text-lg text-slate-800 line-clamp-1">{loc.name}</h3><p className="text-[10px] font-bold uppercase text-slate-400">{isIndoor ? 'คลังในร่ม (INDOOR)' : 'พื้นที่สนาม (OUTDOOR)'}</p></div></div>
                <div className="bg-slate-50 rounded-xl p-4 mb-2 border border-slate-100"><div className="flex justify-between mb-2"><span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Layers size={14} /> ชั้น/โซน</span><span className="text-sm font-black text-slate-700">{loc.zones.length} โซน</span></div><div className="flex justify-between"><span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Box size={14} /> ความจุรวม</span><span className="text-sm font-black text-[#741F80]">{totalBins} บล็อก</span></div></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}