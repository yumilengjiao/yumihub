import CommonCard from "@/components/CommonCard";
import { PathCard } from "@/components/PathCard";
import { Button } from "@/components/ui/button";
import { DatabaseBackup, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";

export default function ResourceSetting() {
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleQuickBackup = async () => {
    setIsBackingUp(true);
    const tid = toast.loading("正在执行全量备份...");
    try {
      await invoke("run_quick_backup"); // 假设后端有此指令
      toast.success("备份成功", { id: tid });
    } catch (e) {
      toast.error("备份失败: " + e, { id: tid });
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <CommonCard title="资源管理" icon="📂">
      <div className="space-y-4">
        <div className="space-y-1">
          <PathCard title="游戏存档备份目录" onSelect={() => console.log('')} />
          <PathCard title="游戏元数据存储目录" onSelect={() => console.log('')} />
        </div>

        <div className="pt-4 border-t border-zinc-100">
          <Button
            onClick={handleQuickBackup}
            disabled={isBackingUp}
            className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold gap-2 transition-all active:scale-[0.98]"
          >
            {isBackingUp ? <Loader2 className="animate-spin" /> : <DatabaseBackup size={18} />}
            立即执行一键备份
          </Button>
          <p className="text-[10px] text-zinc-400 mt-2 text-center font-medium">
            将所有游戏的本地存档与配置打包至备份目录
          </p>
        </div>
        <div className="pt-4 border-t border-zinc-100">
          <Button
            onClick={handleQuickBackup}
            disabled={isBackingUp}
            className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold gap-2 transition-all active:scale-[0.98]"
          >
            {isBackingUp ? <Loader2 className="animate-spin" /> : <DatabaseBackup size={18} />}
            一键还原存档
          </Button>
          <p className="text-[10px] text-zinc-400 mt-2 text-center font-medium">
            将所有游戏的本地存档还原到游戏
          </p>
        </div>

      </div>
    </CommonCard>
  );
}
