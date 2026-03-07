import React, { createContext, useReducer, useEffect, useRef, useState, useCallback } from 'react'
import rawPlayers from '../data/players.json'

// ─── API base URL (set VITE_API_URL in .env.local) ──────────────────────────

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// ─── Context & initial state ────────────────────────────────────────────────

const AppContext = createContext(null)
export { AppContext }

function buildPlayers(playerOwners) {
  return rawPlayers.map((p) => ({
    ...p,
    owners: playerOwners[p.id] || [],
  }))
}

// Empty state – will be hydrated from the API on mount
function getDefaultState() {
  return { players: buildPlayers({}), teams: [], rules: [] }
}

// ─── Reducer ────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {

    // Teams
    case 'ADD_TEAM': {
      const { id, ownerName, club, clubLogo } = action.payload
      const newTeam = {
        id: id ?? Date.now().toString(),
        ownerName,
        club,
        clubLogo,
        titles: { leagueTitle: 0, leagueCup: 0, europaLeague: 0, championsLeague: 0 },
      }
      const updatedTeams = [...state.teams, newTeam]
      // Assign owner to every player of that club
      const updatedPlayers = state.players.map((p) => {
        if (p.club !== club) return p
        const owners = p.owners.includes(ownerName)
          ? p.owners
          : [...p.owners, ownerName]
        return { ...p, owners }
      })
      return { ...state, teams: updatedTeams, players: updatedPlayers }
    }

    case 'UPDATE_TEAM_TITLES': {
      const { teamId, key, delta } = action.payload
      const updatedTeams = state.teams.map((t) => {
        if (t.id !== teamId) return t
        const current = t.titles?.[key] ?? 0
        return { ...t, titles: { ...t.titles, [key]: Math.max(0, current + delta) } }
      })
      return { ...state, teams: updatedTeams }
    }

    case 'DELETE_TEAM': {
      const { teamId } = action.payload
      const team = state.teams.find((t) => t.id === teamId)
      if (!team) return state
      const updatedTeams = state.teams.filter((t) => t.id !== teamId)
      // If this owner has no remaining teams, strip them from every player.
      // If they still have other teams, only strip from this club's players.
      const ownerHasOtherTeams = updatedTeams.some((t) => t.ownerName === team.ownerName)
      const updatedPlayers = state.players.map((p) => {
        const inThisClub = p.club === team.club
        if (ownerHasOtherTeams && !inThisClub) return p
        return { ...p, owners: p.owners.filter((o) => o !== team.ownerName) }
      })
      return { ...state, teams: updatedTeams, players: updatedPlayers }
    }

    case 'RESET_ALL_OWNERSHIP': {
      const updatedPlayers = state.players.map((p) => ({ ...p, owners: [] }))
      return { ...state, players: updatedPlayers, teams: [] }
    }

    // Players
    case 'ADD_OWNER_TO_PLAYER': {
      const { playerId, ownerName } = action.payload
      const updatedPlayers = state.players.map((p) => {
        if (p.id !== playerId) return p
        if (p.owners.includes(ownerName)) return p
        return { ...p, owners: [...p.owners, ownerName] }
      })
      return { ...state, players: updatedPlayers }
    }

    case 'REMOVE_OWNER_FROM_PLAYER': {
      const { playerId, ownerName } = action.payload
      const updatedPlayers = state.players.map((p) => {
        if (p.id !== playerId) return p
        return { ...p, owners: p.owners.filter((o) => o !== ownerName) }
      })
      return { ...state, players: updatedPlayers }
    }

    // Rules
    case 'ADD_RULE': {
      const { id, text } = action.payload
      return { ...state, rules: [...state.rules, { id: id ?? Date.now().toString(), text }] }
    }

    case 'DELETE_RULE': {
      return {
        ...state,
        rules: state.rules.filter((r) => r.id !== action.payload.ruleId),
      }
    }

    // Hydrate from API on initial load
    case 'HYDRATE': {
      const { playerOwners = {}, teams = [], rules = [] } = action.payload
      return { players: buildPlayers(playerOwners), teams, rules }
    }

    default:
      return state
  }
}

// ─── API helper ──────────────────────────────────────────────────────────────

