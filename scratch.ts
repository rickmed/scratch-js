import { counter } from "effect/MetricState"

function Todos_event_delegation(filter: Filter) {
   const todos = Store([])

   const tag = Delegate<Todo>(ul)
      .on(deleteElem, "click", (todo, ev) => {
         todos.remove(todo)
      })
      .on(toggleTodo, "change", (todo, ev) => {
         todo.completed = !todo.completed
      })

   return List(newTodos, tag(TodoItem))

   function newTodos() {
      const { selected } = filter
      return todos.filter((t) =>
         selected == "All"
            ? t
            : selected === "Active"
            ? !t.completed
            : t.completed
      )
   }
}

