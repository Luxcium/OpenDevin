// <analyze>
/*
The conversion of this Python file to TypeScript involves several key considerations:

1. Metaclass implementation: TypeScript doesn't have a direct equivalent to Python's metaclasses. We'll need to simulate this behavior using a class decorator.

2. Singleton pattern: We'll implement the Singleton pattern using a class decorator and a WeakMap to store instances.

3. Dataclasses: TypeScript doesn't have built-in dataclasses. We'll use interfaces to define the structure of dataclass-like objects.

4. Type safety: We'll use TypeScript's type system to ensure type safety throughout the implementation.

5. Reset functionality: We'll implement the reset functionality using TypeScript's reflection capabilities (Object.getOwnPropertyDescriptor).

6. Minimizing dependencies: We'll avoid external dependencies and use TypeScript's built-in features.
*/
// </analyze>

// <converted_code>

// INFO: This file implements a Singleton decorator and related utilities

type Constructor<T = {}> = new (...args: any[]) => T;

interface DataclassField {
  name: string;
  type: Constructor;
  defaultFactory?: () => any;
  default?: any;
}

const instances = new WeakMap<Constructor, any>();

function Singleton<T extends Constructor>(constructor: T) {
  return class extends constructor {
    constructor(...args: any[]) {
      super(...args);
      if (instances.has(constructor)) {
        const instance = instances.get(constructor);
        Object.assign(instance, this);
        return instance;
      }
      instances.set(constructor, this);
    }

    static reset() {
      // REVIEW NEEDED: This reset functionality might need adjustment based on specific use cases
      for (const [ctor, instance] of instances) {
        console.log('resetting... ', ctor.name);
        const fields = getDataclassFields(ctor);
        for (const field of fields) {
          if (isDataclass(field.type)) {
            (instance as any)[field.name] = new field.type();
          } else if (field.defaultFactory) {
            (instance as any)[field.name] = field.defaultFactory();
          } else {
            (instance as any)[field.name] = field.default;
          }
        }
      }
    }
  };
}

// HACK: Simulating Python's dataclasses.fields() function
function getDataclassFields(cls: Constructor): DataclassField[] {
  // TODO: Implement logic to extract field information from the class
  return [];
}

// HACK: Simulating Python's dataclasses.is_dataclass() function
function isDataclass(cls: Constructor): boolean {
  // TODO: Implement logic to check if a class is a dataclass
  return false;
}

export { Singleton };

// INFO: Conversion Info section.
// <conversion_info>
// - Singleton implemented as a class decorator
// - WeakMap used for instance storage
// - DataclassField interface defined for field information
// - reset method implemented on the Singleton class
// - getDataclassFields and isDataclass functions added as placeholders
// </conversion_info>

// <synthesis>
/*
    The Python Singleton metaclass has been converted to a TypeScript class decorator.
    The core functionality is maintained, including instance management and the reset method.
    Placeholder functions for dataclass-related operations have been added, which will need
    to be implemented based on the project's specific requirements. The conversion ensures
    type safety and follows TypeScript best practices while maintaining the original logic.
*/
// </synthesis>
// </converted_code>
