// proxy‑holes.ts

// 1) Your Hole type
type Hole<K extends string> = { key: K }

// 2) Your dynamic `$` proxy
const $: { [K in string]: Hole<K> | undefined } = new Proxy(
  {},
  {
    get(_target, prop) {
      if (typeof prop === "string") {
        return { key: prop } as Hole<typeof prop>
      }
      return undefined
    },
  }
)

// 3) Mix of static values, holes, and other types
const testAttributes = {
  class: "static-class-name",  // static → not a hole
  href:  $.href,               // hole “href”
  text:  $.text,               // hole “text”
  id:    123,                  // neither string nor Hole → ignored
}

// 4) Helper to pick out Hole<T> from any T
type IsHole<T> = Extract<T, Hole<string>>

// 5) Filter only the hole‑keys, mapping them to `string`
type FilterHoles<T> = {
  [K in keyof T as IsHole<T[K]> extends never ? never : K]: string
}

// 6) Now FilterHoles<typeof testAttributes> is:
//    { href: string; text: string }
type OnlyHoles = FilterHoles<typeof testAttributes>

// 7) Build your `u` factory:
//    • Spec can be any record of static values, holes, etc.
//    • Returns a function accepting Partial<FilterHoles<Spec>>
declare function u<
  Tag extends string,
  Spec extends Record<string, any>
>(
  tag: Tag,
  spec: Spec
): (props?: Partial<FilterHoles<Spec>>) => void

// 8) Example: exactly your Test1 scenario
const Template = u("a", testAttributes)

// --- VALID USAGE (no TS errors) ---
Template({ href: "#route1", text: "Hello" })
Template({ href: "#route2" })
Template({})
Template()

// --- INVALID USAGE (TS errors) ---
Template({ other: "das" })                  // ❌ 'other' not allowed
Template({ href: "#route3", typ: "wrong" }) // ❌ 'typ' not allowed
