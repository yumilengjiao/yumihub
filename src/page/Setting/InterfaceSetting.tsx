import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-dialog"
import { convertFileSrc } from "@tauri-apps/api/core"
import { Upload, Trash2, Crop as CropIcon } from "lucide-react"
import { t } from "@lingui/core/macro"
import useConfigStore from "@/store/configStore"
import { Cmds } from "@/lib/enum"
import { SelectRow, SliderRow } from "@/components/common/SettingRow"
import type { SelectOption } from "@/components/common/SettingRow"
import { SettingSection } from "./SettingSection"
import { cn } from "@/lib/utils"
import type { BackgroundCrop } from "@/types/config"
import { createBackgroundImageStyle, normalizeBackgroundCrop } from "@/lib/background"

export default function InterfaceSetting() {
  const { config, updateConfig } = useConfigStore()
  const [fonts, setFonts] = useState<SelectOption[]>([{ label: t`系统默认`, value: "sys" }])
  const [themes, setThemes] = useState<SelectOption[]>([])
  const [cropOpen, setCropOpen] = useState(false)

  useEffect(() => {
    invoke<string[]>(Cmds.GET_SYSTEM_FONTS).then(f =>
      setFonts([{ label: t`系统默认`, value: "sys" }, ...f.map(v => ({ label: v, value: v }))])
    )
    invoke<string[]>(Cmds.GET_ALL_THEME_NAMES).then(names =>
      setThemes(names.map(n => ({ label: n, value: n })))
    )
  }, [])

  const colorOptions: SelectOption[] = [
    { label: t`翡翠绿`, value: "theme-emerald", color: "#10b981" },
    { label: t`皇家蓝`, value: "theme-blue", color: "#3b82f6" },
    { label: t`蔷薇粉`, value: "theme-rose", color: "#f43f5e" },
    { label: t`极光紫`, value: "theme-violet", color: "#8b5cf6" },
    { label: t`琥珀黄`, value: "theme-amber", color: "#f59e0b" },
    { label: t`能量橙`, value: "theme-orange", color: "#f97316" },
    { label: t`深海青`, value: "theme-cyan", color: "#06b6d4" },
    { label: t`极客灰`, value: "theme-slate", color: "#64748b" },
  ]

  const modeOptions: SelectOption[] = [
    { label: t`跟随系统`, value: "System" },
    { label: t`日间模式`, value: "Daytime" },
    { label: t`夜间模式`, value: "Night" },
  ]

  const applyColor = (cls: string) => {
    colorOptions.forEach(o => document.documentElement.classList.remove(o.value))
    document.documentElement.classList.add(cls)
    updateConfig(d => { d.interface.themeColor = cls })
  }

  const bg = config.interface.globalBackground

  const handlePickBg = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }],
    })
    if (selected && typeof selected === "string") {
      await invoke(Cmds.AUTHORIZE_PATH_ACCESS, { path: selected })
      updateConfig(d => {
        d.interface.globalBackground.path = selected
        delete d.interface.globalBackground.crop
      })
    }
  }

  return (
    <>
      <SettingSection title={t`主题`}>
        {themes.length > 0 && (
          <SelectRow
            label={t`主题文件`}
            options={themes}
            value={config.interface.theme}
            onValueChange={v => updateConfig(d => { d.interface.theme = v })}
          />
        )}
        <SelectRow
          label={t`明暗模式`}
          options={modeOptions}
          value={config.interface.themeMode}
          onValueChange={v => updateConfig(d => { d.interface.themeMode = v as any })}
        />
        <SelectRow
          label={t`主题颜色`}
          options={colorOptions}
          value={config.interface.themeColor}
          onValueChange={applyColor}
        />
        <SelectRow
          label={t`界面字体`}
          options={fonts}
          value={config.interface.fontFamily}
          onValueChange={v => updateConfig(d => { d.interface.fontFamily = v })}
        />
      </SettingSection>

      <SettingSection title={t`背景图片`}>
        {/* 背景预览与选择 */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-4">
            {/* 预览缩略图 */}
            <div className={cn(
              "w-20 h-12 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0 bg-zinc-100 dark:bg-zinc-800",
              bg.path && "ring-2 ring-custom-400"
            )}>
              {bg.path ? (
                <div
                  className="w-full h-full"
                  style={createBackgroundImageStyle(bg.path, bg.crop)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-600 text-xs">
                  {t`未设置`}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-zinc-400 truncate" title={bg.path}>
                {bg.path || t`未选择图片`}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {bg.path && (
                <button
                  onClick={() => setCropOpen(true)}
                  className="flex items-center justify-center p-1.5 text-zinc-400 hover:text-custom-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <CropIcon size={14} />
                </button>
              )}
              <button
                onClick={handlePickBg}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-custom-500 hover:bg-custom-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Upload size={12} /> {t`选择`}
              </button>
              {bg.path && (
                <button
                  onClick={() => updateConfig(d => {
                    d.interface.globalBackground.path = ""
                    delete d.interface.globalBackground.crop
                  })}
                  className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <SliderRow
          label={t`背景不透明度`}
          min={0.1} max={1} step={0.01}
          value={bg.opacity}
          unit={bg.opacity === 1 ? " " : "%"}
          onChange={v => updateConfig(d => { d.interface.globalBackground.opacity = v })}
        />
        <SliderRow
          label={t`背景模糊`}
          min={0} max={40} step={1}
          value={bg.blur}
          unit="px"
          onChange={v => updateConfig(d => { d.interface.globalBackground.blur = v })}
        />
      </SettingSection>

      <SettingSection title={t`其他`}>
        <SliderRow
          label={t`卡片不透明度`}
          min={0.3} max={1} step={0.01}
          value={config.interface.commonCardOpacity}
          onChange={v => updateConfig(d => { d.interface.commonCardOpacity = v })}
        />
      </SettingSection>

      <BackgroundCropDialog
        open={cropOpen}
        path={bg.path}
        crop={bg.crop}
        onClose={() => setCropOpen(false)}
        onChange={crop => updateConfig(d => { d.interface.globalBackground.crop = crop })}
      />
    </>
  )
}

type DragState =
  | { type: "move"; startX: number; startY: number; startCrop: BackgroundCrop }
  | { type: "resize"; handle: "nw" | "ne" | "sw" | "se"; startX: number; startY: number; startCrop: BackgroundCrop }

function BackgroundCropDialog({
  open,
  path,
  crop,
  onClose,
  onChange,
}: {
  open: boolean
  path: string
  crop?: BackgroundCrop
  onClose: () => void
  onChange: (crop: BackgroundCrop) => void
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const draftRef = useRef<BackgroundCrop>(normalizeBackgroundCrop(crop))
  const [imageBox, setImageBox] = useState({ left: 0, top: 0, width: 0, height: 0 })
  const [draft, setDraft] = useState<BackgroundCrop>(normalizeBackgroundCrop(crop))

  const updateImageBox = () => {
    const stage = stageRef.current
    const img = imgRef.current
    if (!stage || !img) return
    const stageRect = stage.getBoundingClientRect()
    const imgRect = img.getBoundingClientRect()
    setImageBox({
      left: imgRect.left - stageRect.left,
      top: imgRect.top - stageRect.top,
      width: imgRect.width,
      height: imgRect.height,
    })
  }

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("resize", updateImageBox)
    requestAnimationFrame(updateImageBox)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("resize", updateImageBox)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open || imageBox.width <= 0 || imageBox.height <= 0) return

    const next = crop
      ? normalizeBackgroundCrop(crop)
      : createDefaultCrop(imageBox.width / imageBox.height)

    draftRef.current = next
    setDraft(next)
  }, [open, crop, imageBox.width, imageBox.height])

  const setDraftCrop = (next: BackgroundCrop) => {
    const normalized = normalizeBackgroundCrop(next)
    draftRef.current = normalized
    setDraft(normalized)
  }

  useEffect(() => {
    if (!open) return

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || imageBox.width <= 0 || imageBox.height <= 0) return

      const dx = (event.clientX - drag.startX) / imageBox.width
      const dy = (event.clientY - drag.startY) / imageBox.height

      if (drag.type === "move") {
        setDraftCrop({
          ...drag.startCrop,
          x: clamp(drag.startCrop.x + dx, 0, 1 - drag.startCrop.width),
          y: clamp(drag.startCrop.y + dy, 0, 1 - drag.startCrop.height),
        })
        return
      }

      setDraftCrop(resizeCrop(drag.startCrop, drag.handle, dx, dy, imageBox.width / imageBox.height))
    }

    const onPointerUp = () => {
      if (!dragRef.current) return
      dragRef.current = null
      onChange(draftRef.current)
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)

    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }
  }, [open, imageBox.width, imageBox.height, onChange])

  if (!open || !path) return null

  const startDrag = (event: React.PointerEvent, drag: DragState["type"], handle?: "nw" | "ne" | "sw" | "se") => {
    event.preventDefault()
    event.stopPropagation()
    dragRef.current = drag === "move"
      ? { type: "move", startX: event.clientX, startY: event.clientY, startCrop: draftRef.current }
      : { type: "resize", handle: handle!, startX: event.clientX, startY: event.clientY, startCrop: draftRef.current }
  }

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        ref={stageRef}
        className="relative w-[70vw] h-[70vh] overflow-hidden bg-black shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <img
          ref={imgRef}
          src={convertFileSrc(path)}
          onLoad={updateImageBox}
          className="absolute left-1/2 top-1/2 max-w-full max-h-full -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none"
        />

        {imageBox.width > 0 && imageBox.height > 0 && (
          <div
            className="absolute overflow-hidden"
            style={{
              left: imageBox.left,
              top: imageBox.top,
              width: imageBox.width,
              height: imageBox.height,
            }}
          >
            <CropMask crop={draft} />
            <div
              className="absolute z-20 cursor-move border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_0_28px_rgba(0,0,0,0.45)]"
              style={{
                left: `${draft.x * 100}%`,
                top: `${draft.y * 100}%`,
                width: `${draft.width * 100}%`,
                height: `${draft.height * 100}%`,
              }}
              onPointerDown={event => startDrag(event, "move")}
            >
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                {Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} className="border border-white/35" />
                ))}
              </div>
              <CropHandle position="nw" onPointerDown={event => startDrag(event, "resize", "nw")} />
              <CropHandle position="ne" onPointerDown={event => startDrag(event, "resize", "ne")} />
              <CropHandle position="sw" onPointerDown={event => startDrag(event, "resize", "sw")} />
              <CropHandle position="se" onPointerDown={event => startDrag(event, "resize", "se")} />
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

