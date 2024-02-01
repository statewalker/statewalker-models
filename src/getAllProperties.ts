export default function getAllProperties(
  object?: object | null,
): Array<[any, string | symbol]> {
  const properties: Array<[any, string | symbol]> = [];
  for (
    let o = object;
    !!o && object !== Object.prototype;
    o = Reflect.getPrototypeOf(o)
  ) {
    for (const key of Reflect.ownKeys(o)) {
      properties.push([o, key]);
    }
  }
  return properties;
}
