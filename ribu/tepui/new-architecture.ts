
/****  Pure signals  ****/
// CON: Sometimes unperformant.
// CON: Complex implementation.

class CounterStore {
  count = 0;

  constructor() {
    makeAutoObservable(this);
  }

  increment() {
    this.count += 1;
  }
}

const counterStore = new CounterStore();

const CounterButton = observer(() => {
  return (
    <button onClick={() => counterStore.increment()}>
      Count: {counterStore.count}
    </button>
  );
});

const Doubler = observer(() => {
  return (
    <div>
      The count times 2 is: {counterStore.count * 2}
    </div>
  );
});



/****  Pure oop imperative  ****/
// CON: button needs to be changed for all new clients (poor encapsulation).

button.onClick() {
  let newCount = me.count = count++
  this.Doubler.double(newCount)
}



/****  New architecture  ****/

function* TodoList() {
   const todosStore = Store<TodoObj[]>([])
   const parent = dom("ul")
   while (true) {
      // compute subscribe to all obj accesses in getFilteredTodos, unblocks when any of those changes.
      const todosToShow = yield* compute(todosStore, visibleTodos) // can optionally pass explicit dependencies so you can test function outside of a component

      diffAndUpdateList(prev, todosToShow, parent, (todo, i) =>
        ui("li",
          ui("input", { type: "checkbox", checked: todo.completed }),
          ui("span", { style: { textDecoration: todo.completed ? "line-through" : "none" } }, todo.text),
          ui("button", "x")
        )
      ))
   }
}

function visibleTodos(store) {
  switch (store.filter) {
    case 'active':
      return store.todos.filter(t => !t.completed);
    case 'completed':
      return store.todos.filter(t => t.completed);
    default:
      return store.todos;
  }
}

/* Doing
  - How to abstract For
  - Event handling

*/