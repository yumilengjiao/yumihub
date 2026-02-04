interface Companion {
  id?: number
  name: string
  path: string
  args: string
  isEnabled: boolean
  triggerMode: 'app' | 'game'
  sortOrder: number
  description: string
}
