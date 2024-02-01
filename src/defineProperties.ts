import { batch, computed, effect, Signal, signal } from "@preact/signals-core";

/**
 * This method re-defines properties of the given object using Signals.
 * All modifications of these fields can be tracked using the `effect`
 * function provided by the "@preact/signals-core" package.
 *
 * @param obj object where these dynamic properties will be redefined;
 * @param fields a list of field names to transform to dynamic properties
 *
 * @returns the object
 *
 * Example 1: re-define fields in a plain object
 * ```javascript
 * const obj = defineProperties({
 *   firstName : "John",
 *   lastName : "Smith",
 *   get fullName() { return `${this.firstName} ${this.lastName}`; },
 *   sayHello(){ return `Hello ${this.fullName}!`; },
 * }, ["firstName", "lastName"]);
 *
 * obj.$$((o) => {
 *   console.log(o.sayHello());
 * })
 * // Output: "Hello John Smith!"
 *
 * obj.firstName = "James";
 * obj.lastName = "Bonde";
 * // Output: "Hello James Bond!"
 * ```
 *
 *  * Example 2: re-define class instance fields
 * ```javascript
 *  class Person {
 *
 *    firstName: string;
 *
 *    lastName: string;
 *
 *    get fullName(): string {
 *      return `${this.firstName} ${this.lastName}`;
 *    }
 *
 *    sayHello(): string {
 *      return `Hello ${this.fullName}!`;
 *    }
 *
 *    constructor(
 *      { firstName, lastName }: { firstName: string; lastName: string },
 *    ) {
 *      this.firstName = firstName;
 *      this.lastName = lastName;
 *      defineProperties(this, ["firstName", "lastName"]);
 *    }
 *
 *    autorun(action: (person: Person) => void) {
 *      const run: (action: (person: Person) => void) => void = (this as any).$$;
 *      run(action);
 *    }
 *  }
 *
 * const person = new Person({
 *   firstName : "John",
 *   lastName : "Smith",
 * });
 *
 * person.autorun((p) => {
 *   console.log(p.sayHello());
 * })
 * // Output: "Hello John Smith!"
 *
 * person.firstName = "James";
 * person.lastName = "Bonde";
 * // Output: "Hello James Bond!"
 * ```
 */
export type ExtendedType<T> = T & {
  $$: (action: (instance: T) => void) => () => void;
  $$update: (action: (instance: T) => void) => void;
};

export function getPropertiesDescriptors(
  obj: null | object
): Record<string, TypedPropertyDescriptor<any>> {
  if (!obj) return {};
  const descriptors: Record<string, TypedPropertyDescriptor<any>> = {};
  for (
    let o: object | null = obj;
    !!o && o !== Object.prototype;
    o = Reflect.getPrototypeOf(o)
  ) {
    for (const [key, descriptor] of Object.entries(
      Object.getOwnPropertyDescriptors(o)
    )) {
      if (key in descriptors) continue;
      descriptors[key] = descriptor;
    }
  }
  return descriptors;
}

export default function defineProperties<T = object>(
  obj: T,
  fields: string[] = []
): ExtendedType<T> {
  const self: any = obj;
  const properties = (self["$$properties"] = self["$$properties"] || {});
  const descriptors = getPropertiesDescriptors(self);
  for (const name of fields) {
    const descriptor = descriptors[name];
    let sgn: Signal | undefined = undefined;
    let set;
    if (descriptor?.get) {
      sgn = computed(descriptor.get.bind(self));
      set = descriptor?.set?.bind(self);
    }
    if (!sgn) {
      const value = descriptor?.value || self[name];
      const s = (sgn = signal(value));
      set = (v: any) => (s.value = v);
    }
    const get = () => sgn?.value;
    const property = { name, signal: sgn, get, set };

    properties[name] = property;
    Object.defineProperty(self, name, property);
  }
  if (!self.$$) {
    Object.defineProperty(self, "$$", {
      get: () =>
        function (compute: (obj: T) => () => void | void) {
          return effect(() => {
            const action = compute(self);
            if (typeof action === "function") {
              Promise.resolve().then(() => batch(action));
            }
          });
        }.bind(self),
    });
  }
  if (!self.$$update) {
    Object.defineProperty(self, "$$update", {
      get: () =>
        function (compute: (obj: T) => void) {
          return batch(() => compute(self));
        }.bind(self),
    });
  }
  return self;
}
