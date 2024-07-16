// <analyze>
/*
The conversion process for this file involves transforming a Python Pydantic model into a TypeScript equivalent. The main challenges are:

1. Replacing Pydantic's BaseModel with a TypeScript interface or type.
2. Converting Field() declarations to TypeScript property declarations.
3. Maintaining the structure and documentation of the ActionType class.
4. Ensuring that all constants are properly exported.

To minimize external dependencies, we'll use native TypeScript features instead of relying on third-party libraries. We'll use a type alias instead of an enum to represent the ActionType, as enums are discouraged in the instructions.

The conversion will focus on maintaining the structure and documentation of the original Python code while leveraging TypeScript's type system for better type safety and developer experience.
*/
// </analyze>

// <converted_code>

// Define the ActionType interface
interface ActionType {
  readonly INIT: string;
  readonly MESSAGE: string;
  readonly START: string;
  readonly READ: string;
  readonly WRITE: string;
  readonly RUN: string;
  readonly RUN_IPYTHON: string;
  readonly BROWSE: string;
  readonly BROWSE_INTERACTIVE: string;
  readonly DELEGATE: string;
  readonly FINISH: string;
  readonly REJECT: string;
  readonly NULL: string;
  readonly SUMMARIZE: string;
  readonly ADD_TASK: string;
  readonly MODIFY_TASK: string;
  readonly PAUSE: string;
  readonly RESUME: string;
  readonly STOP: string;
  readonly CHANGE_AGENT_STATE: string;
  readonly PUSH: string;
  readonly SEND_PR: string;
}

// Create the ActionType object with default values and comments
export const ActionType: ActionType = {
  INIT: 'initialize',
  // Initializes the agent. Only sent by client.

  MESSAGE: 'message',
  // Represents a message.

  START: 'start',
  // Starts a new development task OR send chat from the user. Only sent by the client.

  READ: 'read',
  // Reads the content of a file.

  WRITE: 'write',
  // Writes the content to a file.

  RUN: 'run',
  // Runs a command.

  RUN_IPYTHON: 'run_ipython',
  // Runs a IPython cell.

  BROWSE: 'browse',
  // Opens a web page.

  BROWSE_INTERACTIVE: 'browse_interactive',
  // Interact with the browser instance.

  DELEGATE: 'delegate',
  // Delegates a task to another agent.

  FINISH: 'finish',
  // If you're absolutely certain that you've completed your task and have tested your work,
  // use the finish action to stop working.

  REJECT: 'reject',
  // If you're absolutely certain that you cannot complete the task with given requirements,
  // use the reject action to stop working.

  NULL: 'null',

  SUMMARIZE: 'summarize',

  ADD_TASK: 'add_task',

  MODIFY_TASK: 'modify_task',

  PAUSE: 'pause',
  // Pauses the task.

  RESUME: 'resume',
  // Resumes the task.

  STOP: 'stop',
  // Stops the task. Must send a start action to restart a new task.

  CHANGE_AGENT_STATE: 'change_agent_state',

  PUSH: 'push',
  // Push a branch to github.

  SEND_PR: 'send_pr',
  // Send a PR to github.
};

// INFO: Conversion Info section.
// <conversion_info>
// - ActionType is exported as a constant object with readonly properties.
// - The structure and documentation of the original Python code are maintained.
// - No external dependencies are introduced.
// </conversion_info>

// <synthesis>
/*
    The Python file has been successfully converted to TypeScript. The main ActionType class
    has been transformed into a TypeScript interface and a constant object. All properties
    are readonly to maintain immutability. The structure, naming, and documentation from the
    original Python code have been preserved. The converted code is type-safe and follows
    TypeScript best practices.
*/
// </synthesis>
// </converted_code>
