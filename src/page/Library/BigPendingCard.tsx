import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, X, Check, FileText, WifiOff } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// 子组件：游戏标签
const GameTag = ({ text }: { text: string }) => (
  <Badge className="px-3 py-1 text-[10px] font-black bg-zinc-100 text-zinc-500 border-none rounded-lg tracking-tight">
    {text}
  </Badge>
);

interface BigPendingCardProps {
  absPath: string;
  onConfirm: (data: any) => void;
  onCancel: () => void;
}

const BigPendingCard: React.FC<BigPendingCardProps> = ({ absPath, onConfirm, onCancel }) => {
  // 状态管理
  const [isFetching, setIsFetching] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [activeSource, setActiveSource] = useState<'vndb' | 'bangumi' | 'ymgal'>('vndb');

  // Ref 用于处理超时逻辑，避免闭包陷阱
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRequestingRef = useRef(false);

  // 1. 处理路径名
  const extractedName = useMemo(() => {
    const parts = absPath.split(/[\\/]/).filter(Boolean);
    return parts.length >= 2 ? parts[parts.length - 2] : parts[0] || "Unknown";
  }, [absPath]);

  // 2. 模拟匹配请求 (你需要把这里的模拟逻辑替换成你真实的 API 请求)
  const handleFetchMetadata = async () => {
    setIsFetching(true);
    isRequestingRef.current = true;

    // --- 开启 60 秒倒计时 ---
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (isRequestingRef.current) {
        // 时间到，还没拿数据，强行终止
        setIsFetching(false);
        isRequestingRef.current = false;

        toast.error("元数据匹配超时", {
          description: "未能在一分钟内获取数据，请检查网络设置或重试。",
          duration: 5000,
          icon: <WifiOff className="text-red-500" size={18} />,
        })

        // 重置状态
        setResultData(null);
      }
    }, 60000);

    try {
      // 这里替换成你的请求：const res = await yourApiCall(extractedName);
      // 以下是模拟数据流程：
      const mockResponse = {
        name: extractedName,
        cover: "https://pic.imgdb.cn/item/64cb5d541ddac8892233f2c5.jpg", // 示例图
        desc: "这是一段模拟的游戏简介。如果你的 API 返回了真实数据，请将 setResultData 设置为 API 的返回结果。此组件会自动根据数据的存在与否来“炸开”卡片布局。",
        tags: ["Visual Novel", "High Quality", "Classic"]
      };

      // 模拟网络延迟 2 秒
      await new Promise(resolve => setTimeout(resolve, 61000));

      // 如果还没超时，就设置数据
      if (isRequestingRef.current) {
        setResultData(mockResponse);
        setIsFetching(false);
        isRequestingRef.current = false;
        if (timerRef.current) clearTimeout(timerRef.current);
      }
    } catch (err) {
      setIsFetching(false);
      isRequestingRef.current = false;
      toast.error("请求发生错误");
    }
  };

  // 3. 彻底取消或重置
  const handleCancelAll = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    isRequestingRef.current = false;
    setIsFetching(false);
    setResultData(null);
    onCancel();
  };

  // 组件卸载清理
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-6xl pointer-events-none">
      <motion.div
        layout
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="pointer-events-auto bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] rounded-[32px] overflow-hidden border border-zinc-100"
      >
        <motion.div layout>
          {/* --- 顶部：极致扁平态 (h-20) --- */}
          <div className="h-20 px-8 flex items-center justify-between gap-10">
            <div className="flex items-center gap-5 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shrink-0">
                <FileText size={28} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-black text-zinc-900 leading-none tracking-tighter uppercase truncate">
                  {extractedName}
                </h2>
                <p className="text-zinc-400 font-mono text-[10px] truncate mt-1.5 font-bold opacity-60">
                  {absPath}
                </p>
              </div>
            </div>

            {/* 操作区 */}
            <div className="flex items-center gap-2 shrink-0">
              <AnimatePresence mode="wait">
                {isFetching ? (
                  <motion.div
                    key="loading" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-3 bg-zinc-50 border border-zinc-100 py-2 px-5 rounded-xl"
                  >
                    <Loader2 className="animate-spin text-zinc-900" size={20} strokeWidth={4} />
                    <span className="font-black text-xs text-zinc-900 tracking-widest uppercase">Matching...</span>
                    <Button variant="ghost" size="icon" onClick={handleCancelAll} className="w-8 h-8 rounded-full"><X size={16} /></Button>
                  </motion.div>
                ) : !resultData ? (
                  <motion.div key="btns" className="flex items-center gap-2">
                    <Button variant="ghost" onClick={handleCancelAll} className="h-12 px-5 text-sm font-black text-zinc-400">取消</Button>
                    <Button onClick={handleFetchMetadata} variant="outline" className="h-12 px-7 border-2 border-zinc-100 rounded-xl font-black text-sm gap-2">
                      <Search size={18} strokeWidth={3} /> 匹配元数据
                    </Button>
                    <Button onClick={() => onConfirm({ name: extractedName, absPath })} className="h-12 px-8 bg-zinc-900 text-white rounded-xl font-black text-sm gap-2 shadow-lg">
                      <Check size={18} strokeWidth={3} /> 直接确认
                    </Button>
                  </motion.div>
                ) : (
                  <Button variant="ghost" size="icon" onClick={handleCancelAll} className="w-12 h-12 rounded-full hover:bg-zinc-100"><X size={24} className="text-zinc-400" /></Button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* --- 下部：展开展示区 (只有数据到了才炸开) --- */}
          <AnimatePresence>
            {resultData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-8 pb-10 pt-4 border-t-2 border-zinc-50"
              >
                <div className="flex gap-10">
                  <motion.div
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    className="w-64 h-80 shrink-0 rounded-[32px] overflow-hidden shadow-2xl border-4 border-white"
                  >
                    <img src={resultData.cover} className="w-full h-full object-cover" alt="cover" />
                  </motion.div>

                  <div className="flex-1 flex flex-col pt-2">
                    <div className="flex justify-between items-start mb-5">
                      <div className="space-y-3">
                        <h3 className="text-4xl font-black text-zinc-900 leading-none tracking-tighter uppercase italic">{resultData.name}</h3>
                        <div className="flex gap-2">{resultData.tags.map((t: string) => <GameTag key={t} text={t} />)}</div>
                      </div>
                      <div className="flex bg-zinc-100 p-1.5 rounded-xl shrink-0">
                        {['vndb', 'bangumi', 'ymgal'].map(src => (
                          <button key={src} onClick={() => setActiveSource(src as any)} className={cn("px-4 py-2 text-[10px] font-black rounded-lg uppercase", activeSource === src ? "bg-white shadow-sm text-zinc-900" : "text-zinc-400")}>{src}</button>
                        ))}
                      </div>
                    </div>

                    <ScrollArea className="flex-1 bg-zinc-50/50 rounded-[24px] p-6 mb-8 border border-zinc-100/50">
                      <p className="text-base leading-relaxed text-zinc-500 font-bold italic">{resultData.desc}</p>
                    </ScrollArea>

                    <div className="flex justify-end gap-3">
                      <Button onClick={() => onConfirm({ ...resultData, absPath })} className="h-20 px-14 bg-green-500 hover:bg-green-600 text-white rounded-[24px] font-black text-3xl gap-4 shadow-2xl shadow-green-100 transition-all active:scale-95">
                        <Check size={40} strokeWidth={6} /> 确认添加
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default BigPendingCard;
