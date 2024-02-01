import { BaseClass } from "./BaseClass.ts";

export class Updater<DataType> extends BaseClass {
  _locked = 0;

  _commitId = 0;
  get commitId() {
    return this._commitId;
  }

  _updateId = 0;
  get updateId() {
    return this._updateId;
  }

  _data?: DataType;

  _previousData?: DataType;
  get previousData(): DataType | undefined {
    return this._previousData;
  }

  get data() {
    return this._data;
  }

  set data(v) {
    if (this._commitId === this._updateId) {
      this._previousData = this._data;
    }
    this._data = v;
    this._updateId++;
  }

  get dirty() {
    return this._commitId !== this._updateId;
  }

  constructor(options?: any) {
    super(options);
    this._data = this.options._data;
    this._previousData = this._data;
    this._defineProperties("_data", "_previousData", "_updateId", "_commitId");
  }

  onSubmit(action: (updater: typeof this) => void = () => {}) {
    let prevCommitId = this._commitId;
    if (this._locked > 0) return;
    return this.autorun(() => {
      const commitId = this._commitId;
      if (commitId === prevCommitId) return;
      prevCommitId = commitId;
      return action(this);
    });
  }
  onUpdate(action: (updater: typeof this) => void = () => {}) {
    let updateId: number;
    return this.autorun(() => {
      const id = this._updateId;
      if (updateId === id) return;
      updateId = id;
      return action(this);
    });
  }

  submit(commit = true) {
    if (!this.dirty) return false;
    if (commit) {
      this._previousData = this._data;
    } else {
      this._data = this._previousData;
    }
    this._updateId++;
    this._commitId = this._updateId;
    return true;
  }

  reset(data: DataType) {
    this._locked++;
    try {
      this._previousData = this._data = data;
      this._commitId = ++this._updateId;
    } finally {
      this._locked--;
    }
  }

  // get modified() {
  //   return !this._isEqual(this._previousData, this._data);
  // }
  // _isEqual(previous?: DataType, data?: DataType) {
  //   return _.isEqual(previous, data);
  // }
}
