// === src/components/Footer.js ===
import { footer, span, strong, button } from 'tepui';
import { Loading }                      from './Loading.js';
import { getTodosStore }                from '../todosStore.js';
import { getFilterStore }               from '../filterStore.js';

export async function* Footer() {
  const { todos, ready: todosReady }       = getTodosStore();
  const { selected, ready: filterReady }   = getFilterStore();
  const slot = allocateSlotId();

  // placeholder
  html`<div data-tp-slot="${slot}">${Loading('Loading footer…')}</div>`;

  // wait for both stores
  await Promise.all([todosReady, filterReady]);

  html`
    <template data-tp-slot="${slot}">
      ${(() => {
        const list        = todos();
        const activeCount = list.filter(t => !t.completed).length;
        const completed   = list.length - activeCount;

        return footer(
          { class: 'footer' },
          span({ class: 'todo-count' },
            strong({}, `${activeCount}`),
            ' items left'
          ),
          // FilterLinks(selected()) — you could inject your FilterLinks here
          completed > 0
            ? button({
                class: 'clear-completed',
                onclick: () => {
                  todos.set(list.filter(t => !t.completed));
                }
              }, 'Clear completed')
            : null
        );
      })()}
    </template>
  `;
}
