"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; 
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, PackageOpen, Tag, ImageIcon, Sparkles, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function SmartSearchBox() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const router = useRouter(); 

  const { data: results, isFetching } = useQuery({
    queryKey: ["materials", debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm) return [];
      const res = await fetch(`/api/materials/search?q=${debouncedSearchTerm}`);
      return res.json();
    },
    enabled: debouncedSearchTerm.length > 0,
  });

  const isSearching = debouncedSearchTerm.length > 0;
  const materialsList = Array.isArray(results) ? results : [];

  return (
    <div className="relative w-full z-[100] transition-all duration-500">
      <div className={`relative bg-white/95 backdrop-blur-xl border transition-all duration-300 ease-out flex items-center px-2 py-2 mx-auto ${isFocused || isSearching ? 'border-[#741F80]/30 shadow-lg rounded-t-[2rem] rounded-b-none' : 'border-slate-200 shadow-sm rounded-[2rem] hover:shadow-md'}`}>
        <div className="absolute left-5 pointer-events-none">
          {isFetching ? <Loader2 className="h-5 w-5 text-[#741F80] animate-spin" /> : <Search className={`h-5 w-5 transition-colors ${isFocused ? 'text-[#741F80]' : 'text-slate-400'}`} />}
        </div>
        <input
          type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onFocus={() => setIsFocused(true)} onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="flex-1 bg-transparent border-none outline-none text-base font-bold text-slate-800 placeholder:text-slate-400 w-full text-center px-12 py-1"
          placeholder="พิมพ์รหัสพัสดุ หรือ คำค้นหา..." autoComplete="off" spellCheck="false"
        />
        <div className="absolute right-3 hidden sm:flex items-center justify-center p-1.5 bg-slate-50 rounded-full border border-slate-100 text-[#741F80]"><Sparkles size={14} /></div>
      </div>

      {/* 📜 ล็อกความสูงไว้ที่ 55vh และบังคับให้สกอร์บาร์ทำงานด้านใน */}
      <div className={`absolute top-full left-0 right-0 bg-white/95 backdrop-blur-2xl border-x border-b border-slate-200/80 rounded-b-[2rem] shadow-2xl overflow-hidden transition-all duration-300 origin-top flex flex-col ${isSearching && !isFetching ? 'max-h-[55vh] opacity-100 scale-y-100' : 'max-h-0 opacity-0 scale-y-95 pointer-events-none'}`}>
        <div className="p-3 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          {materialsList.length === 0 ? (
             <div className="py-10 text-center flex flex-col items-center justify-center">
               <PackageOpen size={32} className="text-slate-300 mb-3" />
               <p className="text-sm font-bold text-slate-700">ไม่พบรายการพัสดุ</p>
             </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ผลลัพธ์การค้นหา</span>
                <span className="bg-[#741F80]/10 text-[#741F80] text-[10px] font-bold px-2 py-0.5 rounded-md">พบ {materialsList.length} รายการ</span>
              </div>
              <div className="grid gap-2 pb-2">
                {materialsList.map((material: any) => (
                  <button 
                    key={material.id} 
                    onClick={() => router.push(`/materials/${material.id}`)}
                    className="w-full text-left group relative bg-white border border-slate-100 rounded-xl p-3 hover:border-[#741F80]/40 hover:shadow-md transition-all duration-300 flex flex-row items-center gap-3"
                  >
                    {/* ย่อขนาดรูปภาพให้เล็กลง */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-slate-100 overflow-hidden">
                       {material.imageUrl ? <img src={material.imageUrl} alt={material.materialCode} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 mb-0.5">
                         <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{material.materialCode}</span>
                       </div>
                       {/* ย่อขนาดฟอนต์ */}
                       <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-[#741F80] transition-colors">{material.description}</h3>
                       <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 font-medium truncate">{material.thaiName || "-"}</span>
                          {material.specificTerm && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-600"><Tag size={8} className="text-slate-400" /> {material.specificTerm}</span>}
                       </div>
                    </div>
                    {/* ป้ายพิกัดแบบกระชับ */}
                    <div className="flex flex-col items-end shrink-0 pl-2">
                       <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">พิกัดจัดเก็บ</span>
                       <div className="flex items-center gap-1 bg-[#741F80] text-white px-2 py-1 rounded-md shadow-sm"><MapPin size={12} /><span className="text-xs font-bold">{material.bin?.code || "N/A"}</span></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}