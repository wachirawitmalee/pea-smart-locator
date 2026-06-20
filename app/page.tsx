import SmartSearchBox from "@/components/search/SmartSearchBox";
import Link from "next/link";
import { ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 relative flex flex-col items-center pt-16 sm:pt-20 px-4 overflow-hidden font-sans">
      
      {/* 🛡️ แถบเมนูด้านบน - ปุ่มเข้าสู่ระบบ Admin */}
      <div className="absolute top-0 left-0 w-full p-4 sm:p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 text-[#741F80] font-black text-lg sm:text-xl">
          <div className="bg-[#741F80] text-white p-1.5 rounded-lg"><Zap size={20} fill="currentColor" /></div>
          PEA Smart Locator
        </div>
        <Link 
          href="/admin" 
          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full font-bold text-xs sm:text-sm hover:bg-emerald-100 transition shadow-sm border border-emerald-200"
        >
          <ShieldCheck size={16} /> <span className="hidden sm:inline">System Secured (Admin)</span><span className="sm:hidden">Admin</span>
        </Link>
      </div>

      <div className="w-full max-w-3xl text-center space-y-4 relative z-10">
        <div className="inline-flex items-center justify-center px-4 py-1.5 bg-white border border-[#741F80]/20 text-[#741F80] rounded-full text-[10px] font-black tracking-widest shadow-sm mb-2">
          <span className="w-2 h-2 rounded-full bg-[#741F80] animate-pulse mr-2"></span> AI-POWERED WAREHOUSE
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-800 tracking-tight leading-tight">
          ค้นหาพัสดุอัจฉริยะ<br/><span className="text-[#741F80]">รวดเร็ว และ แม่นยำ</span>
        </h1>
        
        <p className="text-slate-500 font-medium text-sm max-w-lg mx-auto">
          ยกระดับการจัดการคลัง กฟภ.สาขาระโนด ด้วยระบบนำทางที่ออกแบบมาเพื่อความคล่องตัวสูงสุด
        </p>
        
        <div className="mt-8 w-full max-w-2xl mx-auto relative z-50">
          <SmartSearchBox />
        </div>
      </div>
      
      {/* เอฟเฟกต์แสงตกแต่งพื้นหลัง */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#741F80]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
    </main>
  );
}