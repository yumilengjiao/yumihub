import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { t } from "@lingui/core/macro";
import { Plus, Trash2, CheckCircle2, Settings2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import useCompaionStore from "@/store/compaionStore";
import { Cmds } from "@/lib/enum";

export function CompanionManager({ onClose }: { onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 内部草稿状态
  const [localCompanions, setLocalCompanions] = useState<Companion[]>([]);
  const { updateCompanions } = useCompaionStore();

  useEffect(() => {
    const initData = async () => {
      try {
        const data = await invoke<Companion[]>(Cmds.GET_COMPAIONS);
        setLocalCompanions(data);
      } catch (error) {
        console.error("Fetch failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  // 核心更新函数：确保所有字段（包括 is_enabled）都能通过这个函数修改
  const handleUpdateField = (index: number, field: keyof Companion, value: any) => {
    setLocalCompanions(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handlePickFile = async (index: number) => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Executable', extensions: ['exe', 'cmd', 'bat', 'sh'] }]
    });

    if (selected && typeof selected === 'string') {
      const fileName = selected.split(/[\\/]/).pop()?.replace(/\.[^/.]+$/, "");
      setLocalCompanions(prev => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          path: selected,
          name: (next[index].name === '新程序' || !next[index].name) ? (fileName || next[index].name) : next[index].name
        };
        return next;
      });
    }
  };

  const handleAddNew = () => {
    const newItem: Companion = {
      name: '新程序',
      path: '',
      args: '',
      isEnabled: true, // 默认开启
      triggerMode: 'game',
      sortOrder: localCompanions.length + 1,
      description: ''
    };
    setLocalCompanions([...localCompanions, newItem]);
  };

  const handleRemove = (index: number) => {
    setLocalCompanions(localCompanions.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      await updateCompanions(localCompanions);
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/75 backdrop-blur-md p-6">
      <div className="w-full max-w-5xl h-[85vh] bg-white border border-zinc-200 rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">

        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-2 h-8 bg-emerald-500 rounded-full" />
            <h2 className="text-2xl font-black text-black tracking-tight flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-zinc-400" />
              {t`连携程序管理`}
            </h2>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black transition-all active:scale-90 text-2xl">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-zinc-50/40 custom-scrollbar">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-zinc-400 font-bold tracking-widest uppercase">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
              {t`Loading Configuration...`}
            </div>
          ) : localCompanions.map((item, index) => (
            <div key={index} className={cn(
              "group relative bg-white border rounded-3xl p-8 shadow-sm transition-all duration-300",
              item.isEnabled ? "border-zinc-200 hover:border-emerald-300" : "border-zinc-100 grayscale opacity-60"
            )}>

              {/* 删除按钮 */}
              <button
                onClick={() => handleRemove(index)}
                className="absolute top-4 right-4 w-10 h-10 bg-zinc-100 hover:bg-red-500 text-zinc-400 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md active:scale-90"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <input
                  className="text-2xl font-black text-black bg-transparent outline-none border-b-2 border-transparent focus:border-emerald-500 transition-all flex-1 py-1"
                  value={item.name}
                  onChange={(e) => handleUpdateField(index, 'name', e.target.value)}
                  placeholder={t`程序名称`}
                />

                <div className="flex items-center gap-4">
                  {/* 触发模式：随程序/随游戏 */}
                  <div className="flex bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200">
                    <button
                      onClick={() => handleUpdateField(index, 'triggerMode', 'app')}
                      className={cn(
                        "px-6 py-2 text-xs font-black rounded-xl transition-all",
                        item.triggerMode === 'app' ? "bg-black text-white shadow-lg" : "text-zinc-400 hover:text-black"
                      )}
                    >
                      {t`随程序启动`}
                    </button>
                    <button
                      onClick={() => handleUpdateField(index, 'triggerMode', 'game')}
                      className={cn(
                        "px-6 py-2 text-xs font-black rounded-xl transition-all",
                        item.triggerMode === 'game' ? "bg-emerald-500 text-white shadow-lg" : "text-zinc-400 hover:text-emerald-500"
                      )}
                    >
                      {t`随游戏启动`}
                    </button>
                  </div>

                  <div className="h-8 w-px bg-zinc-200 mx-2" />

                  {/* 【核心补全】is_enabled 开关 */}
                  <label className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-colors">
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">{item.isEnabled ? t`已启用` : t`已禁用`}</span>
                    <input
                      type="checkbox"
                      checked={item.isEnabled}
                      // 这里通过 e.target.checked 正确修改 is_enabled
                      onChange={(e) => handleUpdateField(index, 'isEnabled', e.target.checked)}
                      className="w-6 h-6 accent-emerald-500 cursor-pointer rounded-lg"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* 路径 */}
                <div className="md:col-span-12 space-y-2">
                  <label className="text-zinc-400 font-black text-[10px] uppercase ml-1 tracking-[0.2em]">{t`可执行文件路径`}</label>
                  <div className="relative group/path">
                    <input
                      readOnly
                      onClick={() => handlePickFile(index)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-black font-bold text-sm cursor-pointer hover:bg-zinc-100 transition-all outline-none pr-24"
                      value={item.path}
                      placeholder={t`点击选择文件...`}
                    />
                    <div className="absolute right-5 top-4 text-emerald-600 font-black text-xs pointer-events-none bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase">
                      {t`浏览`}
                    </div>
                  </div>
                </div>

                {/* 参数 */}
                <div className="md:col-span-8 space-y-2">
                  <label className="text-zinc-400 font-black text-[10px] uppercase ml-1 tracking-[0.2em]">{t`启动参数`}</label>
                  <input
                    className="w-full border border-zinc-200 rounded-2xl px-5 py-4 text-black text-sm font-bold focus:border-emerald-500 bg-white outline-none transition-all shadow-inner"
                    value={item.args}
                    onChange={(e) => handleUpdateField(index, 'args', e.target.value)}
                  />
                </div>

                {/* 权重 */}
                <div className="md:col-span-4 space-y-2">
                  <label className="text-zinc-400 font-black text-[10px] uppercase ml-1 tracking-[0.2em]">{t`排序`}</label>
                  <input
                    type="number"
                    className="w-full border border-zinc-200 rounded-2xl px-5 py-4 text-black text-sm font-bold focus:border-emerald-500 bg-white outline-none transition-all shadow-inner"
                    value={item.sortOrder}
                    onChange={(e) => handleUpdateField(index, 'sortOrder', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          )
          )}

          <button
            onClick={handleAddNew}
            className="w-full py-16 border-2 border-dashed border-emerald-200 rounded-[32px] text-emerald-600 hover:bg-emerald-50 hover:border-emerald-500 transition-all flex flex-col items-center justify-center gap-4 group bg-white/40 mb-10"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-500">
              <Plus className="w-8 h-8" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase">{t`添加新程序`}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-8 py-8 border-t border-zinc-100 flex justify-end gap-5 bg-white sticky bottom-0">
          <button
            onClick={onClose}
            className="px-10 py-5 rounded-2xl font-black text-zinc-400 hover:text-black hover:bg-zinc-50 transition-all active:scale-95"
          >
            {t`取消`}
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-16 py-5 rounded-2xl font-black bg-black text-white hover:bg-emerald-600 disabled:bg-zinc-300 transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] active:scale-95 flex items-center gap-3 group"
          >
            {isSaving ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <CheckCircle2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
            )}
            <span className="text-lg">{t`保存全部配置`}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
