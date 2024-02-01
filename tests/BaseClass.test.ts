import { describe, expect, it } from "./deps";
import { BaseClass } from "../src/BaseClass.ts";

class Person extends BaseClass {
  firstName: string;

  lastName: string;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  sayHello(): string {
    return `Hello ${this.fullName}!`;
  }

  constructor({
    firstName,
    lastName,
  }: {
    firstName: string;
    lastName: string;
  }) {
    super();
    this.firstName = firstName;
    this.lastName = lastName;
    this._defineProperties("firstName", "lastName");
  }
}

describe("BaseClass", () => {
  it("should be able to define reactive class fields", async () => {
    const person = new Person({
      firstName: "John",
      lastName: "Smith",
    });

    let greetings: string[] = [];

    expect(greetings).toEqual([]);

    let cleanup = person.autorun((p) => {
      greetings.push(p.sayHello());
    });
    expect(greetings).toEqual(["Hello John Smith!"]);

    greetings = [];
    person.firstName = "Jean";
    expect(greetings).toEqual(["Hello Jean Smith!"]);

    greetings = [];
    person.lastName = "Dupon";
    expect(greetings).toEqual(["Hello Jean Dupon!"]);

    // After cleanup, no more notifications
    cleanup();
    greetings = [];
    person.lastName = "Du Pont";
    // No changes
    expect(greetings).toEqual([]);

    // A new subscription
    cleanup = person.autorun((p) => {
      greetings.push(p.sayHello());
    });
    // A new value delivered in the list
    expect(greetings).toEqual(["Hello Jean Du Pont!"]);

    // ------------------------------------
    // Global cleanup. All subscriptions are removed.
    person.close();
    greetings = [];
    person.lastName = "Du PONT";

    // No changes anymore - all subscriptions are removed
    expect(greetings).toEqual([]);
  });

  it("update method should allow to group modifications", async () => {
    const person = new Person({
      firstName: "John",
      lastName: "Smith",
    });

    const greetings: string[] = [];

    expect(greetings).toEqual([]);

    person.autorun((p) => {
      greetings.push(p.sayHello());
    });
    expect(greetings).toEqual(["Hello John Smith!"]);

    person.update(() => {
      person.firstName = "Jean";
      person.lastName = "Dupon";
    });
    expect(greetings).toEqual(["Hello John Smith!", "Hello Jean Dupon!"]);
  });

  it("update method should allow to group modifications", async () => {
    const person = new Person({
      firstName: "John",
      lastName: "Smith",
    });

    const greetings: string[] = [];

    expect(greetings).toEqual([]);

    person.autorun((p) => {
      greetings.push(p.sayHello());
    });
    expect(greetings).toEqual(["Hello John Smith!"]);

    person.update(() => {
      person.firstName = "Jean";
      person.lastName = "Dupon";
    });
    expect(greetings).toEqual(["Hello John Smith!", "Hello Jean Dupon!"]);
  });
});
