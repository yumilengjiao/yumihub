import { useEffect, useState, useRef } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { invoke } from "@tauri-apps/api/core";
import { cn } from "@/lib/utils";
import { t } from "@lingui/core/macro";
import { Quote, Camera, Clock, PencilLine, Check } from "lucide-react";
import { Screenshot } from "@/types/screenshot";

const GameJourney = ({ selectedYear, selectedMonth }: { selectedYear: number, selectedMonth: number }) => {
  const [snapshots, setSnapshots] = useState<Screenshot[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadSnapshots = async () => {
    setLoading(true);
    try {
      const data = await invoke<Screenshot[]>("get_screenshots_by_year_month", {
        year: selectedYear,
        month: selectedMonth
      });
      setSnapshots(data || []);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } catch (e) {
      console.error("Failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSnapshots(); }, [selectedYear, selectedMonth]);

  const handleUpdateThoughts = async (id: string, text: string) => {
    const original = snapshots.find(s => s.id === id)?.thoughts || "";
    if (text === original) { setEditingId(null); return; }
    try {
      await invoke("update_screenshot_by_id", { screenshotId: id, thoughts: text });
      setEditingId(null);
      setSnapshots(prev => prev.map(s => s.id === id ? { ...s, thoughts: text } : s));
    } catch (e) { console.error("Update failed:", e); }
  };

  if (!loading && snapshots.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center opacity-40 text-zinc-600">
        <Camera size={40} strokeWidth={1} className="mb-3" />
        <p className="text-sm font-bold">{t`暂无记录`}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-2xl">
      <div
        ref={scrollRef}
        /* 2. padding-x 移到这里，防止裁剪掉左右边框 */
        className="h-full overflow-y-auto mt-4 flex flex-col gap-10 pb-10 px-1 rounded-2xl
                   [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {snapshots.map((ss) => (
          <div key={ss.id} className="flex flex-col animate-in fade-in duration-700">

            {/* 感想区域 */}
            <div className="mb-4 relative">
              <div className="flex items-center gap-2 mb-2">
                <Quote size={18} className="text-black fill-black" />
                <span className="text-[12px] font-black uppercase tracking-widest text-zinc-400">Thought</span>
              </div>

              {editingId === ss.id ? (
                /* 3. 给 textarea 加上 animate-in fade-in */
                <textarea
                  autoFocus
                  className="w-full bg-white p-5 rounded-xl border-2 border-black outline-none text-[18px] font-black text-black leading-relaxed min-h-[140px] 
                             animate-in fade-in duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  defaultValue={ss.thoughts || ""}
                  onBlur={(e) => handleUpdateThoughts(ss.id, e.target.value)}
                />
              ) : (
                /* 4. 给显示态也加上动画，切换时更顺滑 */
                <div
                  onClick={() => setEditingId(ss.id)}
                  className="relative cursor-pointer bg-black/5 p-5 rounded-2xl hover:bg-black/[0.08] transition-colors group/text 
                             animate-in fade-in duration-300"
                >
                  <p className={cn(
                    "text-[20px] leading-[1.5] tracking-tight font-black transition-all",
                    ss.thoughts ? "text-black" : "text-zinc-400 italic"
                  )}>
                    {ss.thoughts || t`点击记录感想...`}
                  </p>
                  <PencilLine size={16} className="absolute top-4 right-4 text-black opacity-0 group-hover/text:opacity-100 transition-opacity" />
                </div>
              )}
            </div>

            {/* 图片区域 */}
            <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-black bg-white group/img">
              <img
                src={convertFileSrc(ss.filePath)}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/img:scale-105"
                alt="Snapshot"
              />

              <div className="absolute top-4 right-4 px-3 py-1 bg-black/70 backdrop-blur-md rounded-lg border border-white/20">
                <span className="text-[11px] text-white font-bold tracking-tighter">{ss.createdAt}</span>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="mt-10 flex justify-center">
              <div className="w-12 h-1 bg-zinc-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameJourney
