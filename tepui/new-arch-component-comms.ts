// Let's say these are just buttons (no navigation). When any of them click,
// these need to know:
   // TodoList
      // render the list of the button that clicked (need to tag each button and filter)
   // The other filter buttons
      // On the same clicked button, it needs to add "selected" class.
      // Others need listen to remove "selected" class

// or
   // - TodoList: renders whatever view.store === is.
   // - Buttons classes idem
   // That is much simpler. Now, show creates that store?
   //    Probably the manager of those 3 buttons (Footer component maybe)
   // Let's do that.
      // Let's see how to create and share.


export const FilterStore = () =>
   cell({ selected: "All" as "All" | "Active" | "Completed" })

function FilterLink(name: string, store: ReturnType<typeof FilterStore>) {
   return html`
      <li class: ${$.class}>
         <a href=${`#${name.toLowerCase()}`}>
            ${name}
         </a>
      </li>
   `
   .sync(part => {
      part.class = store.selected === name ? "selected" : ""
   })
}

function FilterLinks() {
   const store = FilterStore()

   return html`
      <ul class="filters">
         ${FilterLink("All", store)}
         ${FilterLink("Active", store)}
         ${FilterLink("Completed", store)}
      </ul>
   `
}

function FilterLinks() {

   return html`
      <footer class="footer">
         <span class="todo-count">
            <strong>${this.todoList?.active.length}</strong>
            items left
         </span>

         ${(this.todoList?.completed.length ?? 0) > 0 ? html`<button @click=${this.#onClearCompletedClick} class="clear-completed">Clear Completed</button>` : nothing}
      </footer>
   `
   .
}
