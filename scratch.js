const obj = {
	y: 25,
	*meth(x) {
		console.log(this.y)
	}
}

obj.meth().next()

// meth(5)


/* if ($childS === undefined)  && onCancel.constructor === Function) */