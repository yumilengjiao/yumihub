import { useEffect, useState } from "react";
import ProgressBar from "./ProgressBar";
import { listen } from "@tauri-apps/api/event";

interface SysParam {
  diskUsage: number
}


export default function SysMonitor({ diskUsage }: SysParam) {
  console.log("传入的磁盘使用率: ", diskUsage)

  const [data, setData] = useState<SystemStats | null>(null)

  useEffect(() => {
    // 开启监听
    const unlisten = listen<SystemStats>("sys-monitor", (event) => {
      // event.payload 就是后端传过来的数据
      console.log("收到系统数据:", event.payload);
      setData(event.payload);
    });

    // 清理函数
    return () => {
      unlisten.then((f) => f());
    };
  }, []);


  return (
    <div className="h-full w-full flex flex-col gap-5">
      <ProgressBar label="CPU" value={Math.round((data?.cpu_usage || 0) * 100) / 100 || 0} />
      <ProgressBar label="Memory" value={Math.round((data?.memory_usage || 0) * 100) / 100 || 0} />
      <ProgressBar label="DISK" value={Math.round((diskUsage || 0) * 100) / 100 || 0} />
    </div>
  )
}

