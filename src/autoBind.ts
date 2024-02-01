import getAllProperties from "./getAllProperties.ts";

export default function autoBind(
  self: any,
  filter: (key: string | symbol) => boolean = () => true
) {
  for (const [o, key] of getAllProperties(self.constructor.prototype)) {
    if (key === "constructor" || !filter(key)) {
      continue;
    }

    const descriptor = Reflect.getOwnPropertyDescriptor(o, key);
    if (descriptor && typeof descriptor.value === "function") {
      self[key] = self[key].bind(self);
    }
  }
  return self;
}
