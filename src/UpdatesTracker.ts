import isEqual from "lodash.isequal";
import { BaseClass } from "./BaseClass.ts";

export class UpdatesTracker<T> extends BaseClass {
  _lock = 0;

  _submittedData: T;

  get submittedData(): T {
    return this._submittedData;
  }

  get data(): T {
    return this._dump();
  }

  get modified(): boolean {
    return !this._isEqual(this.submittedData, this.data);
  }

  submit(): void {
    this._submittedData = this.data;
  }

  restore(): void {
    this._restore(this.submittedData);
  }

  reset(data: T): void {
    this._lock++;
    try {
      this._submittedData = data;
    } finally {
      this._lock--;
    }
  }

  onSubmit(action: (data?: T) => void = () => {}) {
    return this.autorun(() => {
      const data = this.submittedData;
      if (this._lock) return;
      return action(data);
    });
  }

  constructor({
    data,
    ...options
  }: {
    data: T;
    dump: () => T;
    restore: (v: T) => void;
  }) {
    super(options);
    this._defineProperties("data", "_submittedData", "modified");
    this._submittedData = data;
    this.submit();
  }

  _isEqual(previous: T, data: T) {
    return isEqual(previous, data);
  }

  _dump(): T {
    return this.options.dump();
  }
  _restore(d: T) {
    this.options.restore(d);
  }
}
