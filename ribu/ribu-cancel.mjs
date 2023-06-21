/*
	ok so I guess .cancel() needs to be yielded?
		cause I'd need to wait for things to be cancelled?
*/

let proc = go(function * () {
	setState({ word: "Connecting in a moment..." });

	yield csp.timeout(500);

	let ws;
	try {
	  ws = new WebSocket("http://wat.com");
	  setState({ word: "Connecting now..." });

	  yield makeOnConnectChannel(ws);

	  setState({ word: "Connected!" });

	  let chan = makeMessageChannel(ws);
	  while (true) {
		 let value = yield chan;
		 setState({ word: `Got message: ${value}` });
	  }
	} finally {
	  ws.close();
	  setState({ word: "Disconnected!" });
	  // ...and any other cleanup
	  // this block would be invoked upon termination
	  // (a lesser known fact about generators is that calling .throw/.return
	  // on them will still run finally blocks and even let you yield additional values before closing)
	}
 });

 // later, after user presses a button, or leaves a route
 proc.kill();
