// so in tepui

function* ListManager(selectEl) {
   const ul = getParentDom() // ul
   for (;;) {
      const sortOption: string = yield* selectEl.on("change")
      // need to check if component is starting (need to create elements)
   }
}



function sortList(parentElement: HTMLElement, compareFn: (a: HTMLElement, b: HTMLElement) => number) {
  const items = [...parentElement.children];
  items.sort(compareFn);

  const frag = document.createDocumentFragment();
  items.forEach(el => frag.appendChild(el));

  // This removes element from parent and moves each element to its new position
  parentElement.appendChild(frag);
}



const todos = [
{ id: 1, text: "Pay bills",    priority: 3 },
{ id: 2, text: "Buy groceries", priority: 1 },
{ id: 3, text: "Walk the dog",  priority: 2 }
];

const selectEl = document.getElementById("sort-select");
const listEl = document.getElementById("todo-list");

function renderList(sortKey) {
   // Clear current list
   listEl.innerHTML = "";

   // Create sorted copy
   const sorted = [...todos].sort((a, b) => {
   if (sortKey === "name") {
      return a.text.localeCompare(b.text);
   } else {
      return a[sortKey] - b[sortKey];
   }
   });

   // Create and append <li> elements
   for (const todo of sorted) {
      const li = document.createElement("li");
      li.textContent = `#${todo.id} – ${todo.text} (priority: ${todo.priority})`;
      listEl.appendChild(li);
   }
}

// Initial render
renderList(selectEl.value);

// Listen to sort changes
selectEl.addEventListener("change", (e) => {
   renderList(e.target.value);
});
