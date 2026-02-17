import useGameStore from "@/store/gameStore"

export default function Title() {
  const { selectedGame } = useGameStore()
  return (
    < div className="pl-8 pb-2 text-6xl text-white font-bold transition-all duration-500"
      style={{
        WebkitTextStroke: '2px black',
        paintOrder: 'stroke fill',
      }
      }>
      {selectedGame?.name}
    </div >
  )
}

