import React, { useState, useEffect, useRef } from 'react';

interface Entry {
  entryName: string
  entryFunc: () => void
}

const MoreOptions: React.FC<{ entries?: Entry[] }> = ({ entries }) => {
  const [isOpen, setIsOpen] = useState(false);

  // 1. 修复点：添加 <HTMLDivElement> 类型定义
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 2. 修复点：给 event 添加 MouseEvent 类型
    const handleClickOutside = (event: MouseEvent) => {
      // 使用 as Node 强制转换类型，确保 contains 方法可用
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* 按钮部分 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 hover:cursor-pointer transition-colors focus:outline-none"
      >
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="text-gray-500"
        >
          {/* 这里是垂直的三个点 (Kebab Menu) */}
          <circle cx="12" cy="12" r="1" fill="currentColor" />
          <circle cx="12" cy="5" r="1" fill="currentColor" />
          <circle cx="12" cy="19" r="1" fill="currentColor" />
        </svg>
      </button>

      {/* 弹出的菜单 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 origin-top-right rounded-xl bg-white/80 backdrop-blur-sm shadow-xl ring-1 ring-black/5 z-[100] overflow-hidden border border-white/20">
          <div className="py-1">
            {entries?.map((entry) => {
              return (
                <>
                  <button
                    onClick={entry.entryFunc}
                    className="flex w-full items-center px-4 py-2 text-xs
                    text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                    {entry.entryName}
                  </button>
                </>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
};
export default MoreOptions
