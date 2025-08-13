// app.ts — Tepui-ish example (no routing)
// Assumes: `h` builds elements, `.auto(fn)` re-runs when tracked reads change.

import { h } from "tepui"

// --- Store ------------------------------------------------------

type Msg = { id: number; from: string; subject: string; body: string; read: boolean }

function InboxStore() {
  const state = {
    messages: [
      { id: 1, from: "Alice", subject: "Hi", body: "Hello!", read: false },
      { id: 2, from: "Bob",   subject: "Update", body: "News…", read: true  },
      { id: 3, from: "Zoe",   subject: "Ping", body: "Are you there?", read: false },
    ] as Msg[],

    markRead(id: number) {
      const m = state.messages.find(m => m.id === id)
      if (m && !m.read) m.read = true
    },

    get unreadCount() {
      // Tepui should track this read so `.auto` can re-run
      return state.messages.filter(m => !m.read).length
    },
  }
  return state
}

const store = InboxStore()

// --- UI ---------------------------------------------------------

function Header(store: ReturnType<typeof InboxStore>) {
  return h.header(
    h.nav(
      h.strong({ id: "unread-count" }, "Unread: ", h.span({ ref: $.count }, "0")),
    ),
  ).auto(({ $ }) => {
    // Keep the counter in sync with store state
    $.count.textContent = String(store.unreadCount)
  })
}

function MessageItem(store: ReturnType<typeof InboxStore>, m: Msg) {
  return h.li(
    { class: $.cls },
    h.span(`${m.from} — ${m.subject}`),
    h.button(
      {
        disabled: $.disabled,
        onclick: () => store.markRead(m.id),
        title: "Mark as read",
      },
      "✓",
    ),
  ).auto(({ $ }) => {
    $.cls = m.read ? "read" : ""
    $.disabled = m.read ? true : false
  })
}

function InboxList(store: ReturnType<typeof InboxStore>) {
  return h.section(
    h.h1("Inbox"),
    h.ul(
      // Map current messages to <li> items
      ...store.messages.map(m => MessageItem(store, m)),
    ),
  )
}

function App() {
  return h.main(
    Header(store),
    InboxList(store),
  )
}
