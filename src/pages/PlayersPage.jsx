import { useState, useMemo } from 'react'
import { useApp } from '../context/useApp'
import PlayerCard from '../components/PlayerCard'

const PAGE_SIZE = 30
const FILTERS = ['All', 'Available', 'Taken']

export default function PlayersPage() {
  const { state } = useApp()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return state.players.filter((p) => {
      const matchesSearch = !q || p.name.toLowerCase().includes(q)
      const matchesFilter =
        filter === 'All' ||
        (filter === 'Taken' && p.owners.length > 0) ||
        (filter === 'Available' && p.owners.length === 0)
      return matchesSearch && matchesFilter
    })
  }, [state.players, search, filter])

  const visible = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = visible.length < filtered.length

  function onSearchChange(e) {
    setSearch(e.target.value)
    setPage(1)
  }

  function onFilterChange(f) {
    setFilter(f)
    setPage(1)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search + filter bar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-3 pt-3 pb-2 space-y-2">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={onSearchChange}
            placeholder="Search by name…"
            className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors
                ${filter === f
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-sm text-gray-400">
          Showing {visible.length} of {filtered.length} players
        </p>
      </div>

      {/* Player list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl mb-2">🔍</span>
            <p className="text-base">No players match your search.</p>
          </div>
        ) : (
          <>
            {visible.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
            {hasMore && (
              <button
                onClick={() => setPage((p) => p + 1)}
                className="w-full py-4 text-base text-green-700 font-semibold border border-green-200 rounded-xl hover:bg-green-50 transition-colors"
              >
                Load more ({filtered.length - visible.length} remaining)
              </button>
            )}
          </>
        )}
        <div className="h-2" /> {/* bottom spacing */}
      </div>
    </div>
  )
}
