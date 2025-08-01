function FilterLink(name: string, store: Filter) {
	return html`
      <li class: ${$.class}>
         <a href=${`#${name.toLowerCase()}`}>
            ${name}
         </a>
      </li>
   `.auto(({$}) => {
		$.class = store.selected === name ? "selected" : "";
	});
}

type Filter = { selected: "All" | "Active" | "Completed" };

class FilterLinks {
	static Store = () => Cell({ selected: "All" } satisfies Filter);

	// Component method (could be static too if you prefer)
	static Part(store: Filter) {
		return html`
			<ul class="filters">
				${FilterLink("All", store)} ${FilterLink("Active", store)}
				${FilterLink("Completed", store)}
			</ul>
		`;
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
	`;
}

function Main() {
	const todosFilter = FilterLinks.Store();

	const header = Header();
	const footer = Footer();
	const todos = Todos(todosFilter);

	html` <div>${header} ${todos} ${footer}</div> `;
}

type Todo = {
   title: string
   completed: boolean
}

function TodoItem(todo: Todo) {

   let editJob: Job = MockJob

	const part = html`
		<li class=${$.class}>
			<div class="view">
				<input
					class="toggle"
					type="checkbox"
					.checked=${$.checked}
					@change=${() => todo.completed = !todo.completed}
				/>
				<label @dblclick=${() => go(editTodo)}> ${todo.title} </label>
				<button id="delete" class="destroy"></button>
			</div>
			<input
				class="edit"
				type="text"
				@change=${this.#finishEdit}
				@keyup=${this.#captureEscape}
				@blur=${this.#abortEdit}
				.value=${this.text ?? ""}
			/>
		</li>
	`
   .auto(({$}) => {
      // html detects .class is a slot so it returns an object with methods instead of simple setter.
         // with .clear() and .set()  (maybe more look dom methods)
      $.class.add(todo.completed ? "completed" : "")
      $.checked = todo.completed
   })

   // todo: try to infer ev param to be  this from template @dblclick
   // todo: how is this job cancelled if TodoItem part is cancelled from parent?
   function* editTodo(ev: Event) {
      const todoClass = part.$.class
      todoClass.add("editing")
      onEnd(() => todoClass.remove("editing"))
      
   }
}


// <li className={[
//    todo.completed ? "completed": "",
//    this.isBeingEdited ? "editing" : ""
// ]