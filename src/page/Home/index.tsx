import { useThemeStore } from '@/store/themeStore'
import './index.css'
import { Surface } from "@/components/custom/Surface"
import { Trans } from '@lingui/react/macro';


export default function Home() {
  const { theme } = useThemeStore();

  // 获取当前页面的配置
  const pageConfig = theme?.layout.pages["/"];
  const pageContent = pageConfig?.content;

  // 如果主题还没加载完，显示加载动画或骨架屏
  if (!theme) {
    return <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
      Loading Theme...
    </div>;
  }

  return (
    <div className="home relative w-full h-full overflow-hidden">
      {/* 渲染页面内容层 */}
      <main className="relative z-10 w-full h-full">
        {pageContent ? (
          <Surface node={pageContent} />
        ) : (
          <div className="text-red-500 p-10"><Trans>页面内容未定义：请检查 "/" 路径配置</Trans></div>
        )}
      </main>
    </div>
  );
}
