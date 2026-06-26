"use client";



import { useState, useEffect, useRef } from "react";

import Link from "next/link";

import { PackageSearch, Search, Edit3, Trash2, Eye, MapPin, Loader2, X, Save, CheckCircle2, XCircle, AlertTriangle, ImagePlus, Plus, Filter, ImageOff, MapPinOff } from "lucide-react";



export default function AdminDashboard() {

  const [materials, setMaterials] = useState<any[]>([]);

  const [tableSearch, setTableSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);

 

  // 💡 State สำหรับตัวกรองข้อมูล (ทั้งหมด, ขาดพิกัด, ขาดรูป)

  const [filterType, setFilterType] = useState<"ALL" | "NO_BIN" | "NO_IMG">("ALL");



  const [locationsData, setLocationsData] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);



  const [editModal, setEditModal] = useState({

    show: false, id: "", materialCode: "", description: "",

    thaiName: "", specificTerm: "", placeOfWork: "", remark: "", imageUrl: ""

  });

  const [editLocations, setEditLocations] = useState([{ locId: "", zoneId: "", locationCode: "" }]);

  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);



  const [popup, setPopup] = useState<{ show: boolean; type: "loading" | "success" | "error"; message: string }>({ show: false, type: "loading", message: "" });

  const showPopup = (type: "loading" | "success" | "error", message: string) => setPopup({ show: true, type, message });

  const closePopup = () => setPopup({ ...popup, show: false });

  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: "", code: "" });



  const fetchMaterials = async () => {

    setIsLoading(true);

    try {

      const res = await fetch(`/api/materials/search?q=&t=${Date.now()}`);

      const data = await res.json();

      if (res.ok && Array.isArray(data)) setMaterials(data);

    } catch (error) { console.error(error); } finally { setIsLoading(false); }

  };



  useEffect(() => {

    fetchMaterials();

    fetch(`/api/locations?t=${Date.now()}`).then(res => res.json()).then(data => {

      if (Array.isArray(data)) setLocationsData(data);

    });

  }, []);



  const executeDeleteMaterial = async () => {

    const targetId = confirmDelete.id; const targetCode = confirmDelete.code;

    setConfirmDelete({ show: false, id: "", code: "" });

    showPopup("loading", `กำลังลบพัสดุรหัส ${targetCode}...`);

    try {

      const res = await fetch(`/api/materials/${targetId}`, { method: "DELETE" });

      if (res.ok) { showPopup("success", `ลบข้อมูลเรียบร้อย!`); fetchMaterials(); } else { showPopup("error", "ระบบขัดข้อง"); }

    } catch (error) { showPopup("error", "ไม่สามารถส่งคำสั่งได้"); }

  };



  const openEditModal = (item: any) => {

    setEditImageFile(null); setEditImagePreview(item.imageUrl || null);

    setEditModal({

      show: true, id: item.id, materialCode: item.materialCode || "", description: item.description || "",

      thaiName: item.thaiName || "", specificTerm: item.specificTerm || "", placeOfWork: item.placeOfWork || "",

      remark: item.remark || "", imageUrl: item.imageUrl || ""

    });

    if (item.bins && item.bins.length > 0) {

      const mappedLocs = item.bins.map((b: any) => ({ locId: b.zone?.locationId || "", zoneId: b.zoneId || "", locationCode: b.code || "" }));

      setEditLocations(mappedLocs);

    } else { setEditLocations([{ locId: "", zoneId: "", locationCode: "" }]); }

  };



  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    if (file) { setEditImageFile(file); setEditImagePreview(URL.createObjectURL(file)); }

  };



  const handleSaveEdit = async () => {

    if (!editModal.description.trim()) return alert("กรุณากรอกรายละเอียด");

    showPopup("loading", "กำลังบันทึกข้อมูล...");

    setIsSaving(true);

    try {

      const formData = new FormData();

      formData.append("description", editModal.description);

      formData.append("thaiName", editModal.thaiName);

      formData.append("specificTerm", editModal.specificTerm);

      formData.append("placeOfWork", editModal.placeOfWork);

      formData.append("remark", editModal.remark);

      editLocations.forEach(loc => { if (loc.locationCode) formData.append("locationCodes", loc.locationCode); });

      if (editImageFile) formData.append("image", editImageFile);



      const res = await fetch(`/api/materials/${editModal.id}`, { method: "PUT", body: formData });

      if (res.ok) { setEditModal({ ...editModal, show: false }); showPopup("success", "บันทึกสำเร็จ!"); fetchMaterials(); }

      else { showPopup("error", "ไม่สามารถบันทึกได้"); }

    } catch (error) { showPopup("error", "เซิร์ฟเวอร์ขัดข้อง"); } finally { setIsSaving(false); }

  };



  const updateLocationField = (index: number, field: string, value: string) => {

    const newLocs = [...editLocations];

    newLocs[index] = { ...newLocs[index], [field]: value };

    if (field === 'locId') { newLocs[index].zoneId = ""; newLocs[index].locationCode = ""; }

    if (field === 'zoneId') { newLocs[index].locationCode = ""; }

    setEditLocations(newLocs);

  };



