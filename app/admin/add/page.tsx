"use client";

import { useState, useEffect, useRef } from "react";
import { 
  PackagePlus, MapPin, UploadCloud, Save, RefreshCw, 
  X, Loader2, CheckCircle2, XCircle, ImageIcon 
} from "lucide-react";

export default function AddMaterialPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // 🌟 SMART POPUP SYSTEM (ระบบแจ้งเตือนหลัก)
  // ==========================================
  const [popup, setPopup] = useState<{ show: boolean; type: "loading" | "success" | "error"; message: string }>({
    show: false, type: "loading", message: ""
  });

  const showPopup = (type: "loading" | "success" | "error", message: string) => setPopup({ show: true, type, message });
  const closePopup = () => setPopup({ ...popup, show: false });

  // ==========================================
  // Dropdown Selector State
  // ==========================================
  const [locationsData, setLocationsData] = useState<any[]>([]);
  const [selectedLocId, setSelectedLocId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");

  useEffect(() => {
    fetch("/api/locations").then(res => res.json()).then(data => {
      if(Array.isArray(data)) setLocationsData(data);
    });
  }, []);

  const activeLocation = locationsData.find(loc => loc.id === selectedLocId);
  const activeZone = activeLocation?.zones?.find((z:any) => z.id === selectedZoneId);
  const bins = activeZone?.bins || [];

  // ==========================================
  // 📦 STATE FORM: จัดการฟอร์มข้อมูลพัสดุและรูปภาพ
  // ==========================================
  const [isSaving, setIsSaving] = useState(false);
  const [singleMaterial, setSingleMaterial] = useState({
    materialCode: "", description: "", thaiName: "", specificTerm: "",
    placeOfWork: "สถานที่ปฏิบัติงาน กฟภ.ระโนด", locationCode: "", remark: ""
  });
  
  // ตัวแปรเก็บไฟล์รูปภาพจริงและรูปภาพพรีวิวบนหน้าจอ
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // ฟังก์ชันดักจับตอนแอดมินเลือกรูปภาพ
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showPopup("error", "ไฟล์รูปภาพมีขนาดใหญ่เกินไป จำกัดขนาดไม่เกิน 5MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file)); // สร้างลิงก์ชั่วคราวมาส่องพรีวิวในจอ
  };

  // ฟังก์ชันล้างรูปภาพที่เลือกออก
  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // กันไม่ให้ไปเปิดหน้าต่างเลือกไฟล์ซ้ำ
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ฟังก์ชันยิงฟอร์มเข้าฐานข้อมูลด้วย FormData ยืดหยุ่นสูงสุด
// ฟังก์ชันยิงฟอร์มเข้าฐานข้อมูลด้วย FormData ยืดหยุ่นสูงสุด
  const handleSaveSingle = async () => {
    if (!singleMaterial.materialCode || !singleMaterial.description) {
      showPopup("error", "กรุณากรอก รหัสพัสดุ และ ชื่อพัสดุ (Description) ให้ครบถ้วน");
      return;
    }
    if (!singleMaterial.locationCode) {
      showPopup("error", "กรุณาเลือกพิกัดจัดเก็บ (ช่อง/บล็อก) ให้ครบถ้วน");
      return;
    }

    setIsSaving(true);
    showPopup("loading", "กำลังทำการอัปโหลดรูปภาพและบันทึกพัสดุเข้าคลังจริง...");
    
    try {
      const formData = new FormData();
      formData.append("materialCode", singleMaterial.materialCode);
      formData.append("description", singleMaterial.description);
      formData.append("thaiName", singleMaterial.thaiName);
      formData.append("specificTerm", singleMaterial.specificTerm);
      formData.append("placeOfWork", singleMaterial.placeOfWork);
      formData.append("locationCode", singleMaterial.locationCode);
      formData.append("remark", singleMaterial.remark);
      
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch("/api/materials", {
        method: "POST",
        body: formData,
      });
      
      // ดักจับ Error ที่ไม่ได้เป็น JSON ก่อนเลย
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`เซิร์ฟเวอร์ตอบกลับผิดปกติ (Status: ${res.status})`);
      }

      const data = await res.json();
      
      if (res.ok) {
        showPopup("success", "บันทึกข้อมูลพัสดุพร้อมไฟล์รูปภาพลงในระบบสำเร็จ!");
        setSingleMaterial({
          materialCode: "", description: "", thaiName: "", specificTerm: "",
          placeOfWork: "สถานที่ปฏิบัติงาน กฟภ.ระโนด", locationCode: "", remark: ""
        });
        setImageFile(null);
        setImagePreview(null);
        setSelectedLocId(""); 
        setSelectedZoneId("");
      } else {
        showPopup("error", data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (error: any) {
      console.error(error);
      showPopup("error", error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์หลังบ้าน");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* 🔮 GLOBAL SMART POPUP OVERLAY */}
      {popup.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center relative border border-slate-100">
            {popup.type !== "loading" && <button onClick={closePopup} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full"><X size={20} /></button>}
            <div className="mb-6">
              {popup.type === "loading" && <Loader2 size={64} className="text-[#741F80] animate-spin" />}
              {popup.type === "success" && <div className="text-emerald-500"><CheckCircle2 size={64} /></div>}
              {popup.type === "error" && <div className="text-red-500"><XCircle size={64} /></div>}
            </div>
            <h3 className="text-2xl font-black mb-2">{popup.type === "loading" ? "กำลังดำเนินการ..." : popup.type === "success" ? "สำเร็จ!" : "เกิดข้อผิดพลาด"}</h3>
            <p className="text-slate-600 font-medium text-sm mb-6">{popup.message}</p>
            {popup.type !== "loading" && <button onClick={closePopup} className="w-full py-3 rounded-xl font-bold text-white bg-[#741F80] hover:bg-[#5b1865] shadow-md">ตกลง</button>}
          </div>
        </div>
      )}

      <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <PackagePlus className="text-[#741F80]" /> เพิ่มรายการพัสดุใหม่เข้าสู่ระบบ
      </h2>
      
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* กรอกข้อความปกติ */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">รหัสพัสดุ (Material Code) *</label>
            <input type="text" value={singleMaterial.materialCode} onChange={(e) => setSingleMaterial({...singleMaterial, materialCode: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#741F80] font-semibold text-slate-800" placeholder="เช่น 1030140011" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อพัสดุระบบอังกฤษ (Description) *</label>
            <input type="text" value={singleMaterial.description} onChange={(e) => setSingleMaterial({...singleMaterial, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#741F80] font-semibold text-slate-800" placeholder="เช่น CLEVIS THIMBLE..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อภาษาไทย</label>
              <input type="text" value={singleMaterial.thaiName} onChange={(e) => setSingleMaterial({...singleMaterial, thaiName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#741F80] font-semibold text-slate-800" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">ศัพท์เฉพาะ</label>
              <input type="text" value={singleMaterial.specificTerm} onChange={(e) => setSingleMaterial({...singleMaterial, specificTerm: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#741F80] font-semibold text-slate-800" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">สถานที่ปฏิบัติงาน</label>
            <input type="text" value={singleMaterial.placeOfWork} onChange={(e) => setSingleMaterial({...singleMaterial, placeOfWork: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#741F80] font-semibold text-slate-800" />
          </div>

          {/* ตระกูล Dropdown คัดเลือกพิกัด */}
          <div className="p-5 bg-[#741F80]/5 border border-[#741F80]/20 rounded-2xl mt-4 space-y-4">
            <label className="block text-sm font-black text-[#741F80] flex items-center gap-2">
              <MapPin size={18} /> เลือกพิกัดจัดเก็บ (Smart Selector)
            </label>
            <select value={selectedLocId} onChange={(e) => { setSelectedLocId(e.target.value); setSelectedZoneId(""); setSingleMaterial({...singleMaterial, locationCode: ""}); }} className="w-full bg-white border border-[#741F80]/30 rounded-lg px-4 py-2.5 font-bold text-slate-700 outline-none">
              <option value="">-- 1. เลือกคลัง/พื้นที่สนาม --</option>
              {locationsData.map(loc => <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>)}
            </select>
            <select value={selectedZoneId} onChange={(e) => { setSelectedZoneId(e.target.value); setSingleMaterial({...singleMaterial, locationCode: ""}); }} disabled={!selectedLocId} className="w-full bg-white border border-[#741F80]/30 rounded-lg px-4 py-2.5 font-bold text-slate-700 disabled:opacity-50 outline-none">
              <option value="">-- 2. เลือกชั้น/โซน --</option>
              {activeLocation?.zones?.map((z:any) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
            <select value={singleMaterial.locationCode} onChange={(e) => setSingleMaterial({...singleMaterial, locationCode: e.target.value})} disabled={!selectedZoneId} className="w-full bg-white border-2 border-[#741F80] rounded-lg px-4 py-2.5 font-black text-[#741F80] disabled:opacity-50 outline-none">
              <option value="">-- 3. เลือกช่องพิกัดสุดท้าย --</option>
              {bins.map((b:any) => <option key={b.id} value={b.code}>{b.code}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">หมายเหตุ</label>
            <textarea value={singleMaterial.remark} onChange={(e) => setSingleMaterial({...singleMaterial, remark: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#741F80] font-medium text-slate-800 h-20 resize-none" placeholder="ข้อมูลเพิ่มเติมอื่นๆ..." />
          </div>
        </div>
        
        {/* 📸 ปุ่มเพิ่มรูปภาพและพรีวิวภาพถ่ายจริง */}
        <div className="flex flex-col">
          <label className="block text-sm font-bold text-slate-700 mb-2">รูปภาพประกอบพัสดุ</label>
          
          {/* Input File หลบซ่อนเพื่อความหรูหรา */}
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-slate-50 border-2 border-dashed border-slate-300 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 min-h-[350px] relative overflow-hidden group hover:bg-[#741F80]/5 hover:border-[#741F80] transition-all cursor-pointer"
          >
            {imagePreview ? (
              // โชว์ภาพเมื่ออัปเสร็จ พร้อมปุ่มลบกากบาทมุมบน
              <div className="absolute inset-0 w-full h-full p-2 bg-white">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain rounded-2xl" />
                <button 
                  onClick={handleRemoveImage}
                  className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-md transition-colors z-20"
                  title="ลบรูปภาพนี้"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              // แสดงไอคอนให้กดแอดรูปภาพตอนแรก
              <div className="flex flex-col items-center p-6 text-center select-none">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400 group-hover:text-[#741F80] group-hover:scale-110 transition-all">
                  <UploadCloud size={32} />
                </div>
                <p className="font-black text-slate-700 mb-1 text-base">คลิกเพื่อเพิ่มรูปภาพพัสดุจริง</p>
                <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">รองรับไฟล์รูปภาพ PNG, JPG หรือ JPEG ขนาดไฟล์ห้ามเกิน 5MB</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <button onClick={handleSaveSingle} disabled={isSaving} className="bg-[#741F80] hover:bg-[#5b1865] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-md disabled:opacity-50">
          {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} บันทึกข้อมูลพัสดุ
        </button>
      </div>
    </div>
  );
}