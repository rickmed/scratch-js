function FilterLink(name: string, store: Filter) {
   return html`
      <li class: ${$.class}>
         <a href=${`#${name.toLowerCase()}`}>
            ${name}
         </a>
      </li>
   `
   .auto(slots => {
      slots.class = store.selected === name ? "selected" : ""
   })
}


type Filter = { selected: "All" | "Active" | "Completed" }

class FilterLinks {

   static NewStore = () => Cell({ selected: "All"} satisfies Filter)

   // Component method (could be static too if you prefer)
   static Part(store: Filter) {
      return html`
         <ul class="filters">
            ${FilterLink("All", store)}
            ${FilterLink("Active", store)}
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
         ${(this.todoList?.completed.length ?? 0) > 0 ? html`<button @click=${this.#onClearCompletedClick} class="clear-completed">Clear Completed</button>` : nothing}
      </footer>
   `
}


function Main() {
   const header = Header()
   const footer = Footer()
   const todos = Todos(footer.store)

   html`
      <div>
         ${header}
         ${todos}
         ${footer}
      </div>
   `
}
