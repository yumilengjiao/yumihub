import { Sun, Moon, Sunrise, Sunset, Coffee, Sparkles } from 'lucide-react';
import { t } from "@lingui/core/macro"

const ProfileHeader = ({ username }: { username: string }) => {
  // 获取当前时间段和问候语
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 11) return { text: t`早上好`, sub: t`新的一天，也要充满元气哦！`, icon: <Sunrise className="w-8 h-8 text-orange-400" /> };
    if (hour >= 11 && hour < 14) return { text: t`中午好`, sub: t`午饭吃了吗？记得休息一下。`, icon: <Sun className="w-8 h-8 text-yellow-500" /> };
    if (hour >= 14 && hour < 18) return { text: t`下午好`, sub: t`来杯咖啡吧，又是努力的一天。`, icon: <Coffee className="w-8 h-8 text-amber-600" /> };
    if (hour >= 18 && hour < 22) return { text: t`晚上好`, sub: t`辛苦了，开启一段精彩的故事吧。`, icon: <Sunset className="w-8 h-8 text-rose-400" /> };
    return { text: `晚安`, sub: t`夜深了，推完这节就快去睡觉吧。`, icon: <Moon className="w-8 h-8 text-indigo-400" /> };
  }

  const greeting = getGreeting();

  // 随机小贴士（每次刷新都会变）
  const tips = [
    t`记得多看几遍喜欢的剧情，会有新发现哦。`,
    t`"存档是 Gal 玩家的生命线，记得备份。"`,
    t`全线通关后的后劲，是青春的证明。`,
    t`今天的心情适合推一部催泪神作吗？`,
    t`劳逸结合，眼睛也需要休息呢。`
  ];
  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  return (
    <div className="w-full h-full flex flex-col justify-center px-10 py-6 pt-0 relative overflow-hidden rounded-2xl">

      <div className="flex items-center gap-6">
        {/* 左侧：动态图标 */}
        <div className="p-4 bg-zinc-200 dark:bg-zinc-100 rounded-2xl border border-zinc-100/20 shadow-sm">
          {greeting.icon}
        </div>

        {/* 右侧：文字信息 */}
        <div >
          <div className="flex items-baseline gap-2">
            <h1 className="font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {greeting.text}，{username}
            </h1>
          </div>
          <p className="text-sm text-zinc-500 font-medium">
            {greeting.sub}
          </p>
        </div>
      </div>

      {/* 底部小玩意：今日 Tips / 状态 */}
      <div className="mt-3 pt-6 border-t border-zinc-50/20 flex items-center gap-2">
        <div className="px-2 py-1 bg-amber-50 dark:bg-zinc-800 rounded text-amber-600">
          <Sparkles className="w-3 h-3" />
        </div>
        <span className="text-[11px] text-zinc-400 font-medium tracking-wide italic">
          Tip: {randomTip}
        </span>
      </div>
    </div >
  )
}
export default ProfileHeader
