import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import useDialogStore from "@/store/dialogStore"

export function GlobalConfirm() {
  const { isOpen, options, close } = useDialogStore()

  const handleConfirm = () => {
    options.onConfirm?.()
    close()
  }

  const handleCancel = () => {
    options.onCancel?.()
    close()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={close}>
      <AlertDialogContent className="z-9999"> {/* 确保 Z轴最高 */}
        <AlertDialogHeader>
          <AlertDialogTitle>{options.title}</AlertDialogTitle>
          {options.description && (
            <AlertDialogDescription>
              {options.description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {options.cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={options.variant === 'destructive' ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {options.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
