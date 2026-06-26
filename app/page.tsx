import SmartSearchBox from "@/components/search/SmartSearchBox";
import Link from "next/link";
import { 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  MapPin, 
  Package, 
  BarChart3 
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#f8f6ff] via-[#f1eeff] to-[#e6e0ff] font-sans pb-20">
      
      {/* =========================================
          🎨 SECTION 1: เลเยอร์กราฟิกพื้นหลัง (แก้ไข Z-index ให้แสดงผลแล้ว)
          ========================================= */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        
        {/* 1. ลายจุด (Dot Matrix Pattern) */}
        <div className="absolute top-[10%] right-[5%] w-[300px] h-[300px] bg-[radial-gradient(#c4b5fd_2px,transparent_2px)] [background-size:24px_24px] opacity-60"></div>
        <div className="absolute bottom-[20%] left-[2%] w-[250px] h-[250px] bg-[radial-gradient(#c4b5fd_2px,transparent_2px)] [background-size:24px_24px] opacity-50"></div>

        {/* 2. แสงฟุ้งสีม่วง (Glow Blobs) */}
        <div className="absolute top-[-20%] left-[10%] w-[50%] h-[60%] bg-purple-200/70 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[70%] bg-[#741F80]/10 rounded-full blur-[120px]"></div>

        {/* 3. ประกายดาววิบวับ (Sparkles) */}
        <Sparkles className="absolute top-[25%] left-[20%] text-purple-400 opacity-70 animate-pulse" size={24} />
        <Sparkles className="absolute top-[35%] right-[22%] text-purple-400 opacity-60 animate-pulse delay-300" size={32} />
        <Sparkles className="absolute bottom-[40%] left-[30%] text-[#741F80] opacity-40 animate-pulse delay-700" size={16} />

        {/* 4. เส้นประนำทาง (Dotted Route Line) */}
        <svg className="absolute bottom-[15%] left-0 w-full h-[300px] overflow-visible opacity-70">
          <path d="M 150,200 Q 300,300 500,150 T 900,250 T 1300,150" fill="none" stroke="#b4a6e2" strokeWidth="3" strokeDasharray="8,8"></path>
        </svg>

        {/* 5. กราฟิกจำลองชั้นวางของพัสดุ (Bottom Left Mockup) */}
        <div className="absolute bottom-[-2%] left-[2%] md:left-[5%] w-[250px] h-[280px] hidden md:block opacity-100">
          {/* โครงชั้นวาง */}
          <div className="absolute bottom-0 left-4 w-[160px] h-[200px] bg-white/60 backdrop-blur-md border border-white rounded-xl shadow-xl flex flex-col justify-end p-3 transform -rotate-3">
            <div className="w-full h-3 bg-white rounded mb-8 shadow-sm"></div>
            <div className="w-full h-3 bg-white rounded mb-8 shadow-sm"></div>
            <div className="w-full h-3 bg-white rounded shadow-sm"></div>
            
            {/* กล่องพัสดุบนชั้น */}
            <div className="absolute bottom-10 left-4 w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 border border-white rounded-lg shadow-md flex items-center justify-center text-purple-400"><Package size={28}/></div>
            <div className="absolute bottom-[100px] right-4 w-14 h-14 bg-gradient-to-br from-indigo-50 to-indigo-100 border border-white rounded-lg shadow-md flex items-center justify-center text-indigo-400"><Package size={24}/></div>
          </div>
          {/* กล่องบนพื้นและหมุด */}
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-[#f3e8ff] to-[#eaddff] border-2 border-white rounded-xl shadow-lg flex items-center justify-center text-[#741F80]/40 transform rotate-6"><Package size={40}/></div>
          <div className="absolute bottom-28 right-6 text-[#741F80] animate-bounce drop-shadow-md"><MapPin size={40} fill="currentColor" className="text-purple-300"/></div>
        </div>

        {/* 6. กราฟิกจำลองแผนที่ 3D (Bottom Right Mockup) */}
        <div className="absolute bottom-[-10%] right-[-5%] md:right-[2%] w-[500px] h-[350px] hidden lg:block opacity-100">
          {/* ฐานแผนที่เอียง 3D */}
          <div className="absolute bottom-10 right-10 w-[400px] h-[250px] bg-gradient-to-tr from-[#e5dcff] to-[#f4f0ff] backdrop-blur-xl border-[6px] border-white rounded-[2.5rem] shadow-2xl transform rotate-12 skew-x-12 p-6 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.9)_4px,transparent_4px),linear-gradient(90deg,rgba(255,255,255,0.9)_4px,transparent_4px)] bg-[size:40px_40px]"></div>
            {/* เส้นทางบนแผนที่ */}
            <svg className="absolute inset-0 w-full h-full overflow-visible"><path d="M 100,50 L 100,150 L 250,150 L 250,80 L 350,80" fill="none" stroke="#741F80" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"></path></svg>
            <div className="absolute top-[80px] left-[250px] text-[#741F80] transform -translate-x-1/2 -translate-y-full drop-shadow-xl"><MapPin size={64} fill="currentColor" className="text-purple-200"/></div>
          </div>
          
          {/* แดชบอร์ดลอยตัว */}
          <div className="absolute top-5 right-[250px] w-[200px] bg-white/95 backdrop-blur-md border-2 border-white rounded-2xl shadow-xl p-5 transform -rotate-6 flex flex-col gap-4">
            <div className="flex gap-3 items-center">
              <div className="w-10 h-8 bg-slate-100 rounded-lg flex items-center justify-center"><BarChart3 size={16} className="text-slate-400"/></div>
              <div className="space-y-1.5 w-full"><div className="w-full h-2.5 bg-slate-200 rounded-full"></div><div className="w-2/3 h-2.5 bg-slate-200 rounded-full"></div></div>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#10b981] self-end flex items-center justify-center text-white shadow-md border-2 border-white"><ShieldCheck size={14}/></div>
          </div>
        </div>
      </div>

      {/* =========================================
          📑 SECTION 2: เนื้อหาหลักของหน้าเว็บ (Main Content)
          ========================================= */}
      
      <div className="relative z-10">
        
        {/* 🟢 แถบเมนูด้านบน (Top Navigation Bar) */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2.5 text-[#741F80] font-black text-lg sm:text-xl tracking-tight drop-shadow-sm">
            <div className="bg-[#741F80] text-white p-2 rounded-xl shadow-md shadow-[#741F80]/20">
              <Zap size={22} fill="currentColor" />
            </div>
            Material Navigate System
          </div>
          
          <Link 
            href="/admin" 
            className="flex items-center gap-2 px-5 py-2.5 bg-[#eafbfa] text-[#059669] rounded-full font-black text-xs sm:text-sm hover:bg-[#d1f4f0] transition-all shadow-md border border-[#a7f3d0] hover:scale-105"
          >
            <ShieldCheck size={18} /> <span className="hidden sm:inline">Admin</span><span className="sm:hidden">Admin</span>
          </Link>
        </nav>

        {/* 🟣 ส่วนต้อนรับ (Hero Section) */}
        <div className="w-full max-w-4xl text-center space-y-5 mx-auto pt-8 sm:pt-12 px-4 flex flex-col items-center">
          
          {/* ป้าย Pill ด้านบน */}
          <div className="inline-flex items-center justify-center px-5 py-2 bg-white/90 backdrop-blur-sm border border-white rounded-full text-[11px] font-black tracking-widest shadow-sm text-[#741F80]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#741F80] mr-2.5 shadow-sm"></span> 
            AI-POWERED WAREHOUSE
          </div>
          
          {/* หัวข้อหลัก */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-[#1e293b] tracking-tight leading-[1.1] drop-shadow-sm mt-4">
            ค้นหาพัสดุอัจฉริยะ<br/>
            <span className="text-[#741F80]">รวดเร็ว</span> และ <span className="text-[#741F80]">แม่นยำ</span>
          </h1>
          
          {/* คำอธิบาย */}
          <p className="text-slate-600 font-bold text-sm sm:text-base max-w-xl mx-auto opacity-90 mt-4">
            ยกระดับการจัดการคลัง PEA สู่ความสะดวก ด้วยระบบนำทางที่ออกแบบมาเพื่อความคล่องตัว
          </p>
          
          {/* 🔍 กล่องค้นหา SmartSearchBox Component */}
          <div className="mt-10 w-full max-w-3xl mx-auto relative group">
            {/* เอฟเฟกต์แสงเงาเรืองแสงรอบกล่องค้นหา */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#741F80]/20 to-purple-400/20 rounded-[2.5rem] blur-xl opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative drop-shadow-2xl">
              {/* ใช้ Component เดิมของคุณที่รองรับการค้นหาจริงอยู่แล้ว */}
              <SmartSearchBox />
            </div>
          </div>
        </div>
      </div>
      
    </main>
  );
}