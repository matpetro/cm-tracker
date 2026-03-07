import { useState, useEffect, useRef } from 'react'
import { AppProvider } from './context/AppContext'
import { useApp } from './context/useApp'
import PlayersPage from './pages/PlayersPage'
import TeamsPage from './pages/TeamsPage'
import RulesPage from './pages/RulesPage'

const TABS = [
  { id: 'players', label: 'Players', icon: '⚽' },
  { id: 'teams',   label: 'Teams',   icon: '🏟️' },
  { id: 'rules',   label: 'Rules',   icon: '📋' },
]

// Inner component — has access to context so it can call refetch
function AppShell() {
  const { refetch } = useApp()
  const [activeTab, setActiveTab] = useState('players')
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Skip on initial mount — AppProvider already fetched on load
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    refetch()
  }, [activeTab])

  return (
    <div className="flex flex-col h-full w-full bg-gray-50">
      {/* Header */}
      <header className="bg-green-700 text-white px-4 py-4 shadow-md flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-wide">
          {TABS.find((t) => t.id === activeTab)?.icon}{' '}
          {TABS.find((t) => t.id === activeTab)?.label}
        </h1>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'players' && <PlayersPage />}
        {activeTab === 'teams'   && <TeamsPage />}
        {activeTab === 'rules'   && <RulesPage />}
      </main>

      {/* Bottom nav */}
      <nav className="flex-shrink-0 bg-white border-t border-gray-200 shadow-inner">
        <ul className="flex">
          {TABS.map((tab) => (
            <li key={tab.id} className="flex-1">
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex flex-col items-center py-3 text-sm gap-1 transition-colors
                  ${activeTab === tab.id
                    ? 'text-green-700 font-semibold'
                    : 'text-gray-500 hover:text-green-600'
                  }`}
              >
                <span className="text-2xl leading-none">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
