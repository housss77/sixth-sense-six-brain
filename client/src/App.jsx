import { useState } from 'react'
import {
  CheckCircle,
  Cpu,
  Database,
  MessageSquare,
  Send,
  ShieldAlert,
  User,
} from 'lucide-react'

const emptyDraftForm = {
  instrument_id: null,
  mifid_reportable: null,
  sfdr_ghg_emissions: null,
  fatca_scope: null,
}

const initialAssistantMessage = {
  role: 'assistant',
  content:
    'Welcome to SIXth Sense. Ask about instrument coverage, asset classification, regulatory attributes, or onboarding decisions.',
}

function App() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([initialAssistantMessage])
  const [stpStatus, setStpStatus] = useState({
    requires_bpo_action: false,
    bpo_draft_form: emptyDraftForm,
  })

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedQuery = query.trim()
    if (!trimmedQuery || loading) {
      return
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: 'user', content: trimmedQuery },
    ])
    setQuery('')
    setLoading(true)

    try {
      const response = await fetch('http://127.0.0.1:5000/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: trimmedQuery }),
      })

      if (!response.ok) {
        throw new Error('The compliance agent could not be reached.')
      }

      const data = await response.json()

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: 'assistant',
          content:
            data.message ||
            'The agent returned a response without a readable message.',
        },
      ])
      setStpStatus({
        requires_bpo_action: Boolean(data.requires_bpo_action),
        bpo_draft_form: {
          ...emptyDraftForm,
          ...(data.bpo_draft_form || {}),
        },
      })
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: 'assistant',
          content: `I could not complete the request. ${error.message}`,
          tone: 'error',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleBPOSubmit = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/bpo-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stpStatus.bpo_draft_form),
      })

      if (!response.ok) {
        throw new Error('The BPO handoff endpoint rejected the request.')
      }

      const data = await response.json()
      alert(data.message)
      setStpStatus((currentStatus) => ({
        ...currentStatus,
        requires_bpo_action: false,
      }))
    } catch (error) {
      console.error(error)
      alert(`BPO handoff failed: ${error.message}`)
    }
  }

  const draftForm = {
    ...emptyDraftForm,
    ...(stpStatus.bpo_draft_form || {}),
  }
  const requiresAction = stpStatus.requires_bpo_action

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <section className="flex min-h-[60vh] w-full flex-col border-b border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(225,29,72,0.16),transparent_34%),linear-gradient(180deg,#020617,#0f172a)] lg:min-h-screen lg:w-7/12 lg:border-r lg:border-b-0">
          <header className="border-b border-slate-800/90 px-6 py-5 sm:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-600/15 shadow-[0_0_28px_rgba(225,29,72,0.22)]">
                <MessageSquare className="h-5 w-5 text-rose-300" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-300">
                  SIXth Sense
                </p>
                <h1 className="text-lg font-semibold tracking-normal text-white sm:text-xl">
                  Tactical Compliance Co-Pilot
                </h1>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
            <div className="mx-auto flex max-w-5xl flex-col gap-5">
              {messages.map((message, index) => {
                const isUser = message.role === 'user'

                return (
                  <article
                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                    key={`${message.role}-${index}`}
                  >
                    {!isUser && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-900">
                        <Cpu className="h-4 w-4 text-rose-300" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] rounded-lg border px-4 py-3 text-left text-sm leading-6 shadow-2xl ${
                        isUser
                          ? 'border-rose-500/40 bg-rose-600 text-white shadow-rose-950/30'
                          : message.tone === 'error'
                            ? 'border-amber-400/40 bg-amber-950/40 text-amber-100'
                            : 'border-slate-800 bg-slate-900 text-slate-200 shadow-black/20'
                      }`}
                    >
                      {message.content}
                    </div>
                    {isUser && (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-rose-400/40 bg-rose-600">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </article>
                )
              })}

              {loading && (
                <article className="flex justify-start gap-3">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-900">
                    <Cpu className="h-4 w-4 animate-pulse text-rose-300" />
                  </div>
                  <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 px-4 py-4">
                    <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-700" />
                    <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-slate-800" />
                    <div className="mt-3 h-3 w-1/2 animate-pulse rounded-full bg-slate-800" />
                  </div>
                </article>
              )}
            </div>
          </div>

          <form
            className="sticky bottom-0 border-t border-slate-800 bg-slate-950/92 px-4 py-5 backdrop-blur-xl sm:px-8"
            onSubmit={handleSubmit}
          >
            <div className="relative mx-auto max-w-5xl">
              <input
                className="h-14 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 pr-16 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-rose-500/70 focus:ring-4 focus:ring-rose-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ask about ESG-linked structured products, ISIN coverage, SFDR attributes..."
                type="text"
                value={query}
              />
              <button
                className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-md bg-rose-600 text-white shadow-lg shadow-rose-950/40 transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
                disabled={loading || !query.trim()}
                type="submit"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </section>

        <aside className="flex w-full flex-col bg-slate-950 lg:w-5/12">
          <header className="border-b border-slate-800 px-6 py-5 sm:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-700 bg-slate-900">
                <Database className="h-5 w-5 text-rose-300" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  STP Gateway
                </p>
                <h2 className="text-lg font-semibold tracking-normal text-white sm:text-xl">
                  Master Data STP Gateway
                </h2>
              </div>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-6 px-6 py-6 sm:px-8">
            <section
              className={`rounded-lg border px-5 py-4 ${
                requiresAction
                  ? 'border-amber-400/40 bg-amber-400/10 text-amber-100 shadow-[0_0_40px_rgba(251,191,36,0.12)]'
                  : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
              }`}
            >
              <div className="flex items-center gap-3">
                {requiresAction ? (
                  <ShieldAlert className="h-5 w-5 text-amber-300" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-emerald-300" />
                )}
                <div>
                  <p className="text-sm font-semibold">
                    {requiresAction
                      ? 'Extension Assessment Flagged'
                      : 'Instrument In Scope - No Action Needed'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {requiresAction
                      ? 'BPO routing is primed for a master data extension workflow.'
                      : 'No automated opening request is currently required.'}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    BPO Draft Form
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-white">
                    Data Matrix
                  </h3>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950 px-3 py-1 font-mono text-xs text-rose-300">
                  READ ONLY
                </div>
              </div>

              <div className="grid gap-4">
                {Object.entries(draftForm).map(([key, value]) => (
                  <label className="block" key={key}>
                    <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      {key}
                    </span>
                    <input
                      className="h-11 w-full rounded-md border border-slate-800 bg-slate-950 px-3 font-mono text-sm text-slate-200 outline-none"
                      readOnly
                      value={value ?? 'null'}
                    />
                  </label>
                ))}
              </div>
            </section>

            <div className="mt-auto">
              <button
                className={`flex h-14 w-full items-center justify-center gap-3 rounded-lg text-sm font-bold transition ${
                  requiresAction
                    ? 'bg-amber-300 text-slate-950 shadow-[0_0_34px_rgba(251,191,36,0.35)] hover:bg-amber-200'
                    : 'cursor-not-allowed border border-slate-800 bg-slate-900 text-slate-600'
                }`}
                disabled={!requiresAction}
                onClick={handleBPOSubmit}
                type="button"
              >
                <ShieldAlert className="h-4 w-4" />
                Dispatch Automated Opening Request
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}

export default App
