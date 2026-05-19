import 'reflect-metadata';

export function bindControllerMethods<T extends object>(
  instance: T,
  methodNames: Array<keyof T & string>,
) {
  const prototype = Object.getPrototypeOf(instance) as Record<string, unknown>;

  for (const methodName of methodNames) {
    const original = prototype[methodName];
    if (typeof original !== 'function') {
      continue;
    }

    const bound = original.bind(instance);
    for (const metadataKey of Reflect.getMetadataKeys(original)) {
      Reflect.defineMetadata(metadataKey, Reflect.getMetadata(metadataKey, original), bound);
    }

    Object.defineProperty(instance, methodName, {
      value: bound,
      configurable: true,
      writable: true,
    });
  }
}
