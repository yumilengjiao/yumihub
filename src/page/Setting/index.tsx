import BaseSetting from "./BaseSetting";
import InterfaceSetting from "./InterfaceSetting";
import SysSetting from "./SysSetting";
import ResourceSetting from "./ResourceSetting";

export default function Setting() {
  return (
    <div className="h-full flex justify-center items-center bg-zinc-300">
      <div className="grid grid-cols-6 h-full w-[90vw] gap-4 mt-40 auto-rows-[calc((90vh-1rem)/4)] overflow-y-auto">
        <BaseSetting />
        <InterfaceSetting />
        <SysSetting />
        <ResourceSetting />
      </div>
    </div >
  )
}