function CropMask({ crop }: { crop: BackgroundCrop }) {
  const left = crop.x * 100
  const top = crop.y * 100
  const right = (1 - crop.x - crop.width) * 100
  const bottom = (1 - crop.y - crop.height) * 100

  return (
    <>
      <div className="absolute left-0 top-0 z-10 w-full bg-black/55" style={{ height: `${top}%` }} />
      <div className="absolute left-0 z-10 bg-black/55" style={{ top: `${top}%`, width: `${left}%`, height: `${crop.height * 100}%` }} />
      <div className="absolute right-0 z-10 bg-black/55" style={{ top: `${top}%`, width: `${right}%`, height: `${crop.height * 100}%` }} />
      <div className="absolute left-0 bottom-0 z-10 w-full bg-black/55" style={{ height: `${bottom}%` }} />
    </>
  )
}

function CropHandle({
  position,
  onPointerDown,
}: {
  position: "nw" | "ne" | "sw" | "se"
  onPointerDown: (event: React.PointerEvent) => void
}) {
  const className = {
    nw: "-left-2 -top-2 cursor-nwse-resize",
    ne: "-right-2 -top-2 cursor-nesw-resize",
    sw: "-left-2 -bottom-2 cursor-nesw-resize",
    se: "-right-2 -bottom-2 cursor-nwse-resize",
  }[position]

  return (
    <div
      className={cn("absolute z-30 h-4 w-4 rounded-full border-2 border-white bg-custom-500 shadow-lg", className)}
      onPointerDown={onPointerDown}
    />
  )
}

