"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  PackageSearch, PackagePlus, FileSpreadsheet, Map, 
  ShieldAlert, LogOut, MapPin, User, Lock, Loader2 
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // ==========================================
  // 🔐 STATE SYSTEM: ป้องกัน Hydration Mismatch
  // ==========================================
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [inputUsername, setInputUsername] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // อ่านค่าจาก LocalStorage เมื่อ Client โหลดเสร็จเท่านั้น
  useEffect(() => {
    setIsMounted(true);
    const authStatus = localStorage.getItem("pea_admin_auth");
    if (authStatus === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (inputUsername === "admin" && inputPassword === "1234") {
      localStorage.setItem("pea_admin_auth", "true");
      setIsLoggedIn(true);
      router.push("/admin"); // รีเฟรชชี้เป้าให้ชัวร์
    } else {
      setLoginError("❌ รหัสผู้ใช้งาน หรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  const handleLogout = () => {
    if (confirm("คุณต้องการออกจากระบบ Admin ใช่หรือไม่?")) {
      localStorage.removeItem("pea_admin_auth");
      setIsLoggedIn(false);
      setInputUsername("");
      setInputPassword("");
      router.push("/admin");
    }
  };

  // ⌛ รอเมาท์ฝั่ง Client ให้เสร็จ ป้องกันหน้าจอกะพริบ
  if (!isMounted) {
    return <div className="min-h-screen bg-slate-50"></div>;
  }

  // 🛑 หน้าต่างเข้าสู่ระบบ
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <form onSubmit={handleLogin} className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-xl max-w-md w-full space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-[#741F80]/10 rounded-full flex items-center justify-center text-[#741F80] mx-auto shadow-inner">
              <ShieldAlert size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-800">เข้าสู่ระบบ (Admin)</h3>
            <p className="text-xs font-semibold text-slate-400">เข้าถึงส่วนควบคุมระบบคลังและสนาม กฟภ.ระโนด</p>
          </div>

          {loginError && (
            <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-center text-xs font-bold text-red-600">
              {loginError}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="ชื่อผู้ใช้งาน"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-[#741F80] font-bold text-slate-700"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                placeholder="รหัสผ่าน"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-[#741F80] font-bold text-slate-700"
                required
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-[#741F80] hover:bg-[#5b1865] text-white py-3.5 rounded-xl font-black shadow-md transition-all text-sm">
            เข้าสู่ระบบจัดการ
          </button>
          
          <div className="text-center pt-2 border-t border-slate-100">
            <Link href="/" className="text-xs font-bold text-slate-400 hover:text-[#741F80] transition-colors">
              ← กลับสู่หน้าค้นหาปกติของผู้ใช้ทั่วไป
            </Link>
          </div>
        </form>
      </div>
    );
  }

  // ✅ แสดงโครงสร้าง Admin Dashboard (เมื่อล็อกอินสำเร็จ)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="bg-[#741F80] text-white px-6 py-4 shadow-md sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg"><ShieldAlert size={24} /></div>
            <div>
              <h1 className="text-lg font-black tracking-widest uppercase">Admin Management System</h1>
              <p className="text-[10px] font-medium text-white/70">ระบบจัดการคลังพัสดุ กฟภ.สาขาระโนด</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors"
          >
            <LogOut size={16} /> ออกจากระบบ Admin
          </button>
        </div>
      </nav>
      
      <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden min-h-[85vh] flex flex-col md:flex-row">
          
          {/* แถบเมนูด้านซ้าย */}
          <div className="w-full md:w-72 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col gap-2 flex-shrink-0">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-4">เมนูจัดการระบบ</h2>
            
            <Link href="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${pathname === "/admin" ? "bg-[#741F80] text-white shadow-md" : "text-slate-600 hover:bg-slate-200/50"}`}>
              <PackageSearch size={20} /> รายการพัสดุทั้งหมด
            </Link>
            <Link href="/admin/add" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${pathname === "/admin/add" ? "bg-[#741F80] text-white shadow-md" : "text-slate-600 hover:bg-slate-200/50"}`}>
              <PackagePlus size={20} /> เพิ่มพัสดุ (เดี่ยว)
            </Link>
            <Link href="/admin/excel" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${pathname === "/admin/excel" ? "bg-[#741F80] text-white shadow-md" : "text-slate-600 hover:bg-slate-200/50"}`}>
              <FileSpreadsheet size={20} /> นำเข้าข้อมูล (Excel)
            </Link>
            
            <div className="mt-4 mb-2"><h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4">ระบบสถานที่</h2></div>
            
            <Link href="/admin/locations-list" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${pathname === "/admin/locations-list" || pathname.startsWith("/admin/locations/") ? "bg-[#741F80] text-white shadow-md" : "text-slate-600 hover:bg-slate-200/50"}`}>
              <MapPin size={20} /> ดูและแก้ไขผังคลัง
            </Link>
            <Link href="/admin/locations" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${pathname === "/admin/locations" ? "bg-[#741F80] text-white shadow-md" : "text-slate-600 hover:bg-slate-200/50"}`}>
              <Map size={20} /> สร้างผังสถานที่ใหม่
            </Link>
          </div>

          {/* ส่วนเนื้อหาหลัก */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50/50">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}