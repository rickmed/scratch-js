/* Events */

type Todo = {
   title: string
   completed: boolean
   id: string
}

type Filter = { selected: "All" | "Active" | "Completed" }

function Todos(filter: Filter) {
	const todos: Todo[] = Store([])

   on(TodoItem, 'delete', 'click', (todo, ev) => {
      todos.remove(todo)
   })

   return List(filteredTodos, todo => TodoItem(todo))


   function filteredTodos() {
      const { selected } = filter
      return todos.filter((t) =>
         selected == "All" ? t :
         selected === "Active" ? !t.completed :
         t.completed
      )
   }
}


const TodoView = li({ class: $.class },
   div(
      { class: "view" },
      input({
         class: "toggle",
         type: "checkbox",
         checked: $.checked,
         onchange: () => (todo.completed = !todo.completed),
      }),
      label({ onDblClick: editTodo}, $.title),
      button({ id: $.delete, class: "destroy" })
   ),
   input({ class: "edit", type: "text" })
)

function TodoItem(todo: Todo) {
   return TodoView({ title: todo.title })
	.auto(({ $ }) => {
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