function createDefaultCrop(imageAspect: number): BackgroundCrop {
  const targetAspect = Math.max(0.45, Math.min(3.2, window.innerWidth / window.innerHeight))
  const normalizedRatio = targetAspect / imageAspect

  if (normalizedRatio >= 1) {
    const height = 1 / normalizedRatio
    return { x: 0, y: (1 - height) / 2, width: 1, height }
  }

  const width = normalizedRatio
  return { x: (1 - width) / 2, y: 0, width, height: 1 }
}

function resizeCrop(
  crop: BackgroundCrop,
  handle: "nw" | "ne" | "sw" | "se",
  dx: number,
  dy: number,
  imageAspect: number,
): BackgroundCrop {
  const targetAspect = Math.max(0.45, Math.min(3.2, window.innerWidth / window.innerHeight))
  const normalizedRatio = targetAspect / imageAspect
  const minWidth = Math.min(0.12, crop.width)
  const widthDelta = getResizeWidthDelta(handle, dx, dy, normalizedRatio)

  if (handle === "se") {
    const maxWidth = Math.min(1 - crop.x, (1 - crop.y) * normalizedRatio)
    const width = clamp(crop.width + widthDelta, Math.min(minWidth, maxWidth), maxWidth)
    return { ...crop, width, height: width / normalizedRatio }
  }

  if (handle === "ne") {
    const maxWidth = Math.min(1 - crop.x, (crop.y + crop.height) * normalizedRatio)
    const width = clamp(crop.width + widthDelta, Math.min(minWidth, maxWidth), maxWidth)
    const height = width / normalizedRatio
    return { ...crop, y: crop.y + crop.height - height, width, height }
  }

  if (handle === "sw") {
    const maxWidth = Math.min(crop.x + crop.width, (1 - crop.y) * normalizedRatio)
    const width = clamp(crop.width + widthDelta, Math.min(minWidth, maxWidth), maxWidth)
    return { ...crop, x: crop.x + crop.width - width, width, height: width / normalizedRatio }
  }

  const maxWidth = Math.min(crop.x + crop.width, (crop.y + crop.height) * normalizedRatio)
  const width = clamp(crop.width + widthDelta, Math.min(minWidth, maxWidth), maxWidth)
  const height = width / normalizedRatio
  return { ...crop, x: crop.x + crop.width - width, y: crop.y + crop.height - height, width, height }
}

function getResizeWidthDelta(
  handle: "nw" | "ne" | "sw" | "se",
  dx: number,
  dy: number,
  normalizedRatio: number,
) {
  const horizontal = handle.endsWith("e") ? dx : -dx
  const vertical = handle.startsWith("s") ? dy * normalizedRatio : -dy * normalizedRatio
  return Math.abs(horizontal) > Math.abs(vertical) ? horizontal : vertical
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
