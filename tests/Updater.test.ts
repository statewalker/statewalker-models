import { describe, expect, it } from "./deps.ts";
import { Updater } from "../src/Updater.ts";

describe("Updater", () => {
  it("Updater track modifications", async () => {
    const updater = new Updater();
    const o = {};

    expect(updater.updateId).toBe(0);
    expect(updater.commitId).toBe(0);
    expect(updater.data).toBe(undefined);
    expect(updater.previousData).toBe(undefined);

    updater.data = o;
    expect(updater.updateId).toBe(1);
    expect(updater.commitId).toBe(0);
    expect(updater.data).toBe(o);
    expect(updater.previousData).toBe(undefined);

    updater.data = o;
    expect(updater.updateId).toBe(2);
    expect(updater.commitId).toBe(0);
    expect(updater.data).toBe(o);
    expect(updater.previousData).toBe(undefined);

    updater.submit(false);

    expect(updater.updateId).toBe(3);
    expect(updater.commitId).toBe(3);
    expect(updater.data).toBe(undefined);
    expect(updater.previousData).toBe(undefined);

    updater.data = o;

    expect(updater.updateId).toBe(4);
    expect(updater.commitId).toBe(3);
    expect(updater.data).toBe(o);
    expect(updater.previousData).toBe(undefined);

    updater.submit(true);

    expect(updater.updateId).toBe(5);
    expect(updater.commitId).toBe(5);
    expect(updater.data).toBe(o);
    expect(updater.previousData).toBe(o);
  });

  it("Updater should notify about data updates", async () => {
    const updater = new Updater<string>();
    const list = ["one", "two", "tree", "four"];
    const testList: string[] = [];

    updater.onUpdate(({ data }) => data && testList.push(data));

    for (const str of list) {
      updater.data = str;
    }
    expect(updater.updateId).toBe(list.length);
    // await delay(1);
    expect(testList).toEqual(list);
  });
});