async function api(method, path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body:    body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}`)
  return res.json()
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, getDefaultState)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  // Always reflects latest state inside async callbacks without stale closures
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // ── Fetch & hydrate ───────────────────────────────────────────────────────
  const fetchState = useCallback(() => {
    return api('GET', '/api/state')
      .then((data) => {
        dispatch({ type: 'HYDRATE', payload: data })
        setError(null)
      })
      .catch((err) => {
        console.error('Failed to load state from API:', err)
        setError(err.message)
        throw err
      })
  }, [])

  useEffect(() => {
    fetchState().finally(() => setLoading(false))
  }, [fetchState])

  // ── Action-specific API sync ──────────────────────────────────────────────
  // Every action calls only the targeted endpoint it needs — no full-slice
  // replaces, so two users acting simultaneously won't overwrite each other.
  const apiDispatch = useCallback(async (action) => {
    // Pre-generate IDs so the reducer and the API call use the same value
    if (action.type === 'ADD_TEAM' && !action.payload.id) {
      action = { ...action, payload: { ...action.payload, id: Date.now().toString() } }
    }
    if (action.type === 'ADD_RULE' && !action.payload.id) {
      action = { ...action, payload: { ...action.payload, id: Date.now().toString() } }
    }

    dispatch(action) // optimistic UI update — instant

    const s = stateRef.current // snapshot BEFORE this action

    try {
      switch (action.type) {

        case 'ADD_TEAM': {
          const { id, ownerName, club, clubLogo } = action.payload
          await api('POST', '/api/teams', {
            id, ownerName, club, clubLogo,
            titles: { leagueTitle: 0, leagueCup: 0, europaLeague: 0, championsLeague: 0 },
          })
          const batch = {}
          s.players.forEach((p) => {
            if (p.club !== club) return
            batch[p.id] = p.owners.includes(ownerName) ? p.owners : [...p.owners, ownerName]
          })
          if (Object.keys(batch).length > 0) await api('PUT', '/api/player-owners/batch', batch)
          break
        }

        case 'UPDATE_TEAM_TITLES': {
          const { teamId, key, delta } = action.payload
          await api('PATCH', `/api/teams/${teamId}`, { key, delta })
          break
        }

        case 'DELETE_TEAM': {
          const { teamId } = action.payload
          const team = s.teams.find((t) => t.id === teamId)
          if (!team) break
          await api('DELETE', `/api/teams/${teamId}`)
          const remainingTeams = s.teams.filter((t) => t.id !== teamId)
          const ownerHasOtherTeams = remainingTeams.some((t) => t.ownerName === team.ownerName)
          const batch = {}
          s.players.forEach((p) => {
            if (ownerHasOtherTeams && p.club !== team.club) return
            if (!p.owners.includes(team.ownerName)) return
            batch[p.id] = p.owners.filter((o) => o !== team.ownerName)
          })
          if (Object.keys(batch).length > 0) await api('PUT', '/api/player-owners/batch', batch)
          break
        }

        case 'RESET_ALL_OWNERSHIP': {
          await Promise.all([
            api('DELETE', '/api/teams'),
            api('DELETE', '/api/player-owners'),
          ])
          break
        }

        case 'ADD_OWNER_TO_PLAYER': {
          const { playerId, ownerName } = action.payload
          const player = s.players.find((p) => p.id === playerId)
          if (!player) break
          const owners = player.owners.includes(ownerName)
            ? player.owners
            : [...player.owners, ownerName]
          await api('PUT', `/api/player-owners/${playerId}`, { owners })
          break
        }

        case 'REMOVE_OWNER_FROM_PLAYER': {
          const { playerId, ownerName } = action.payload
          const player = s.players.find((p) => p.id === playerId)
          if (!player) break
          const owners = player.owners.filter((o) => o !== ownerName)
          await api('PUT', `/api/player-owners/${playerId}`, { owners })
          break
        }

        case 'ADD_RULE': {
          const { id, text } = action.payload
          await api('POST', '/api/rules', { id, text })
          break
        }

        case 'DELETE_RULE': {
          await api('DELETE', `/api/rules/${action.payload.ruleId}`)
          break
        }

        default:
          break
      }
    } catch (err) {
      console.error('Failed to sync action to API:', action.type, err)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <svg className="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm">Connecting to server...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <span className="text-4xl">⚠️</span>
          <p className="font-semibold text-gray-700">Could not connect to the server</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchState().finally(() => setLoading(false)) }}
            className="mt-2 px-4 py-2 bg-green-700 text-white rounded text-sm hover:bg-green-800"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <AppContext.Provider value={{ state, dispatch: apiDispatch, refetch: fetchState }}>
      {children}
    </AppContext.Provider>
  )
}
