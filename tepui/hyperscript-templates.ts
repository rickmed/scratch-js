type BindingReference<K, V> = {
   set: (key: K, value: V) => void
}

type BindingProxy<K, V> = {
   [key: string]: BindingReference<K, V>
 }

declare const $: BindingProxy<string, string>


type ViewStore = {
   todoFilter: string
}

// Add warnings during development if templates are defined inside component instantiation
const FilterLinkView =
   li({class: $.liClass},
      a({
         class: "staticValue",
         href: $.href,
         text: $.viewFilter,
      })
   )

function FilterLink(viewFilter: string, viewStore: ViewStore) {
   return FilterLinkView({href: `#${viewFilter.toLowerCase()}`, viewFilter})
      .effect(part => {
         part.liClass = viewStore.todoFilter === viewFilter ? "selected" : ""
      })
}


/***** MVP template slots implementation ****/

type Hole<K extends string> = { key: K };
declare const $: { [K in string]: Hole<K> }


type IsHole<T> = Extract<T, Hole<string>>;
type FilterHoles<T> = { [P in keyof T as IsHole<T[P]> extends never ? never : P]: string };

type Prettify<T> = { [K in keyof T]: T[K] } & {}

type UnionToIntersection<U> =
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;

type PropsFromComponent<T> = T extends (props?: infer P) => any ? NonNullable<P> : never;

type ChildPropsUnion<Children extends any[]> = PropsFromComponent<Children[number]>;


declare function u<
  Tag extends string,
  Spec extends object,
  Children extends ((...args: any) => any)[]
>(
  tag: Tag,
  spec: Spec,
  ...children: Children
): // The return type is JUST a function. No `&` intersections with metadata.
   (props?: Prettify<Partial<
      FilterHoles<Spec> & UnionToIntersection<ChildPropsUnion<Children>>
   >>) => any;


const Link = u(
  "a",
  {
    class: "staticValue",
    href:  $.href,
    viewFilter: $.viewFilter,
  },
);

const View = u(
  "li",
  { liClass: $.liClass },
  Link
);

Link({ href: "#home", viewFilter: "All" })  // ✅ OK

View({
  liClass:    "selected",
  href:       "#home",
  viewFilter: "All",
})                                         // ✅ OK

View({ href: "#x" })                      // ✅ OK
View({ liClass: "foo" })                  // ✅ OK
View()                                    // ✅ OK

View({ id: "oops" })
View({ text: "wrong" })
