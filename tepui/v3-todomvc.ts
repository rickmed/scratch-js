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

   return h.div(
		Header,
		[Todos, filter],
		Footer
	)
}

function Todos(filter) {
	const todos = Store([]);

	return List(newTodos, (todo) => {
	  return TodoItem(todo)
		// .on is pretty much just TodoItem._elem.querySelector(`[${deleteElem}]`).addEventListener(...)
	  	.on(deleteElem, "click", (ev) => {
			todos.remove(todo);
		});
	});

	function newTodos() {
	  const { selected } = filter;
	  return todos.filter((t) =>
		  selected == "All"
			  ? t
			  : selected === "Active"
			  ? !t.completed
			  : t.completed
	  );
	}
 }

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
         h.button({class: "destroy", $part: "delete"})
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

/* Event delegation */


function Todos_event_delegation(filter: Filter) {
	const todos = Store([])

	const ul = ctx.mySlot

	const tag = Delegate<Todo>(ul, TodoItem)
	  .on("delete", "click", (todo, ev) => {
			todos.remove(todo)
	  })
	  .on("toggle", "change", (todo, ev) => {
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

 function Delegate<T>(container: HTMLElement, PartCtor: () => Part) {
	const dataUuid = crypto.randomUUID()

	function tag(componentFn: (data: T) => any) {
		return (data: T) => {
		  const element = componentFn(data)
		  element._dom.setAttribute(`data-${dataUuid}`, data)
		  return element
		}
	 }

	function on(kindId: string, eventType: string, handler: (data: T, ev: Event) => void) {
	  container.addEventListener(eventType, (ev) => {
		 const target = ev.target as HTMLElement
		 const kind = target.dataset.kind

		 if (kind !== kindId) return

		 // Find the closest element that has our data
		 const dataElement = target.closest(`[data-${dataUuid}]`)
		 if (dataElement) {
			const todo = (dataElement as HTMLElement).dataset[dataUuid] as T
			handler(todo, ev)
		 }
	  })

	  return tag
	}

	tag.on = on

	return tag
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

function TodoItem_withTempalte(todo) {
   return TodoView({ title: todo.title }).auto(...)
}