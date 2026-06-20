"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { 
  FileSpreadsheet, UploadCloud, Download, 
  Edit3, CheckCircle2, RefreshCw, X, Loader2, XCircle 
} from "lucide-react";

export default function ExcelImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // ==========================================
  // 🌟 SMART POPUP SYSTEM 
  // ==========================================
  const [popup, setPopup] = useState<{ show: boolean; type: "loading" | "success" | "error"; message: string }>({
    show: false,
    type: "loading",
    message: ""
  });

  const showPopup = (type: "loading" | "success" | "error", message: string) => {
    setPopup({ show: true, type, message });
  };

  const closePopup = () => {
    setPopup({ ...popup, show: false });
  };

  // ==========================================
  // 📊 STATE & HANDLER: นำเข้า Excel 
  // ==========================================
  const [excelData, setExcelData] = useState<any[]>([]);
  const [isSavingExcel, setIsSavingExcel] = useState(false);

  const downloadTemplate = () => {
    const templateData = [
      {
        materialCode: "1030140011",
        description: "CLEVIS THIMBLE FOR PREFORMED DEADEND",
        thaiName: "ห่วงรองรับสายยึดโยง",
        specificTerm: "Clevis",
        placeOfWork: "สถานที่ปฏิบัติงาน กฟภ.ระโนด",
        locationCode: "คลังโปร่ง1-ชั้น1-B01",
        remark: "ตัวอย่างข้อความหมายเหตุ"
      },
      {
        materialCode: "1030140012",
        description: "SUSPENSION CLAMP ASSEMBLY",
        thaiName: "ประกับลูกถ้วยรับสาย",
        specificTerm: "Clamp",
        placeOfWork: "สถานที่ปฏิบัติงาน กฟภ.ระโนด",
        locationCode: "ลานกลางแจ้ง-R1-C3",
        remark: ""
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PEA_Template");
    XLSX.writeFile(wb, "PEA_Locator_Template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showPopup("loading", "กำลังอ่านข้อมูลจากไฟล์ Excel...");
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const formattedData = data.map((item: any) => ({
          materialCode: item.materialCode?.toString() || "",
          description: item.description?.toString() || "",
          thaiName: item.thaiName?.toString() || "",
          specificTerm: item.specificTerm?.toString() || "",
          placeOfWork: item.placeOfWork?.toString() || "สถานที่ปฏิบัติงาน กฟภ.ระโนด",
          locationCode: item.locationCode?.toString() || "",
          remark: item.remark?.toString() || ""
        }));

        setExcelData(formattedData);
        closePopup();
      } catch (err) {
        showPopup("error", "ไฟล์ Excel ชำรุดหรือไม่ถูกต้องตามรูปแบบ");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = ''; 
  };

  const handleTableEdit = (index: number, field: string, value: string) => {
    const newData = [...excelData];
    newData[index][field] = value;
    setExcelData(newData);
  };

  const handleSaveBulkExcel = async () => {
    if (excelData.length === 0) return;

    setIsSavingExcel(true);
    showPopup("loading", `กำลังนำเข้าข้อมูลพัสดุจำนวน ${excelData.length} รายการ...`);
    try {
      const res = await fetch("/api/materials/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materials: excelData }),
      });
      const data = await res.json();

      if (res.ok) {
        showPopup("success", `อัปเดตและนำเข้าข้อมูลสำเร็จทั้งหมด ${data.count} รายการ!`);
        setExcelData([]);
      } else {
        showPopup("error", data.error || "เกิดข้อผิดพลาดในการอัปโหลดแบบกลุ่ม");
      }
    } catch (error) {
      showPopup("error", "ระบบขัดข้อง ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSavingExcel(false);
    }
  };

  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto flex flex-col h-full">
      
      {/* 🔮 GLOBAL SMART POPUP OVERLAY */}
      {popup.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col items-center text-center transform transition-all animate-in zoom-in-95 duration-200 relative border border-slate-100">
            {popup.type !== "loading" && (
              <button onClick={closePopup} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            )}
            <div className="mb-6">
              {popup.type === "loading" && (
                <div className="relative">
                  <div className="absolute inset-0 bg-[#741F80]/20 rounded-full blur-xl animate-pulse"></div>
                  <Loader2 size={64} className="text-[#741F80] animate-spin relative z-10" />
                </div>
              )}
              {popup.type === "success" && (
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
                  <CheckCircle2 size={40} />
                </div>
              )}
              {popup.type === "error" && (
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 shadow-inner">
                  <XCircle size={40} />
                </div>
              )}
            </div>
            <h3 className={`text-2xl font-black mb-2 ${popup.type === "error" ? "text-red-600" : popup.type === "success" ? "text-emerald-600" : "text-[#741F80]"}`}>
              {popup.type === "loading" ? "กำลังดำเนินการ..." : popup.type === "success" ? "สำเร็จ!" : "เกิดข้อผิดพลาด"}
            </h3>
            <p className="text-slate-600 font-medium text-sm leading-relaxed mb-6">{popup.message}</p>
            {popup.type !== "loading" && (
              <button onClick={closePopup} className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all ${popup.type === "success" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}`}>
                ตกลง
              </button>
            )}
          </div>
        </div>
      )}

      {/* 📄 Header & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 mb-1 flex items-center gap-2">
            <FileSpreadsheet className="text-[#741F80]" /> ระบบนำเข้าข้อมูลด้วย Excel (Bulk Import)
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            อัปโหลดไฟล์ตาราง ตรวจสอบ แก้ไขข้อมูลสด และส่งบันทึกเข้าเซิร์ฟเวอร์แบบกลุ่ม
          </p>
        </div>
        
        <button 
          onClick={downloadTemplate} 
          className="bg-white hover:bg-slate-100 text-[#741F80] px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-slate-200 shadow-sm"
        >
          <Download size={16} /> ดาวน์โหลด Template (.xlsx)
        </button>
      </div>
      
      {/* ซ่อน input file ไว้ใช้กดอัปโหลด */}
      <input 
        type="file" 
        accept=".xlsx, .xls, .csv" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
      />

      {excelData.length === 0 ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 bg-white border-2 border-dashed border-slate-300 rounded-[2rem] shadow-sm flex flex-col items-center justify-center p-12 hover:bg-[#741F80]/5 hover:border-[#741F80]/40 transition-colors cursor-pointer group min-h-[400px]"
        >
          <div className="w-20 h-20 bg-[#741F80]/10 rounded-full flex items-center justify-center mb-6 text-[#741F80] group-hover:scale-110 transition-transform">
            <UploadCloud size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">คลิกเพื่ออัปโหลดไฟล์ Excel ของคุณ</h3>
          <p className="text-slate-500 font-medium text-center">ระบบรองรับไฟล์นามสกุลมาตรฐาน .xlsx และ .csv เท่านั้น</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Edit3 size={18} className="text-[#741F80]" /> ตารางตรวจสอบและแก้ไขคำ ({excelData.length} รายการที่ตรวจพบ)
            </h3>
            <button 
              onClick={() => setExcelData([])} 
              className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors border border-transparent hover:border-red-200"
            >
              ล้างค่าตาราง / เลือกไฟล์ใหม่
            </button>
          </div>

          <div className="overflow-x-auto p-4 max-h-[50vh]">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-[11px] uppercase tracking-widest font-black border-b border-slate-200">
                  <th className="p-3 rounded-tl-lg">รหัสพัสดุ</th>
                  <th className="p-3">ชื่อพัสดุอังกฤษ (Description)</th>
                  <th className="p-3">ชื่อพัสดุไทย</th>
                  <th className="p-3">ศัพท์เฉพาะ</th>
                  <th className="p-3 text-[#741F80] bg-[#741F80]/5 rounded-tr-lg">รหัสพิกัด (LocationCode)</th>
                </tr>
              </thead>
              <tbody>
                {excelData.map((row, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td className="p-1.5 w-40">
                      <input value={row.materialCode || ''} onChange={(e) => handleTableEdit(index, 'materialCode', e.target.value)} className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-[#741F80] focus:bg-white rounded px-2 py-1.5 outline-none text-sm font-semibold text-slate-800" />
                    </td>
                    <td className="p-1.5">
                      <input value={row.description || ''} onChange={(e) => handleTableEdit(index, 'description', e.target.value)} className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-[#741F80] focus:bg-white rounded px-2 py-1.5 outline-none text-sm text-slate-800" />
                    </td>
                    <td className="p-1.5">
                      <input value={row.thaiName || ''} onChange={(e) => handleTableEdit(index, 'thaiName', e.target.value)} className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-[#741F80] focus:bg-white rounded px-2 py-1.5 outline-none text-sm text-slate-700" />
                    </td>
                    <td className="p-1.5 w-32">
                      <input value={row.specificTerm || ''} onChange={(e) => handleTableEdit(index, 'specificTerm', e.target.value)} className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-[#741F80] focus:bg-white rounded px-2 py-1.5 outline-none text-sm text-slate-700" />
                    </td>
                    <td className="p-1.5 bg-[#741F80]/5 w-48">
                      <input value={row.locationCode || ''} onChange={(e) => handleTableEdit(index, 'locationCode', e.target.value)} className="w-full bg-white border border-[#741F80]/20 hover:border-[#741F80] focus:border-[#741F80] rounded px-2 py-1.5 outline-none text-sm font-bold text-[#741F80] shadow-sm" placeholder="ผูกรหัสพิกัดจัดเก็บ" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button 
              onClick={handleSaveBulkExcel}
              disabled={isSavingExcel}
              className="bg-[#741F80] hover:bg-[#5b1865] text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 w-full sm:w-auto"
            >
              {isSavingExcel ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              ยืนยันและบันทึกข้อมูลเข้าฐานข้อมูลจริง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}