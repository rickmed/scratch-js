function FilterLink1(name: string, store: Filter) {
	const part = html`
      <$li li>
         <$a a></a>
         <$p p></p>
      </li>
   `
   part.$.a.text = name
   part.$.a.href = name.toLowerCase()
   part.$.p.text = name.toUpperCase()

   return part.auto(({ $ }) => {
      $.li.class = store.selected === name ? "selected" : ""
   })
}

function FilterLink2(name: string, store: Filter) {
	return html`
      <$li li>
         <a href=${`#${name.toLowerCase()}`}>
            ${name}
         </a>
      </li>
   `.auto(({ $ }) => {
		$.li.class = store.selected === name ? "selected" : ""
	})
}


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