import { useState } from 'react'
import { useApp } from '../context/useApp'
import Modal from './Modal'

// Deterministic color from a string
const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500',
  'bg-teal-500', 'bg-orange-500', 'bg-cyan-500', 'bg-rose-500',
  'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500',
]
function avatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
function initials(name) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function PlayerCard({ player, onRelease }) {
  const { state, dispatch } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [imgError, setImgError] = useState(false);

  const isTaken = player.owners.length > 0

  function handleAddToTeam() {
    if (!selectedTeam) return
    dispatch({ type: 'ADD_OWNER_TO_PLAYER', payload: { playerId: player.id, ownerName: selectedTeam.ownerName } })
    setShowModal(false)
    setSelectedTeam(null)
  }

  function handleCloseModal() {
    setShowModal(false)
    setSelectedTeam(null)
  }

  return (
    <>
      <div className={`flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border
        ${isTaken ? 'border-green-200' : 'border-gray-100'}`}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg select-none ${imgError && avatarColor(player.name)}`}>
            {player.photo && !imgError ? (
              <img 
                src={player.photo} 
                alt={player.name} 
                className="w-full h-full object-cover"
                onError={() => setImgError(true)} 
              />
            ) : (
              initials(player.name)
            )}
          </div>
          {/* Flag */}
          <img
            src={player.flag}
            alt={player.nationality}
            className="absolute bottom-0 right-0 w-6 h-5 rounded-sm object-cover"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-base truncate">{player.name}</span>
            <span className="text-sm bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">{player.position}</span>
            <span className={`text-sm font-bold rounded px-1.5 py-0.5
              ${player.overall >= 85 ? 'bg-yellow-100 text-yellow-700'
                : player.overall >= 75 ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600'}`}
            >
              {player.overall}
            </span>
          </div>
          {/* Owners */}
          {isTaken ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {player.owners.map((o) => (
                <span key={o}
                  className="text-sm bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 font-medium">
                  {o}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-400 mt-1 inline-block">Available</span>
          )}
        </div>

        {/* Status badge + action */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <span className={`text-sm font-semibold px-2 py-1 rounded-full
            ${isTaken
              ? 'bg-red-100 text-red-600'
              : 'bg-gray-100 text-gray-500'}`}
          >
            {isTaken ? 'Taken' : 'Available'}
          </span>
          {onRelease ? (
            <button
              onClick={onRelease}
              className="text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-1.5 font-medium transition-colors"
            >
              Release
            </button>
          ) : (
            !isTaken && state.teams.length > 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-1.5 font-medium transition-colors"
              >
                + Add
              </button>
            )
          )}
        </div>
      </div>

      {/* Add to team modal */}
      {showModal && (
        <Modal title={`Add ${player.name}`} onClose={handleCloseModal}>
          <p className="text-base text-gray-500 mb-3">Select a team:</p>
          <div className="space-y-2 mb-4">
            {state.teams.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTeam(t)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left
                  ${selectedTeam?.id === t.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'}`}
              >
                {t.clubLogo && (
                  <img src={t.clubLogo} alt={t.club} className="w-7 h-7 object-contain flex-shrink-0"
                    onError={(e) => { e.target.style.display = 'none' }} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-gray-800 truncate">{t.ownerName}</p>
                  <p className="text-sm text-gray-400 truncate">{t.club}</p>
                </div>
                {selectedTeam?.id === t.id && (
                  <span className="text-green-600 text-base flex-shrink-0">✓</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCloseModal}
              className="flex-1 border border-gray-200 rounded-xl py-3 text-base text-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToTeam}
              disabled={!selectedTeam}
              className="flex-1 bg-green-600 disabled:bg-gray-300 text-white rounded-xl py-3 text-base font-semibold transition-colors"
            >
              Confirm
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
