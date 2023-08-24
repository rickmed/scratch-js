// RxJS v6+
import { interval } from "rxjs";
import { map } from "rxjs/operators";

const source = interval(1000)

const example = source.pipe(map((x) => {
  if (x === 4) {
    throw new Error("BUUU")
  }
  else return x * 2
}))

const subscribe = example.subscribe((val) => console.log(val))