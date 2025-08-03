function TodoItem(todo: Todo) {
	const part = html` <div @click=${asyncFlow}></div> `
}

function* asyncFlow({ target: editInput }: Event) {
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

/*
Tepui wrap event handler fns
Detects event handler is genFn. Does:

const job = go(editTodo(ev))
component.addRsc(job)
job.onDone(() => component.removeRsc(job))

component.cancel() {
  slot.clear()
   for (const rsc of this._resources) {
      if (rsc instanceof Job) {
         rsc.cancelProm()  // need to implement in ribu
         .catch(walkToNearestErrorBoundary)
      }
   }
  launchNewComponent()
}

*/