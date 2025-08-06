const Cell = <T>(obj: T): T => obj

function FilterLink(name: string, store: Filter) {
   return html`
      <li class=${$.class}>
         <a href=${`#${name.toLowerCase()}`}> ${name} </a>
      </li>
   `.auto(({ $ }) => {
      $.class = store.selected === name ? "selected" : ""
   })
}

type Filter = { selected: "All" | "Active" | "Completed" }

class FilterLinks {
   static Store = () => Cell({ selected: "All" } as Filter)

   // Component method (could be static too if you prefer)
   static Part(store: Filter) {
      return html`
         <ul class="filters">
            ${FilterLink("All", store)} ${FilterLink("Active", store)}
            ${FilterLink("Completed", store)}
         </ul>
      `
   }
}

function Footer() {
   return html`
      <footer class="footer">
         <span class="todo-count">
            <strong>${this.todoList?.active.length}</strong>
            items left
         </span>
         ${FilterLinks()}
         ${(this.todoList?.completed.length ?? 0) > 0
            ? html`<button
                 @click=${this.#onClearCompletedClick}
                 class="clear-completed"
              >
                 Clear Completed
              </button>`
            : nothing}
      </footer>
   `
}

function Main() {
   const filter = FilterLinks.Store()

   const header = Header()
   const footer = Footer()
   const todos = Todos(filter)

   html` <div>${header} ${todos} ${footer}</div> `
}

function Todos(filter: Filter) {
   const todos = Store([])

   auto(({ $ }) => {
      const { selected } = filter
      const newTodos = todos.filter((t) =>
         selected == "All"
            ? t
            : selected === "Active"
            ? !t.completed
            : t.completed
      )

      // has inside old todos, only adds/removes/reorder (todo item change must be inside Todo component)
      diffAndPatch(newTodos, (todo: Todo) => {
         const part = TodoItem(todo)
         part.on("delete", () => todos.remove(todo))
         return part
      })
   })
}

/* SSR vs clien
	I think re-run on client to run part.on(...), ie, insert listeners is too expensive.
	Let's do event delegation





*/

type Todo = {
   title: string
   completed: boolean
}

const TodoView = li(
   { class: $.class },
   div(
      { class: "view" },
      input({
         class: "toggle",
         type: "checkbox",
         checked: $.checked,
         onchange: () => (todo.completed = !todo.completed),
      }),
      label({ onDblClick: editTodo }, $.title),
      button({ id: $.delete, class: "destroy" })
   ),
   input({ class: "edit", type: "text" })
)

function TodoItem(todo: Todo) {
   return TodoView({ title: todo.title }).auto(({ $ }) => {
      // html detects .class is a slot so it returns an object with methods instead of simple setter.
      // with .clear() and .set()  (maybe more look dom methods)
      $.class.add(todo.completed ? "completed" : "")
      $.checked = todo.completed
   })

   function* editTodo({ target: editInput }: Event) {
      const todoClass = part.$.class
      todoClass.add("editing") // or just input.show() or just .replace(todo)
      onEnd(() => todoClass.remove("editing"))

      yield* paint

      const enter = editInput.on("keyDown", ({ key }) => key === "Enter")
      const escape = editInput.on("keyDown", ({ key }) => key === "Escape")
      const blur = editInput.on("blur")
      const ev = yield* any([enter, escape, blur])
      if (ev === enter) {
         todo.title = editInput.value
      }
   }
}
