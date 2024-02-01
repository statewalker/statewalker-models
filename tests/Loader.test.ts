import { describe, expect, it } from "./deps.ts";
import { Loader } from "../src/Loader.ts";
import { delay, newDeferred } from "./utils.ts";

describe("Loader", () => {
  it("Loader should re-run the loading function when requests change", async () => {
    let counter = 0;
    let d = newDeferred<void>();
    let handledRequest;
    const loader = new Loader({
      load: async () => {
        handledRequest = loader.request;
        await delay(1);
        d.resolve();
        return counter++;
      },
    });
    expect(typeof loader).toBe("object");

    expect(handledRequest).toBe(undefined);
    expect(counter).toBe(0);

    let testRequest = { id: 0 };
    loader.request = testRequest;
    await d.promise;
    expect(counter).toBe(1);
    expect(handledRequest).toBe(testRequest);
    // Update the request and re-load the results
    // (Note that the request should be different to re-load data)
    await delay(1);
    d = newDeferred();
    testRequest = { id: 1 };
    loader.request = testRequest;
    await d.promise;
    expect(counter).toBe(2);
    expect(handledRequest).toBe(testRequest);
  });

  it("Loader should update the loading status", async () => {
    let counter = 0;
    const d = newDeferred<void>();
    const loader = new Loader({
      delay: 0,
      load: async () => {
        await delay(10);
        d.resolve();
        return counter++;
      },
    });

    // Check that the loading flag is false
    expect(loader.loading).toBe(false);

    // Set a new request and start the loading process (async)
    loader.request = { id: 0 };

    // The loading process starts asynchroniousely
    // after the recieiving a new request.
    await delay(1);
    expect(loader.loading).toBe(true);

    // Await until the loading process finished
    await d.promise;
    // Await a little bit more when the loader changes its
    // loading status.
    await delay(1);
    expect(loader.loading).toBe(false);
  });
});
