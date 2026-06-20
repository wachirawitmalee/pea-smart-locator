import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center border border-slate-100">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-[#741F80]/20 rounded-full blur-xl animate-pulse"></div>
          <Loader2 size={64} className="text-[#741F80] animate-spin relative z-10" />
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-2">กำลังโหลดข้อมูล...</h3>
        <p className="text-slate-500 font-medium text-sm">กรุณารอสักครู่ ระบบกำลังประมวลผลและดึงข้อมูล</p>
      </div>
    </div>
  );
}