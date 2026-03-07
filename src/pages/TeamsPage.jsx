import { useState, useMemo } from 'react'
import { useApp } from '../context/useApp'
import Modal from '../components/Modal'
import PlayerCard from '../components/PlayerCard'

export default function TeamsPage() {
  const { state, dispatch } = useApp()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)

  // Create team form state
  const [ownerName, setOwnerName] = useState('')
  const [selectedClub, setSelectedClub] = useState('')
  const [clubSearch, setClubSearch] = useState('')

  // Unique sorted clubs from players data
  const clubs = useMemo(() => {
    const map = {}
    state.players.forEach((p) => {
      if (p.club && !map[p.club]) map[p.club] = p.clubLogo
    })
    return Object.entries(map)
      .map(([club, logo]) => ({ club, logo }))
      .sort((a, b) => a.club.localeCompare(b.club))
  }, [state.players])

  const filteredClubs = useMemo(() => {
    const q = clubSearch.toLowerCase()
    return q ? clubs.filter((c) => c.club.toLowerCase().includes(q)) : clubs
  }, [clubs, clubSearch])

  function handleCreateTeam() {
    if (!ownerName.trim() || !selectedClub) return
    const clubData = clubs.find((c) => c.club === selectedClub)
    dispatch({
      type: 'ADD_TEAM',
      payload: {
        ownerName: ownerName.trim(),
        club: selectedClub,
        clubLogo: clubData?.logo || '',
      },
    })
    setOwnerName('')
    setSelectedClub('')
    setClubSearch('')
    setShowCreate(false)
  }

  function handleDeleteTeam(e, teamId) {
    e.stopPropagation()
    if (!window.confirm('Delete this team? This will unassign all its players.')) return
    dispatch({ type: 'DELETE_TEAM', payload: { teamId } })
    if (selectedTeam?.id === teamId) setSelectedTeam(null)
  }

  // If viewing a specific team
  if (selectedTeam) {
    const team = state.teams.find((t) => t.id === selectedTeam.id)
    if (!team) {
      setSelectedTeam(null)
      return null
    }
    const teamPlayers = state.players.filter((p) =>
      p.owners.includes(team.ownerName),
    )

    return (
      <div className="flex flex-col h-full">
        {/* Team header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => setSelectedTeam(null)}
            className="text-green-700 font-semibold text-base flex items-center gap-1"
          >
            ← Back
          </button>
          {team.clubLogo && (
            <img src={team.clubLogo} alt={team.club} className="w-10 h-10 object-contain"
              onError={(e) => { e.target.style.display = 'none' }} />
          )}
          <div>
            <p className="font-semibold text-gray-900 text-base">{team.club}</p>
            <p className="text-sm text-gray-500">Owner: <span className="font-medium text-green-700">{team.ownerName}</span></p>
          </div>
          <span className="ml-auto text-sm bg-green-100 text-green-700 rounded-full px-3 py-1 font-medium">
            {teamPlayers.length} players
          </span>
        </div>

        {/* Title tracker */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Titles</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'leagueTitle',    label: 'League Title',    emoji: '🏆' },
              { key: 'leagueCup',      label: 'League Cup',      emoji: '🥇' },
              { key: 'europaLeague',   label: 'Europa League',   emoji: '🟠' },
              { key: 'championsLeague',label: 'Champions League',emoji: '⭐' },
            ].map(({ key, label, emoji }) => {
              const count = team.titles?.[key] ?? 0
              return (
                <div key={key} className="flex flex-col bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg leading-none">{emoji}</span>
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => dispatch({ type: 'UPDATE_TEAM_TITLES', payload: { teamId: team.id, key, delta: -1 } })}
                      disabled={count === 0}
                      className="w-8 h-8 rounded-full bg-gray-200 disabled:opacity-30 text-gray-700 text-xl font-bold flex items-center justify-center leading-none flex-shrink-0"
                    >−</button>
                    <span className="text-lg font-bold text-gray-900 flex-1 text-center">{count}</span>
                    <button
                      onClick={() => dispatch({ type: 'UPDATE_TEAM_TITLES', payload: { teamId: team.id, key, delta: 1 } })}
                      className="w-8 h-8 rounded-full bg-green-600 text-white text-xl font-bold flex items-center justify-center leading-none flex-shrink-0"
                    >+</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Players list */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-2">
          {teamPlayers.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <span className="text-4xl mb-2">👥</span>
              <p className="text-base">No players for this team yet.</p>
            </div>
          ) : (
            teamPlayers.map((p) => (
              <PlayerCard
                key={p.id}
                player={p}
                onRelease={() =>
                  dispatch({
                    type: 'REMOVE_OWNER_FROM_PLAYER',
                    payload: { playerId: p.id, ownerName: team.ownerName },
                  })
                }
              />
            ))
          )}
          <div className="h-2" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <p className="text-base text-gray-500">{state.teams.length} team{state.teams.length !== 1 ? 's' : ''} created</p>
        <div className="flex gap-2">
          {state.players.some((p) => p.owners.length > 0) && (
            <button
              onClick={() => {
                if (window.confirm('Reset ALL ownership and delete all teams? This cannot be undone.'))
                  dispatch({ type: 'RESET_ALL_OWNERSHIP' })
              }}
              className="border border-red-300 text-red-500 text-sm font-semibold px-3 py-2 rounded-xl transition-colors hover:bg-red-50"
            >
              Reset
            </button>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="bg-green-600 hover:bg-green-700 text-white text-base font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            + Create Team
          </button>
        </div>
      </div>

      {/* Team list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-2">
        {state.teams.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <span className="text-4xl mb-2">🏟️</span>
            <p className="text-base font-medium">No teams yet</p>
            <p className="text-sm mt-1">Tap "Create Team" to get started.</p>
          </div>
        ) : (
          state.teams.map((team) => {
            const playerCount = state.players.filter(
              (p) => p.owners.includes(team.ownerName),
            ).length
            const totalTitles = Object.values(team.titles ?? {}).reduce((s, v) => s + v, 0)
            return (
              <div
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:border-green-200 transition-colors"
              >
                {team.clubLogo ? (
                  <img
                    src={team.clubLogo}
                    alt={team.club}
                    className="w-14 h-14 object-contain flex-shrink-0"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">🏟️</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate text-base">{team.club}</p>
                  <p className="text-sm text-gray-500">
                    Owner: <span className="text-green-700 font-medium">{team.ownerName}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-gray-400">{playerCount} players</span>
                    <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold rounded-full px-2 py-0.5">
                      🏆 {totalTitles} title{totalTitles !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-gray-400 text-base">›</span>
                  <button
                    onClick={(e) => handleDeleteTeam(e, team.id)}
                    className="text-red-400 hover:text-red-600 text-sm px-2 py-1 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })
        )}
        <div className="h-2" />
      </div>

      {/* Create Team Modal */}
      {showCreate && (
        <Modal title="Create Team" onClose={() => { setShowCreate(false); setOwnerName(''); setSelectedClub(''); setClubSearch('') }}>
          <div className="space-y-4">
            {/* Owner name */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Owner Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Alice"
                className="w-full border border-gray-300 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
            </div>

            {/* Club search */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Select Club</label>
              <input
                type="text"
                value={clubSearch}
                onChange={(e) => { setClubSearch(e.target.value); setSelectedClub('') }}
                placeholder="Search clubs…"
                className="w-full border border-gray-300 rounded-lg p-3 text-base mb-1 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="border border-gray-200 rounded-lg overflow-y-auto max-h-52">
                {filteredClubs.length === 0 ? (
                  <p className="text-base text-gray-400 p-3">No clubs found.</p>
                ) : (
                  filteredClubs.map(({ club, logo }) => (
                    <button
                      key={club}
                      onClick={() => { setSelectedClub(club); setClubSearch(club) }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-base text-left transition-colors
                        ${selectedClub === club
                          ? 'bg-green-50 text-green-700 font-medium'
                          : 'hover:bg-gray-50 text-gray-700'}`}
                    >
                      {logo && (
                        <img src={logo} alt={club} className="w-6 h-6 object-contain flex-shrink-0"
                          onError={(e) => { e.target.style.display = 'none' }} />
                      )}
                      {club}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setShowCreate(false); setOwnerName(''); setSelectedClub(''); setClubSearch('') }}
                className="flex-1 border border-gray-300 rounded-lg py-3 text-base text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={!ownerName.trim() || !selectedClub}
                className="flex-1 bg-green-600 disabled:bg-gray-300 text-white rounded-lg py-3 text-base font-medium transition-colors"
              >
                Create Team
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
