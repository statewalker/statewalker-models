import { isEqual } from "./deps.ts";
import { BaseClass } from "./BaseClass.ts";

/**
 * This class is used to load data when the request parameter changes
 * its values. To avoid too frequent updates this class uses the debouncing
 * delay.
 * Fields of this object:
 * - request - read/write field containing the request and activating
 *   the data loading
 * - response - read-only field containing results of the loading process
 * - loading - read-only flag defining if the loading process is started
 *   and is not finished yet
 * - error - read-only field containing loading errors (if any)
 */
export class Loader<Request, Response> extends BaseClass {
  /**
   * Internal active field; should not be accessed directly.
   * Use the "loading" property.
   */
  _loading: boolean = false;

  /**
   * Read-only property defining if the loading process is started
   * and not finished yet.
   */
  get loading() {
    return this._loading;
  }

  /**
   * Internal field containing loading errors. Should not be accessed
   * directly. Use the "error" field instead.
   */
  _error: any;

  /**
   * Read-only field returning loading errors.
   */
  get error() {
    return this._error;
  }

  /**
   * Previous request (if any). It isused internally to compare
   * with the current request object and decide if the loading process
   * should be re-started.
   */
  _prevRequest?: Request;

  /**
   * Read-write field containing the request object.
   */
  request?: Request;

  /**
   * Internal field containing results of the loading process.
   * Should not be accessed directly. Use the "response" field instead.
   */
  _response?: Response;

  /**
   * Read-only field with results of the loading process.
   */
  get response(): Response | null | undefined {
    return this._response;
  }

  constructor(options: any = {}) {
    super(options);
    this._defineProperties(
      "_loading",
      "_error",
      "_prevRequest",
      "request",
      "_response"
    );
    this._runLoading = this._runLoading.bind(this);
    this.autorun(() => {
      if (!this.request) return;
      return this._runLoading;
    });
  }

  /**
   * Minimal delay between two calls for the loading operation.
   */
  get runDelay(): number {
    return this.options.delay || 100;
  }

  /**
   * Checks if the request was really changed if it is the case then
   * starts the loading process. Before loading this method sets the
   * internal loading status to "true". When the loading is finished
   * the loading changed to "false". Loading errors are stored in the
   * "error" field. Loading results are defined in the "results" field.
   *
   * This method should not be called direclty. It is called automatically
   * by constructor when the "request" field changes its value.
   * @returns a promise resolved when the loading process is finished.
   */
  async _runLoading(): Promise<void> {
    try {
      if (this._loading) return;
      const request = this.request;
      if (!this._isRequestUpdated(this._prevRequest, request)) return;
      this._prevRequest = request;

      this._loading = true;
      this._error = undefined;

      if (!request) {
        this._response = undefined;
        return;
      }
      const response = (await this._load(request)) as Response;
      this._response = response;
    } catch (error) {
      this._handleError(error);
      this._response = undefined;
      this._error = error;
    } finally {
      this._loading = false;
    }
  }

  /**
   * This method returns true if the request parameter was changed the the
   * data should be re-loaded.
   * @param prev previous request to compare
   * @param next new request to compare
   * @returns true if the previous request is different from the new one
   */
  _isRequestUpdated(prev?: Request, next?: Request) {
    return prev !== next && !isEqual(prev, next);
  }

  /**
   * Re-load data correspondings to the specified request. This method
   * tries to use the "load" parameter transferred in the constructor.
   * This method can be overloaded in sub-classes to define another way
   * of loading data.
   * @param request the new request to execute
   * @returns a promise with the results of the loading process
   */
  async _load(request: Request): Promise<Response | null> {
    const load: (request: Request) => Promise<Response | null> =
      this.options.load;
    return load(request);
  }

  /**
   * Handles the specified loading error. By default it just logs the error.
   * @param error  the error to handle
   */
  _handleError(error: any) {
    console.error(error);
  }
}
