import { defineProperties, update, autorun } from "./defineProperties.ts";
import newRegistry from "./newRegistry.ts";

export type WatchFunction<T> = (instance: T) => undefined | (() => void);
export type CleanupFunction = () => void;

const noop = () => {};

/**
 * Common parent class used to define "reactive" objects.
 *
 * It allows to:
 * * ... define reactive fields. See the `_defineProperties` method
 * * ... manage dependencies and automatically execute functions when
 *   one of required fields change its values.
 *   See `autorun` and `update` methods.
 * * ... register cleanup functions associated with the lifecycle
 *   of this object - see `_register` and `close` methods
 */
export function newBaseClass<T extends new (...args: any[]) => any>(
  BaseType: T
) {
  /**
   * Common parent class used to define "reactive" objects.
   *
   * It allows to:
   * * ... define reactive fields. See the `_defineProperties` method
   * * ... manage dependencies and automatically execute functions when
   *   one of required fields change its values.
   *   See `autorun` and `update` methods.
   * * ... register cleanup functions associated with the lifecycle
   *   of this object - see `_register` and `close` methods
   */
  return class Type extends BaseType {
    /**
     * This method allows to register a finalization ("cleanup")
     * function which will be called when this object is destroyed (closed).
     * The returned callback allows to remove this registration.
     *
     * This method is useful to avoid resources leaks - it guaranties that
     * the registered cleanup method will be called when this object is closed
     * (destroyed).
     */
    _register: (cleanup?: CleanupFunction) => CleanupFunction;

    /**
     * Internal callback method used to invoke all registered cleanup functions.
     */
    _cleanup: CleanupFunction;

    /**
     * This method allows to register a callback function which will be
     * called each time when one of the fields used in this callback
     * changes its value. The callback is called immediately after
     * registration and then each time when one of the fields used in
     * this callback changes its value. The provided callback
     * can return a function containing updates to apply on this object.
     * All updates are applied asynchroniously after the callback returns.
     * It allows to avoid infinite update loops.
     *
     * This method registers the cleanup function in the internal registry.
     * So all watch actions are cleaned up when the `close` method is called
     * on this object.
     *
     * @param compute a callback function which will be called each time
     * @returns a cleanup function which removes updates subscriptions
     */
    autorun(compute: WatchFunction<this>): CleanupFunction {
      return this._register(autorun(() => compute(this)));
    }
  
    /**
     * This utility method allows to update multiple active fields
     * without notifying all registered listeners on updates of each
     * individual field.
     *
     * Example:
     * ```js
     *
     * // The "firstName" and "lastName" fields are active:
     * const person = new Person({ firstName : "John", lastName : "Smith" });
     *
     * // This method is called each time when the "firstName" or "lastName"
     * // change its values:
     * person.autorun(({ firstName, lastName }) => {
     *   console.log(`Hello "${firstName} ${lastName}"!`))
     * })
     * // Output: 'Hello "John Smith"!'
     *
     * // To update both fields without notifications about individual fields
     * // modifications we can use the "update" method:
     * person.update(p => {
     *   person.firstName = "Jean";
     *   person.lastName = "Dupon";
     * })
     *
     * // The callback registered above will be notified only once.
     * // Output: 'Hello "Jean Dupon"!'
     * ```
     * @param action a callback function updating multiple fields on this object
     */
    update(action: (instance: this) => void) {
      return update(() => action(this));
    }
    
    /**
     * This method re-defines properties on this instance and transform them
     * to "active" properties. Changes of active properties can be intercepted
     * using the `#autorun(...)` method.
     *
     * @param fields a list of field names to re-def  ine on this object
     */
    _defineProperties(...fields: string[]) {
      defineProperties(this, fields);
    }

    /**
     * Constructor of this class sets a list of options.
     */
    constructor(...args: any[]) {
      super(...args);
      // -------------------------------
      [this._register, this._cleanup] = newRegistry();
      // autoBind(this);
    }

    /**
     * Destroys this object and invokes all registered cleanup and
     * finalization functions.
     */
    close() {
      //console.log(">> CLOSE", this.constructor.name);
      this._cleanup && this._cleanup();
    }
  };
}

export const BaseClass = newBaseClass(
  class {
    options: Record<string, any>;
    constructor(options: Record<string, any> = {}) {
      this.options = options;
    }
  }
);
