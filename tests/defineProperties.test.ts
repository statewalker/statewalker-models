import { describe, expect, it } from "./deps.ts";
import { defineProperties, autorun, update } from "../src/defineProperties.ts";

type PersonInfo = {
  firstName: string;
  lastName: string;
};

describe("defineProperties", () => {
  it("should re-define plain object properties", async () => {
    const obj = defineProperties(
      {
        firstName: "John",
        lastName: "Smith",
      } as PersonInfo,
      ["firstName", "lastName"],
    );

    const results: string[] = [];
    autorun(() => {
      const { firstName, lastName } = obj;
      results.push(`Hello ${firstName} ${lastName}!`);
    });
    expect(results).toEqual(["Hello John Smith!"]);

    obj.firstName = "Jean";
    expect(results).toEqual(["Hello John Smith!", "Hello Jean Smith!"]);

    obj.lastName = "Dupon";
    expect(results).toEqual([
      "Hello John Smith!",
      "Hello Jean Smith!",
      "Hello Jean Dupon!",
    ]);
  });

  it("should be able to update multiple fields at once", async () => {
    const obj = defineProperties(
      {
        firstName: "John",
        lastName: "Smith",
      },
      ["firstName", "lastName"],
    );

    const results: string[] = [];
    autorun(() => {
      const { firstName, lastName } = obj;
      results.push(`Hello ${firstName} ${lastName}!`);
    });
    expect(results).toEqual(["Hello John Smith!"]);

    update(() => {
      obj.firstName = "Jean";
      obj.lastName = "Dupon";
    });
    expect(results).toEqual(["Hello John Smith!", "Hello Jean Dupon!"]);
  });

  class Person implements PersonInfo {
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
      this.firstName = firstName;
      this.lastName = lastName;
      defineProperties(this, ["firstName", "lastName"]);
    }

    autorun(action: (person: this) => void) {
      autorun(() => action(this));
    }
    update(action: (person: this) => void) {
      return update(() => action(this));
    }
  }

  it("should be able to re-define class fields", async () => {
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

    person.firstName = "Jean";
    expect(greetings).toEqual(["Hello John Smith!", "Hello Jean Smith!"]);

    person.lastName = "Dupon";
    expect(greetings).toEqual([
      "Hello John Smith!",
      "Hello Jean Smith!",
      "Hello Jean Dupon!",
    ]);
  });

  it("'$$update' method should allow to group modifications", async () => {
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
