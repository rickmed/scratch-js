function FilterLink3(name: string, store: Filter) {
   return li({id: $.li},
      a({href: `#${viewFilter.toLowerCase()}`}, name)
   )
   .auto(part => {
      part.$.li.class = store.selected === name ? "selected" : ""
   })
}

const View =
   li({id: $.li},
      a({href: $.href}, $.name)
   )

function FilterLink4(name: string, store: Filter) {
   return View({href: `#${name.toLowerCase()}`, name})
      .auto(part => {
         part.li.class = store.todoFilter === viewFilter ? "selected" : ""
      })
}