// ==============================================================

  // 🔍 ตัวกรองค้นหาอัจฉริยะแบบ Realtime (รองรับการค้นหาพัสดุแบบไม่มีขีด)

  // ==============================================================

  const cleanSearchTerm = tableSearch.replace(/[-\s]/g, '').toLowerCase(); // แปลงคำค้นหาให้เป็นตัวพิมพ์เล็กและลบขีดทิ้ง

  const normalSearchTerm = tableSearch.toLowerCase();



  const filteredMaterials = materials.filter(m => {

    // 1. กรองตามแถบค้นหาด่วน (Search Box)

    const code = (m.materialCode || "").toLowerCase();

    const cleanCode = code.replace(/[-\s]/g, ''); // ลบขีดออกจากข้อมูลที่จะนำมาเทียบด้วย



    const desc = (m.description || "").toLowerCase();

    const thai = (m.thaiName || "").toLowerCase();

    const term = (m.specificTerm || "").toLowerCase();

    const place = (m.placeOfWork || "").toLowerCase();

    const remark = (m.remark || "").toLowerCase();



    // เช็คว่าตรงกับฟิลด์ใดฟิลด์หนึ่งในตารางหรือไม่

    const matchesSearch =

      cleanCode.includes(cleanSearchTerm) || // เปรียบเทียบรหัสพัสดุแบบ "ไร้ขีด"

      code.includes(normalSearchTerm) ||     // เปรียบเทียบรหัสพัสดุแบบปกติ

      desc.includes(normalSearchTerm) ||

      thai.includes(normalSearchTerm) ||

      term.includes(normalSearchTerm) ||

      place.includes(normalSearchTerm) ||

      remark.includes(normalSearchTerm);



    if (!matchesSearch) return false;



    // 2. กรองตามแท็บด้านบน (พัสดุไม่สมบูรณ์)

    if (filterType === "NO_BIN") return !m.bins || m.bins.length === 0;

    if (filterType === "NO_IMG") return !m.imageUrl;

   

    return true; // กรณีแท็บ ALL

  });



  return (

    <div className="space-y-6 animate-in fade-in duration-300 relative pb-10">

     

      {/* POPUPS */}

      {popup.show && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">

          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center"><div className="mb-6">{popup.type === "loading" && <Loader2 size={64} className="text-[#741F80] animate-spin" />}{popup.type === "success" && <div className="text-emerald-500"><CheckCircle2 size={64} /></div>}{popup.type === "error" && <div className="text-red-500"><XCircle size={64} /></div>}</div><h3 className="text-2xl font-black mb-6">{popup.message}</h3>{popup.type !== "loading" && <button onClick={closePopup} className="w-full py-3 rounded-xl font-bold text-white bg-[#741F80]">ตกลง</button>}</div>

        </div>

      )}



      {confirmDelete.show && (

        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"><div className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4 shadow-2xl"><h3 className="text-2xl font-black text-center mb-6">ลบพัสดุถาวร!</h3><div className="flex gap-3 justify-center"><button onClick={() => setConfirmDelete({ show: false, id: "", code: "" })} className="px-6 py-3 rounded-xl font-bold bg-slate-100 flex-1">ยกเลิก</button><button onClick={executeDeleteMaterial} className="px-6 py-3 rounded-xl font-bold text-white bg-red-500 flex-1">ยืนยันลบ</button></div></div></div>

      )}



      {/* EDIT MODAL */}

      {editModal.show && (

        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">

          <div className="bg-white rounded-[2rem] max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh]">

            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0"><h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Edit3 className="text-amber-500" /> แก้ไขข้อมูลพัสดุ</h3><button onClick={() => setEditModal({...editModal, show: false})} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"><X size={20}/></button></div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                <div className="space-y-4">

                  <div><label className="text-xs font-black text-slate-400 mb-1 block">รหัสพัสดุ</label><input type="text" value={editModal.materialCode} disabled className="w-full bg-slate-100 rounded-xl px-4 py-2.5 font-bold opacity-70" /></div>

                  <div><label className="text-xs font-black text-slate-400 mb-1 block">คำอธิบายอังกฤษ *</label><input type="text" value={editModal.description} onChange={(e) => setEditModal({...editModal, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold" /></div>

                  <div className="grid grid-cols-2 gap-4">

                    <div><label className="text-xs font-black text-slate-400 mb-1 block">ชื่อภาษาไทย</label><input type="text" value={editModal.thaiName} onChange={(e) => setEditModal({...editModal, thaiName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold" /></div>

                    <div><label className="text-xs font-black text-slate-400 mb-1 block">ศัพท์เฉพาะ</label><input type="text" value={editModal.specificTerm} onChange={(e) => setEditModal({...editModal, specificTerm: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold" /></div>

                  </div>

                  <div className="flex flex-col mt-4">

                    <label className="block text-xs font-black text-slate-400 mb-1">รูปภาพพัสดุ</label>

                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />

                    <div onClick={() => fileInputRef.current?.click()} className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center h-[140px] relative overflow-hidden group cursor-pointer hover:bg-slate-100">

                      {editImagePreview ? (<div className="absolute inset-0 w-full h-full p-2"><img src={editImagePreview} className="w-full h-full object-contain rounded-xl" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl"><span className="text-white font-bold text-xs"><ImagePlus size={16} className="inline mr-1"/> เปลี่ยนรูป</span></div></div>) : (<div className="text-slate-400 flex flex-col items-center"><ImagePlus size={32} className="mb-2" /><p className="text-xs font-bold">คลิกเพิ่มรูปภาพ</p></div>)}

                    </div>

                  </div>

                </div>



                <div className="space-y-4">

                  <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">

                    <label className="text-xs font-black text-slate-700">📍 กำหนดพิกัดจัดเก็บ (วางได้หลายที่)</label>

                    <button onClick={() => setEditLocations([...editLocations, { locId: "", zoneId: "", locationCode: "" }])} className="text-[10px] font-bold bg-[#741F80]/10 text-[#741F80] px-2 py-1 rounded-md flex items-center gap-1 hover:bg-[#741F80]/20"><Plus size={12}/> เพิ่มพิกัดใหม่</button>

                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">

                    {editLocations.map((loc, index) => {

                      const currentLoc = locationsData.find(l => l.id === loc.locId);

                      const currentZone = currentLoc?.zones?.find((z: any) => z.id === loc.zoneId);

                      const currentBins = currentZone?.bins || [];

                      return (

                        <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-xl relative">

                          {editLocations.length > 1 && (<button onClick={() => setEditLocations(editLocations.filter((_, i) => i !== index))} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 border border-white hover:bg-red-500 hover:text-white shadow-sm"><X size={12}/></button>)}

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">

                            <select value={loc.locId} onChange={(e) => updateLocationField(index, "locId", e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700"><option value="">1. คลัง/สนาม</option>{locationsData.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>

                            <select value={loc.zoneId} onChange={(e) => updateLocationField(index, "zoneId", e.target.value)} disabled={!loc.locId} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-50"><option value="">2. แร็ค/โซน</option>{currentLoc?.zones?.map((z: any) => <option key={z.id} value={z.id}>{z.name}</option>)}</select>

                            <select value={loc.locationCode} onChange={(e) => updateLocationField(index, "locationCode", e.target.value)} disabled={!loc.zoneId} className="w-full bg-white border-2 border-amber-400 rounded-lg px-2 py-1.5 text-xs font-black text-amber-700 disabled:opacity-50"><option value="">3. ช่องจัดเก็บ</option>{currentBins.map((b: any) => <option key={b.id} value={b.code}>{b.code}</option>)}</select>

                          </div>

                        </div>

                      )

                    })}

                  </div>

                </div>

              </div>

            </div>

            <div className="flex gap-3 justify-end p-6 border-t border-slate-100 bg-slate-50 shrink-0 rounded-b-[2rem]"><button onClick={() => setEditModal({ ...editModal, show: false })} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 text-sm">ยกเลิก</button><button onClick={handleSaveEdit} disabled={isSaving} className="px-6 py-3 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 text-sm shadow-md flex gap-2">{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} บันทึกการเปลี่ยนแปลง</button></div>

          </div>

        </div>

      )}



      {/* DASHBOARD HEADER */}

      <div><h2 className="text-3xl font-black text-slate-800 flex items-center gap-3"><PackageSearch className="text-[#741F80]" size={32} /> รายการพัสดุในคลังทั้งหมด</h2></div>

     

      {/* 💡 แผงคัดกรองข้อมูล (Filter Tabs) */}

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">

        <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 scrollbar-none">

          <button onClick={() => setFilterType("ALL")} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${filterType === "ALL" ? "bg-[#741F80] text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>

            <Filter size={14} /> พัสดุทั้งหมด

          </button>

          <button onClick={() => setFilterType("NO_BIN")} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${filterType === "NO_BIN" ? "bg-amber-500 text-white shadow-sm" : "bg-amber-50 text-amber-600 hover:bg-amber-100"}`}>

            <MapPinOff size={14} /> ยังไม่ระบุพิกัด

          </button>

          <button onClick={() => setFilterType("NO_IMG")} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${filterType === "NO_IMG" ? "bg-rose-500 text-white shadow-sm" : "bg-rose-50 text-rose-600 hover:bg-rose-100"}`}>

            <ImageOff size={14} /> ยังไม่มีรูปภาพ

          </button>

        </div>



        <div className="flex items-center gap-3 w-full xl:w-auto">

          <div className="text-xs font-bold text-slate-500 whitespace-nowrap">พบ: <span className="text-[#741F80] font-black">{filteredMaterials.length}</span> รายการ</div>

          <div className="relative w-full xl:w-72"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><input type="text" placeholder="ค้นหาข้อมูล..." value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold" />{tableSearch && <button onClick={() => setTableSearch("")} className="absolute right-3 top-2.5 text-slate-400"><X size={14}/></button>}</div>

        </div>

      </div>



      {/* ✅ ตารางข้อมูลพัสดุ (พร้อมแถบเลื่อนแนวตั้งและล็อกหัวตาราง) */}

      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">

        {/* เพิ่ม overflow-y-auto กำหนด max-h เพื่อให้มีแถบเลื่อนเมื่อเกิน ~20 รายการ */}

        <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">

          <table className="w-full text-left whitespace-nowrap min-w-[850px]">

            {/* เพิ่ม sticky top-0 ไว้ล็อกหัวตาราง, z-10 และกำหนด bg เพื่อไม่ให้โปร่งใส */}

            <thead className="sticky top-0 z-10 shadow-sm border-b border-slate-200">

              <tr className="bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-widest">

                <th className="p-4 pl-6 w-36 bg-slate-50">รหัสพัสดุ</th>

                <th className="p-4 bg-slate-50">รายละเอียด</th>

                <th className="p-4 w-60 text-[#741F80] bg-slate-50">รหัสพิกัดจัดเก็บ</th>

                <th className="p-4 w-36 text-center bg-slate-50">จัดการ</th>

              </tr>

            </thead>

            <tbody>

              {isLoading ? (<tr><td colSpan={4} className="p-16 text-center text-slate-400"><Loader2 className="animate-spin mx-auto mb-3" size={36} /><p>กำลังโหลด...</p></td></tr>) :

               filteredMaterials.length === 0 ? (<tr><td colSpan={4} className="p-16 text-center font-bold text-slate-400">ไม่พบพัสดุตามเงื่อนไขที่เลือก</td></tr>) :

               filteredMaterials.map((item) => (

                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/40">

                  <td className="p-4 pl-6 font-black text-slate-800 text-sm">{item.materialCode}</td>

                  <td className="p-4"><div className="font-bold text-sm text-slate-800 truncate max-w-md">{item.description}</div><div className="text-xs text-slate-400 mt-0.5">{item.thaiName || "-"}</div></td>

                  <td className="p-4">

                    <div className="flex flex-wrap gap-1.5 max-w-[250px]">

                      {item.bins && item.bins.length > 0 ? (

                        item.bins.map((b: any) => (<span key={b.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#741F80]/10 text-[#741F80] rounded-md text-[10px] font-black"><MapPin size={10} /> {b.code}</span>))

                      ) : (<span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">ยังไม่ระบุพิกัด</span>)}

                    </div>

                  </td>

                  <td className="p-4 text-center"><div className="flex justify-center gap-1.5"><Link href={`/admin/materials/${item.id}`} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl shadow-sm"><Eye size={15}/></Link><button onClick={() => openEditModal(item)} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl shadow-sm"><Edit3 size={15}/></button><button onClick={() => setConfirmDelete({ show: true, id: item.id, code: item.materialCode })} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl shadow-sm"><Trash2 size={15}/></button></div></td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

}

