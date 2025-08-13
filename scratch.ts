<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>SPA Inbox (Vue)</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 20px; }
      header { display:flex; gap:1rem; align-items:center; margin-bottom: 1rem; }
      li.read { opacity: .5; }
      a { cursor:pointer; color: blue; text-decoration: underline; }
    </style>
  </head>
  <body>
    <div id="app"></div>

    <!-- Vue 3 + Vue Router (CDN) -->
    <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
    <script src="https://unpkg.com/vue-router@4/dist/vue-router.global.prod.js"></script>

    <script type="module">
      const { createApp, reactive, computed, onMounted } = Vue;
      const { createRouter, createWebHistory, useRoute, useRouter } = VueRouter;

      // ---- Mock "API" (JSON) ----
      const db = reactive({
        messages: [
          { id: 1, from: 'Alice', subject: 'Hi',    body: 'Hello!', read: false },
          { id: 2, from: 'Bob',   subject: 'Update', body: 'News…', read: true  },
          { id: 3, from: 'Zoe',   subject: 'Ping',  body: 'Are you there?', read: false },
        ]
      });
      const api = {
        async list()   { return JSON.parse(JSON.stringify(db.messages)); },
        async get(id)  { return JSON.parse(JSON.stringify(db.messages.find(m => m.id==id))); },
        async markRead(id) { const m=db.messages.find(m=>m.id==id); if (m) m.read = true; return { ok:true }; }
      };

      // ---- Global store (client owns state & rendering) ----
      const store = reactive({
        messages: [],
        get unreadCount() { return store.messages.filter(m => !m.read).length; }
      });

      // ---- Components ----
      const Layout = {
        template: `
          <header>
            <nav>
              <a @click.prevent="$router.push('/inbox')">Inbox</a>
            </nav>
            <strong>Unread: {{ unread }}</strong>
          </header>
          <router-view />
        `,
        setup() {
          const unread = computed(() => store.unreadCount);
          onMounted(async () => { if (!store.messages.length) store.messages = await api.list(); });
          return { unread };
        }
      };

      const Inbox = {
        template: `
          <ul>
            <li v-for="m in messages" :key="m.id" :class="{read:m.read}">
              <a @click.prevent="open(m.id)">{{ m.from }} — {{ m.subject }}</a>
              <button @click="mark(m.id)" :disabled="m.read">✓</button>
            </li>
          </ul>
        `,
        setup() {
          const router = useRouter();
          return {
            messages: store.messages,
            open: (id) => router.push(`/message/${id}`),
            mark: async (id) => { await api.markRead(id); store.messages = await api.list(); }
          };
        }
      };

      const Message = {
        template: `
          <article v-if="msg">
            <h1>{{ msg.subject }}</h1>
            <p><em>From: {{ msg.from }}</em></p>
            <p>{{ msg.body }}</p>
            <button @click="back">Back</button>
          </article>
        `,
        setup() {
          const route = useRoute(), router = useRouter();
          const id = Number(route.params.id);
          const msg = Vue.ref(null);
          onMounted(async () => {
            await api.markRead(id);                         // mark read on open
            store.messages = await api.list();              // update counter & list
            msg.value = await api.get(id);
          });
          return { msg, back: () => router.push('/inbox') };
        }
      };

      // ---- Router (client-side) ----
      const router = createRouter({
        history: createWebHistory(),
        routes: [
          { path: '/', redirect: '/inbox' },
          { path: '/inbox', component: Inbox },
          { path: '/message/:id', component: Message }
        ]
      });

      createApp(Layout).use(router).mount('#app');
    </script>
  </body>
</html>
