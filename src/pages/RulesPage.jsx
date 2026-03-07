import { useState } from 'react'
import { useApp } from '../context/useApp'

export default function RulesPage() {
  const { state, dispatch } = useApp()
  const [text, setText] = useState('')

  function handleAdd() {
    const trimmed = text.trim()
    if (!trimmed) return
    dispatch({ type: 'ADD_RULE', payload: { text: trimmed } })
    setText('')
  }

  function handleDelete(ruleId) {
    dispatch({ type: 'DELETE_RULE', payload: { ruleId } })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Add rule bar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-3 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add a new rule…"
            className="flex-1 border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleAdd}
            disabled={!text.trim()}
            className="bg-green-600 disabled:bg-gray-300 text-white rounded-xl px-5 py-3 text-base font-semibold transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Rules list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-2">
        {state.rules.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <span className="text-4xl mb-2">📋</span>
            <p className="text-base font-medium">No rules yet</p>
            <p className="text-sm mt-1">Add a rule above to get started.</p>
          </div>
        ) : (
          state.rules.map((rule, i) => (
            <div
              key={rule.id}
              className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100 overflow-hidden"
            >
              <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-700 text-sm font-bold rounded-full flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="flex-1 text-base text-gray-800 leading-relaxed break-words min-w-0">{rule.text}</p>
              <button
                onClick={() => handleDelete(rule.id)}
                className="flex-shrink-0 text-red-400 hover:text-red-600 text-sm px-2 py-1 rounded transition-colors"
                aria-label="Delete rule"
              >
                🗑️
              </button>
            </div>
          ))
        )}
        <div className="h-2" />
      </div>
    </div>
  )
}
