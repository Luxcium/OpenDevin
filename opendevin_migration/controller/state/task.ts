import { LLMMalformedActionError, TaskInvalidStateError } from '../../core/exceptions';
import { opendevin_logger as logger } from '../../core/logger';

export const OPEN_STATE = 'open';
export const COMPLETED_STATE = 'completed';
export const ABANDONED_STATE = 'abandoned';
export const IN_PROGRESS_STATE = 'in_progress';
export const VERIFIED_STATE = 'verified';
export const STATES = [
    OPEN_STATE,
    COMPLETED_STATE,
    ABANDONED_STATE,
    IN_PROGRESS_STATE,
    VERIFIED_STATE,
];

export class Task {
    public id: string;
    public goal: string;
    public parent: Task | null;
    public subtasks: Task[];
    public state: string;

    constructor(parent: Task | null, goal: string, state: string = OPEN_STATE, subtasks: any[] = []) {
        this.parent = parent;
        this.goal = goal;
        this.state = state;
        this.subtasks = [];

        if (parent) {
            this.id = parent.id + '.' + (parent.subtasks.length + 1).toString();
            parent.subtasks.push(this);
        } else {
            this.id = '0';
        }

        if (subtasks) {
            for (const subtask of subtasks) {
                if (subtask instanceof Task) {
                    this.subtasks.push(subtask);
                } else {
                    const goal = subtask.goal;
                    const state = subtask.state;
                    const nestedSubtasks = subtask.subtasks;
                    logger.debug(`Reading: ${goal}, ${state}, ${nestedSubtasks}`);
                    this.subtasks.push(new Task(this, goal, state, nestedSubtasks));
                }
            }
        }
    }

    public toString(indent: string = ''): string {
        let emoji = '';
        switch (this.state) {
            case VERIFIED_STATE:
                emoji = '✅';
                break;
            case COMPLETED_STATE:
                emoji = '🟢';
                break;
            case ABANDONED_STATE:
                emoji = '❌';
                break;
            case IN_PROGRESS_STATE:
                emoji = '💪';
                break;
            case OPEN_STATE:
                emoji = '🔵';
                break;
        }
        let result = `${indent}${emoji} ${this.id} ${this.goal}\n`;
        for (const subtask of this.subtasks) {
            result += subtask.toString(indent + '    ');
        }
        return result;
    }

    public toDict(): Record<string, any> {
        return {
            id: this.id,
            goal: this.goal,
            state: this.state,
            subtasks: this.subtasks.map(t => t.toDict())
        };
    }

public setState(state: string): void {
    if (!STATES.includes(state)) {
        logger.error(`Invalid state: ${state}`);
        throw new TaskInvalidStateError(state);
    }
    this.state = state;
    if ([COMPLETED_STATE, ABANDONED_STATE, VERIFIED_STATE].includes(state)) {
        for (const subtask of this.subtasks) {
            if (subtask.state !== ABANDONED_STATE) {
                subtask.setState(state);
            }
        }
    } else if (state === IN_PROGRESS_STATE) {
        if (this.parent !== null) {
            this.parent.setState(state);
        }
    }
}

    public getCurrentTask(): Task | null {
        for (const subtask of this.subtasks) {
            if (subtask.state === IN_PROGRESS_STATE) {
                return subtask.getCurrentTask();
            }
        }
        if (this.state === IN_PROGRESS_STATE) {
            return this;
        }
        return null;
    }
}

export class RootTask extends Task {
    public id: string = '';
    public goal: string = '';
    public parent: null = null;

    constructor() {
        super(null, '');
        this.subtasks = [];
        this.state = OPEN_STATE;
    }

    public toString(): string {
        return this.toString();
    }

    public getTaskById(id: string): Task {
        if (id === '') {
            return this;
        }
        if (this.subtasks.length === 0) {
            throw new LLMMalformedActionError(`Task does not exist: ${id}`);
        }
        const parts = id.split('.').map(p => parseInt(p, 10));
        let task: Task = this;
        for (const part of parts) {
            if (part >= task.subtasks.length) {
                throw new LLMMalformedActionError(`Task does not exist: ${id}`);
            }
            task = task.subtasks[part];
        }
        return task;
    }

    public addSubtask(parentId: string, goal: string, subtasks: any[] = []): void {
        const parent = this.getTaskById(parentId);
        const child = new Task(parent, goal, OPEN_STATE, subtasks);
        parent.subtasks.push(child);
    }

    public setSubtaskState(id: string, state: string): void {
        const task = this.getTaskById(id);
        logger.debug(`Setting task ${task.id} from state ${task.state} to ${state}`);
        task.setState(state);
        const unfinishedTasks = this.subtasks.filter(t => ![COMPLETED_STATE, VERIFIED_STATE, ABANDONED_STATE].includes(t.state));
        if (unfinishedTasks.length === 0) {
            this.setState(COMPLETED_STATE);
        }
    }
}
