import { h } from "tepui"

const Cell = <T>(obj: T): T => obj

function FilterLink(name: string, store: Filter) {
   return h
      .li({ class: $.class }, h.a({ href: `#${name.toLowerCase()}` }, name))
      .auto(({ $ }) => {
         $.class = store.selected === name ? "selected" : ""
      })
}

type Filter = { selected: "All" | "Active" | "Completed" }

class FilterLinks {
   static Store = () => Cell({ selected: "All" } as Filter)

   // Component method (could be static too if you prefer)
   static Part(store: Filter) {
      return h.ul(
         { class: "filters" },
         FilterLink("All", store),
         FilterLink("Active", store),
         FilterLink("Completed", store)
      )
   }
}

function Footer() {
   return h.footer(
      { class: "footer" },
      h.span(
         { class: "todo-count" },
         h.strong({}, this.todoList?.active.length),
         " items left"
      ),
      FilterLinks.Part(FilterLinks.Store()),
      (this.todoList?.completed.length ?? 0) > 0
         ? h.button(
              {
                 class: "clear-completed",
                 onClick: () => this.#onClearCompletedClick(),
              },
              "Clear Completed"
           )
         : null
   )
}

function Main() {
   const filter = FilterLinks.Store()

   const header = Header()
   const footer = Footer()
   const todos = Todos(filter)

   div({}, header, todos, footer)
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
      diffAndPatch(newTodos, (todo: Todo) => TodoItem(todo))
   })
}

// https://chatgpt.com/c/6892174c-1270-8322-8d87-acede5d5dbf2?model=o4-mini-high
// todo and event are typed
// todo is the arg passed to TodoItem
on(TodoItem, "delete", "click", (todo, ev) => {
   todosStore.todos = todosStore.todos.filter((t) => t !== todo)
})

type Todo = {
   title: string
   completed: boolean
}

function TodoItem(todo: Todo) {
   return
   h.li({class: $.class},
      h.div(
         { class: "view" },
         h.input({
            class: "toggle",
            type: "checkbox",
            checked: $.checked,
            onchange: () => (todo.completed = !todo.completed),
         }),
         h.label(
            {
               onDblClick: editTodo,
            },
            todo.title
         ),
         h.button({ id: $.delete, class: "destroy" })
      ),
      h.input({ class: "edit", type: "text" })

   ).auto(({ $ }) => {
      // html detects .class is a slot so it returns an object with methods instead of simple setter.
      // with .clear() and .set()  (maybe more look dom methods)
      $.class.add(todo.completed ? "completed" : "")
      $.checked = todo.completed
   })

   // todo: try to infer ev param to be this from template @dblclick

   // todo: how is this job cancelled if TodoItem part is cancelled from parent?
   // this could be added to part._resources so on part.cancel() everything is cancelled.
   // main issue is async cancellation. bc now in theory every part must
   // be wrapped in a job to do yield* part.cancel() -> too expensive

   /*



*/

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



/* Other things */

/* Rendering */

// Replacing vs appending
function* Component2(store: { someSignal: string }) {
   h.p({ text: "Loading input..." }) // Replaces whatever is in this component view slot

	// do other things ...

	h.div(`Replaces things`).append()
	// For things like:
		// Chat messages, logs, notifications
		// Infinite scroll / pagination
		// Building up lists incrementally
		// Progressive enhancement
}


// Templates for optimization (compile once)
const TodoView = h.li.template({ class: $.class },
   h.div('.view',
      h.input.checkbox({ checked: $.checked }),
      h.label($.title)
   )
)

function TodoItem(todo) {
   return TodoView({ title: todo.title }).auto(...)
}