// Turn a union of objects into a single intersected object type
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends
  (k: infer I) => void ? I : never;

function div<const V extends object[]>(
  _s: TemplateStringsArray,
  ...vals: V
): UnionToIntersection<V[number]> {
  // runtime: merge every object hole; ignore non-objects if you ever pass them
  const out: any = {};
  for (const v of vals) if (v && typeof v === 'object') Object.assign(out, v);
  return out;
}


function *Timer(seconds = 0) {
  // div makes it observable and returns a getter/setter that directly mutates the DOM.
  // yield renders and publishes the vars.
  const out = yield div`Seconds: ${{seconds}}`

  out.onclick = () => {
    out.seconds++
  }

  go(function* () {
    for (;;) {
      yield sleep(1000);
      out.seconds++
    }
  })
}

const component = Scene(Timer)

/*
The above is super cool (and works).
Issues:
  - Updates from network. In model-view signals, the view updates from the model-view mutations.
    - Maybe we can use "actions" as events.

  - Persisting: since seconds var is published, the interpreter could subscribe to changes.
  - We loose types (as any lit-html template).
*/


function* Todo(title: string, completed = false) {
  const out = yield* li`
    <input type="checkbox" class=${completed ? 'checked' : ''} />
    <span>${title}</span>
    <button>Delete</button>
  `;

  out.input.onChange = () => {
    out.completed = out.input.checked
    // Issue: now todo list doesn't know about this change.
    //
  }

  out.querySelector('input')!.onchange = (e) => {
    completed = (e.target as HTMLInputElement).checked;
    console.log(`Todo "${title}" completed status: ${completed}`);
  };

}





// ---------- helpers ----------
const PUB = Symbol('pub');

type Pub<T> = { [PUB]: true; value: T };
const pub = <T>(value: T): Pub<T> => ({ [PUB]: true, value }) as any;

type YieldOf<G> = G extends Generator<infer Y, any, any> ? Y : never;
type GenFn = (...args: any[]) => Generator<any, any, any>;
type YieldOfFn<F extends GenFn> = YieldOf<ReturnType<F>>;

// Pick only the branded ones:
type PublicYields<Y> = Y extends Pub<infer V> ? V : never;

function run<F extends GenFn>(fn: F) {
  const it = fn();
  return {
    next: it.next.bind(it),
    return: it.return?.bind(it),
    throw: it.throw?.bind(it),
    iterator: it,
    yields: undefined as unknown as PublicYields<YieldOfFn<F>>,
  };
}

// ---------- usage ----------
function* Hello() {
  yield 1;                 // private
  yield pub("yes" as const)
  yield { a: 123 };        // private
}

const source = run(Hello);
//    ^? source.yields -> "yes"

type _Check = typeof source.yields; // "yes"






// ----------------- usage -----------------
const { var1, var2 } = div`
  Some text: ${{ var1: 0 }} ${{ var2: "yes" }}
`;
