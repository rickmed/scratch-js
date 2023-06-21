import { Worker } from "node:worker_threads"

const worker = new Worker('./nodejs/worker-threads/worker1.js')


// odd messages are worker -> parent time.
let msgs = []

let sent = performance.now()

worker.on("message", msgObj => {

	let sentThen = sent
	sent = performance.now()
	msgs.push(sent - sentThen)
	msgObj.sent = sent
	worker.postMessage(msgObj)

	if (msgs.length === 40) {
		worker.terminate()
	}
})


worker.on("exit", () => {
	msgs.shift()
	let sum = 0
	for (const msg of msgs) {
		sum += msg
	}
	console.log("avg msg sendg time: ")
	console.log((sum / (msgs.length))/ 2)
	// interval.unref()
})

msgObj.sent = sent
worker.postMessage(msgObj)


const msgObj = {
	name: 'John Doe',
	email: 'johndoe@example.com',
	age: 30,
	address: {
	  street: '123 Main Street',
	  city: 'Anytown',
	  state: 'CA',
	  zipcode: '12345',
	  coordinates: {
		 latitude: 37.774929,
		 longitude: -122.419418,
	  },
	},
	hobbies: ['coding', 'hiking', 'reading'],
	favorite_books: [
	  {
		 title: `'The Hitchhiker's Guide to the Galaxy'`,
		 author: 'Douglas Adams',
		 year: 1979,
		 rating: 5,
		 reviews: [
			{
			  author: 'Bard',
			  text: 'This book is a classic!',
			},
			{
			  author: 'Alice',
			  text: 'I didn\'t really like this book.',
			},
		 ],
	  },
	  {
		 title: 'The Lord of the Rings',
		 author: 'J.R.R. Tolkien',
		 year: 1954,
		 rating: 4,
		 reviews: [
			{
			  author: 'Bard',
			  text: 'This book is a masterpiece!',
			},
			{
			  author: 'Alice',
			  text: 'I didn\'t really understand this book.',
			},
		 ],
	  },
	  {
		 title: 'The Catcher in the Rye',
		 author: 'J.D. Salinger',
		 year: 1951,
		 rating: 3,
		 reviews: [
			{
			  author: 'Bard',
			  text: 'This book is a coming-of-age story.',
			},
			{
			  author: 'Alice',
			  text: 'I didn\'t really relate to this book.',
			},
		 ],
	  },
	],
	movies_watched: [
	  {
		 title: 'The Shawshank Redemption',
		 year: 1994,
		 rating: 9.3,
		 watched_on: new Date('2023-03-08'),
	  },
	  {
		 title: 'The Godfather',
		 year: 1972,
		 rating: 9.2,
		 watched_on: new Date('2022-12-25'),
	  },
	  {
		 title: 'The Dark Knight',
		 year: 2008,
		 rating: 9.0,
		 watched_on: new Date('2022-09-11'),
	  },
	],
 };