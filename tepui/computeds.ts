export const _store = {
   get activeCount() {
      return todos.filter((t) => !t.completed).length.toString()
   },
   get activeCountText() {
      return _store.activeCount === "1" ? "" : "s"
   }
}

function Footer(todos: Todo[]) {

   const store = Store(_store)

   // each thing can return a template that can be cached like lit-html and executed by render()
   render(
      footer(".footer",
         span(".todo-count",
            strong(store.activeCount), span(store.activeCountText)
         ),
         ul("filters",
            filterLink("Active"),
            filterLink("Completed"),
            filterLink("All"),
         ),
         button(".clear-completed", "Clear completed"),
      )
   )
}

const ActiveCount = (todos: Todo[]) => {
   return todos.filter((t) => !t.completed).length.toString()
}


function Footer(todos: Todo[]) {

   const activeCount = ActiveCount(todos)

   // each thing can return a template that can be cached like lit-html and executed by render()
   render(
      footer(".footer",
         span(".todo-count",
            strong(activeCount), span(() => activeCount === "1" ? "" : "s")
         ),
         ul("filters",
            filterLink("Active"),
            filterLink("Completed"),
            filterLink("All"),
         ),
         button(".clear-completed", "Clear completed"),
      )
   )
}
