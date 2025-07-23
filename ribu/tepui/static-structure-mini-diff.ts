// ─────────────── Core node shapes ───────────────

export type AnyNode = Node<any, any> | TextNode | EmptyNode | DynamicNode;

export interface Node<Tag, Children extends readonly AnyNode[]> {
  readonly kind: "node";
  readonly tag: Tag;
  readonly children: Children;
}

export interface TextNode {
  readonly kind: "text";
}

export interface EmptyNode {
  readonly kind: "empty";
}

// Escape‑hatch for dynamic constructs (If, For, Portal, etc.)
export interface DynamicNode {
  readonly kind: "dynamic";
}

// ─────────────── ui() builders ───────────────

export function ui<
  Tag extends string,
  Children extends readonly AnyNode[]
>(
  tag: Tag,
  ...children: Children
): Node<Tag, Children> {
  // runtime: mount/patch DOM
  return { kind: "node", tag, children } as any;
}

export function text(
  _value: string | number | boolean
): TextNode {
  return { kind: "text" };
}

export const empty = (): EmptyNode => ({ kind: "empty" });

// ─────────────── Escape‑hatch components ───────────────

export function If(
  _cond: boolean,
  _then: () => AnyNode,
  _else?: () => AnyNode
): DynamicNode {
  return { kind: "dynamic" };
}

export function For<T>(
  _list: readonly T[],
  _render: (t: T) => AnyNode
): DynamicNode {
  return { kind: "dynamic" };
}

// ─────────────── Union detection ───────────────

type IsUnion<T, U = T> =
  T extends any
    ? ([U] extends [T] ? false : true)
    : never;

type AssertNotUnion<T> =
  IsUnion<T> extends true
    ? ["Error: component return type is a UNION (dynamic structure). Wrap in <If>/<For>/etc."] & never
    : T;

// ─────────────── StaticComponent helper ───────────────

export type StaticComponent<P, R extends AnyNode> =
  (props: P) => AssertNotUnion<R>;

export function staticComponent<P, R extends AnyNode>(
  fn: (props: P) => R
): StaticComponent<P, R> {
  return fn as any;
}

// ─────────────── Example usage ───────────────

// Your shared Store type
interface Store {
  todos: { completed: boolean }[];
  isDark: boolean;
}

// A trivial child component
export const Component2 = staticComponent<
  { arg: number },
  AnyNode
>(({ arg }) => {
  return ui("span", text(`c2: ${arg}`));
});

// A valid static component
export const Component1 = staticComponent<
  { store1: Store; store2: Store },
  AnyNode
>(({ store1, store2 }) => {
  const numActive = store1.todos.filter(t => !t.completed).length;
  const modeClass = store1.isDark ? "dark" : "light";

  return ui(
    "div", // root tag
    ui("strong", text(String(numActive))),
    text(` item${numActive === 1 ? "" : "s"} left`),
    ui(Component2, Component2({ arg: 123 })),
    ui("h1", text("Left Header"))
  );
});

// ─────────────── Compile‑time error example ───────────────

// Uncommenting this will produce a TS error, because the return type is a union:
// Node<"div", [TextNode]> | Node<"ul", [TextNode]>
// You must wrap in <If> or <For> to collapse to DynamicNode.
// export const Bad = staticComponent<
//   { ready: boolean },
//   AnyNode
//>(({ ready }) => {
//  if (!ready) {
//    return ui("div", text("loading..."));
//  }
//  return ui("ul", text("data"));
//});
