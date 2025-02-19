function* Todo(todo: Signal<TodoObj>, todosStore) {
   // need to update ui when fetchData is loading
   const data = yield fetchData()

   // ui sets update signals callback only in browser, in server it returns html
   const scene = ui('li', 'todoDom',
      ui('div', { class: "view" },
         ui('checkbox', { class: `toggle`, checked: todo.completed, onchange: completeTodo }),
         ui.title(todo.title),
         deleteBttn(`.destroy`, onclick: deleteTodo)
      ),
      // this element here is dumb here per todomvc, but you know, css.
      editingInput(`.edit`, { value: todo.title, onblur: exitEdit, onkeydown: exitEdit }),
      Footer(todosStore.count) // computed property
   )

   function completeTodo() {
      // signal triggers ui render
      todo.completed = !todo.completed
      // change checkbox's class directly on dom.
         // scene have properties named statically,
         // if you name two elements with the same name, ui() throws.
      scene.todoDom.classList.toggle(`completed`)
   }
}


// Todos:
// 1) DONE: How is the component html/elements composed and sent with the rest.
   // This is easy, ui() just need to be a bit smart about if in server or client.
// 2) DONE: How to access direct dom in browser (see completeTodo*)
   // Easy, cause these are done in event handlers which don't run in SSR.
// 3) DONE: What is the flow of fetching (running something) in SSR vs front.
   // When ran on browser, fetchData() could just return the same data gottten server side.
      // it attaches to the data to some html element (like remix js)

// 4) When HTML is sent from back, how does tepui knows which elements are present to attach listeners.
   // First, Ribu on server sets a uuid for root html/dom element
   // so the ribu functions* runs again, but what they call (fetchData(), ui()...) behave differently.
      // need to check how signals and computed looks like
      // SERVER: fetchData() runs normally, ui() returns html with uuid (signals get instantiated but ui() does not set update callbacks)
      // CLIENT: fetchData() gets the data from some part in HTML, signals get instantiated and functions* are ran.
         // ui() needs to be smarter (let's finish client side first)

// 5) DONE: How can ui update based on task state (like ember concurrency)
   // I think wrapping task in a signal is good.

function* Footer(data) {
   const resData = yield fetchData(data)

   ui('li')
}