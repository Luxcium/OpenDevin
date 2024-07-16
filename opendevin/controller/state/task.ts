// <analyze>
// For this conversion, I'll focus on maintaining the structure and functionality of the original Python code while adapting it to TypeScript. Key decisions and considerations include:

// 1. Using TypeScript interfaces to define the Task structure and states.
// 2. Converting Python class methods to TypeScript class methods.
// 3. Replacing Python-specific constructs like list comprehensions with TypeScript equivalents.
// 4. Using string literal types for task states instead of constants.
// 5. Implementing proper type annotations for all variables and function parameters.
// 6. Using the `Error` class for custom errors instead of Python's exception classes.
// 7. Replacing Python's optional arguments with TypeScript's optional parameters.
// 8. Using TypeScript's union types for cases where a variable can have multiple types.

// To minimize external dependencies, we'll use built-in TypeScript and Node.js functionalities. For logging, we'll assume a custom logger is implemented elsewhere in the project.
// </analyze>

// <converted_code>

import { opendevin_logger as logger } from '../core/logger';

// INFO: Custom error classes
class LLMMalformedActionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'LLMMalformedActionError';
    }
}

class TaskInvalidStateError extends Error {
    constructor(state: string) {
        super(`Invalid state: ${state}`);
        this.name = 'TaskInvalidStateError';
    }
}

// INFO: Task state type
type TaskState = 'open' | 'completed' | 'abandoned' | 'in_progress' | 'verified';

// INFO: Task interface
interface ITask {
    id: string;
    goal: string;
    parent: Task | RootTask | null;
    subtasks: Task[];
    state: TaskState;
}

class Task implements ITask {
    id: string;
    goal: string;
    parent: Task | RootTask;
    subtasks: Task[];
    state: TaskState;

    constructor(
        parent: Task | RootTask,
        goal: string,
        state: TaskState = 'open',
        subtasks: (Task | { goal: string; state?: TaskState; subtasks?: any[] })[] = []
    ) {
        if ('id' in parent) {
            this.id = `${parent.id}.${parent.subtasks.length}`;
        } else {
            this.id = parent.subtasks.length.toString();
        }
        this.parent = parent;
        this.goal = goal;
        logger.debug(`Creating task ${this.id} with parent=${('id' in parent) ? parent.id : 'root'}, goal=${goal}`);
        this.subtasks = [];
        for (const subtask of subtasks) {
            if (subtask instanceof Task) {
                this.subtasks.push(subtask);
            } else {
                const { goal, state, subtasks: subSubtasks } = subtask;
                logger.debug(`Reading: ${goal}, ${state}, ${subSubtasks}`);
                this.subtasks.push(new Task(this, goal, state, subSubtasks));
            }
        }
        this.state = 'open';
    }

    toString(indent: string = ''): string {
        let emoji = '';
        switch (this.state) {
            case 'verified':
                emoji = '✅';
                break;
            case 'completed':
                emoji = '🟢';
                break;
            case 'abandoned':
                emoji = '❌';
                break;
            case 'in_progress':
                emoji = '💪';
                break;
            case 'open':
                emoji = '🔵';
                break;
        }
        let result = `${indent}${emoji} ${this.id} ${this.goal}\n`;
        for (const subtask of this.subtasks) {
            result += subtask.toString(indent + '    ');
        }
        return result;
    }

    toDict(): Record<string, any> {
        return {
            id: this.id,
            goal: this.goal,
            state: this.state,
            subtasks: this.subtasks.map(t => t.toDict()),
        };
    }

    setState(state: TaskState): void {
        if (!['open', 'completed', 'abandoned', 'in_progress', 'verified'].includes(state)) {
            logger.error(`Invalid state: ${state}`);
            throw new TaskInvalidStateError(state);
        }
        this.state = state;
        if (['completed', 'abandoned', 'verified'].includes(state)) {
            for (const subtask of this.subtasks) {
                if (subtask.state !== 'abandoned') {
                    subtask.setState(state);
                }
            }
        } else if (state === 'in_progress') {
            if (this.parent instanceof Task) {
                this.parent.setState(state);
            }
        }
    }

    getCurrentTask(): Task | null {
        for (const subtask of this.subtasks) {
            if (subtask.state === 'in_progress') {
                return subtask.getCurrentTask();
            }
        }
        if (this.state === 'in_progress') {
            return this;
        }
        return null;
    }
}

class RootTask implements ITask {
    id: string = '';
    goal: string = '';
    parent: null = null;
    subtasks: Task[] = [];
    state: TaskState = 'open';

    constructor() {
        this.subtasks = [];
        this.state = 'open';
    }

    toString(): string {
        return this.subtasks.map(task => task.toString()).join('');
    }

    getTaskById(id: string): Task | RootTask {
        if (id === '') {
            return this;
        }
        if (this.subtasks.length === 0) {
            throw new LLMMalformedActionError('Task does not exist:' + id);
        }
        try {
            const parts = id.split('.').map(p => parseInt(p, 10));
            let task: Task | RootTask = this;
            for (const part of parts) {
                if (part >= task.subtasks.length) {
                    throw new LLMMalformedActionError('Task does not exist:' + id);
                }
                task = task.subtasks[part];
            }
            return task;
        } catch (error) {
            throw new LLMMalformedActionError('Invalid task id:' + id);
        }
    }

    addSubtask(parentId: string, goal: string, subtasks: any[] = []): void {
        const parent = this.getTaskById(parentId);
        const child = new Task(parent, goal, 'open', subtasks);
        parent.subtasks.push(child);
    }

    setSubtaskState(id: string, state: TaskState): void {
        const task = this.getTaskById(id) as Task;
        logger.debug(`Setting task ${task.id} from state ${task.state} to ${state}`);
        task.setState(state);
        const unfinishedTasks = this.subtasks.filter(t => !['completed', 'verified', 'abandoned'].includes(t.state));
        if (unfinishedTasks.length === 0) {
            this.setState('completed');
        }
    }

    setState(state: TaskState): void {
        this.state = state;
    }
}

export { Task, RootTask, TaskState, LLMMalformedActionError, TaskInvalidStateError };

// INFO: Conversion Info section.
// <conversion_info>
// - Task and RootTask classes implemented with TypeScript interfaces
// - TaskState type used for state management
// - Custom error classes created for exception handling
// - Logger assumed to be implemented in '../core/logger'
// - All classes and types exported for use in other modules
// </conversion_info>

// <synthesis>
/*
    The Python code has been successfully converted to TypeScript while maintaining its core functionality.
    The conversion process involved creating TypeScript interfaces, implementing proper type annotations,
    and adapting Python-specific constructs to TypeScript equivalents. Custom error classes were created
    to handle exceptions, and the overall structure of the Task and RootTask classes was preserved.
    The code now leverages TypeScript's type system for improved type safety and maintainability.
*/
// </synthesis>
// </converted_code>
