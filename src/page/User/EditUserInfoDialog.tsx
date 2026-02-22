import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, Camera, Link as LinkIcon, Image as ImageIcon, Sparkles, UserIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { t } from "@lingui/core/macro"
import { Trans } from '@lingui/react/macro'

// Tauri API
import { open } from '@tauri-apps/plugin-dialog'
import { convertFileSrc, invoke } from '@tauri-apps/api/core'

// 导入默认头像
import defaultAvatar from "@/assets/runasama😍😍😍😍.jpg"

import useUserStore from "@/store/userStore"
import { User } from "@/types/user"
import { Cmds } from '@/lib/enum'

interface EditUserInfoDialogProps {
  isOpen: boolean
  onClose: () => void
}

const EditUserInfoDialog: React.FC<EditUserInfoDialogProps> = ({ isOpen, onClose }) => {
  const { user, setUser } = useUserStore()
  const [formData, setFormData] = useState<User | null>(null)

  useEffect(() => {
    if (isOpen && user) {
      setFormData({ ...user })
    }
  }, [isOpen, user])

  // 处理本地图片选择
  const handleSelectLocalFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'webp'] }]
      })

      if (selected && typeof selected === 'string') {
        await invoke(Cmds.AUTHORIZE_PATH_ACCESS, { path: selected })
        setFormData(prev => prev ? ({
          ...prev,
          avatar: selected,      // 存入 avatar 字段用于预览和持久化
        }) : null)
        toast.info(t`已载入本地图片预览`)
      }
    } catch (err) {
      toast.error(t`无法打开文件对话框`)
      console.error(err)
    }
  }

  // 辅助函数：判断是否为网络链接
  const isNetworkUrl = (url: string) => url?.startsWith('http')

  // 获取真实的图片渲染地址
  const getDisplaySrc = (path: string) => {
    if (!path) return defaultAvatar
    if (isNetworkUrl(path)) return path // 网络链接直接返回
    return convertFileSrc(path)         // 本地路径需要转换
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData) {
      setUser(formData)
      toast.success(t`用户信息同步成功`)
      onClose()
    }
  }

  if (!isOpen || !formData) return null

  return createPortal(
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-lg bg-white dark:bg-zinc-800 rounded-[40px] shadow-2xl overflow-hidden border border-zinc-100/20"
      >
        {/* Header */}
        <div className="h-24 bg-zinc-300 dark:bg-zinc-800 flex items-center justify-between px-10 text-white">
          <div className="flex flex-col">
            <span className="text-xs font-black italic text-zinc-500 uppercase tracking-widest">Identity Settings</span>
            <span className="text-xl font-black italic text-zinc-500 uppercase tracking-tighter"><Trans>修改用户信息</Trans></span>
          </div>
          <X className="cursor-pointer opacity-40 hover:opacity-100 transition-opacity" onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="p-10">

          {/* 头像编辑区 - 双模式 */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative group mb-6">
              <div className="w-32 h-32 rounded-[36px] border-[3px] border-white dark:border-zinc-400 shadow-2xl overflow-hidden bg-zinc-100">
                <img
                  src={getDisplaySrc(formData.avatar)}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  onError={(e) => (e.currentTarget.src = defaultAvatar)}
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-zinc-900 text-white p-2.5 rounded-2xl shadow-xl">
                <Camera size={18} />
              </div>
            </div>

            {/* 头像源切换控制 */}
            <div className="w-full grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-zinc-600 p-1.5 rounded-2xl border border-zinc-100/20">
              <button
                type="button"
                onClick={handleSelectLocalFile}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white dark:bg-zinc-500 shadow-sm border border-zinc-200/10 text-xs font-black uppercase dark:hover:bg-zinc-800 transition-all"
              >
                <ImageIcon size={14} /><Trans> 本地上传</Trans>
              </button>
              <div className="relative flex items-center">
                <LinkIcon size={14} className="absolute left-3 text-zinc-400" />
                <Input
                  placeholder="粘贴网络链接..."
                  value={isNetworkUrl(formData.avatar) ? formData.avatar : ""}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="pl-9 h-full bg-transparent border-none text-[11px] font-bold placeholder:text-zinc-300 focus-visible:ring-0"
                />
              </div>
            </div>
          </div>

          {/* 表单字段 */}
          <div className="space-y-6">
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black text-zinc-400 uppercase ml-1 tracking-widest flex items-center gap-2">
                <UserIcon size={12} className="text-zinc-300" /><Trans> 用户昵称</Trans>
              </Label>
              <Input
                value={formData.userName}
                onChange={e => setFormData({ ...formData, userName: e.target.value })}
                className="h-14 rounded-2xl border-none bg-zinc-50 px-5 font-bold text-zinc-700 focus:ring-2 focus:ring-zinc-100"
              />
            </div>

            <div className="space-y-2.5">
              <Label className="text-[10px] font-black text-zinc-400 uppercase ml-1 tracking-widest flex items-center gap-2">
                <Sparkles size={12} className="text-zinc-300" /><Trans> 最喜欢的游戏</Trans>
              </Label>
              <Input
                value={formData.favoriteGame}
                onChange={e => setFormData({ ...formData, favoriteGame: e.target.value })}
                className="h-14 rounded-2xl border-none bg-zinc-50 px-5 font-bold text-zinc-700 focus:ring-2 focus:ring-zinc-100"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-12 flex gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 h-16 rounded-[24px] font-black uppercase bg-zinc-300 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              <Trans>取消</Trans>
            </Button>
            <Button
              type="submit"
              className="flex-1 h-16 rounded-[24px] bg-zinc-700 hover:bg-zinc-950 text-white font-black uppercase transition-all active:scale-95"
            >
              <Trans>保存信息</Trans>
            </Button>
          </div>
        </form>
      </motion.div>
    </div>,
    document.body
  )
}

export default EditUserInfoDialog
