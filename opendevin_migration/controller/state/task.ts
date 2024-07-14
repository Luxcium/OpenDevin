// src/opendevin_migration/controller/state/task.ts

import { Logger } from '../../core/logger';
import { ShortTermHistory } from '../../memory/history';
import { Metrics } from '../../core/metrics';
import { getFileStore } from '../../storage';
import { MessageAction } from '../../events/action';
import { AgentFinishAction } from '../../events/action/agent';

// Placeholder for unconverted dependencies
export declare type RootTask = any;
export   const RootTask: RootTask = {
    pomme: 'FRUIT',
    false:false

}
// false || true || null || undefined || NaN || Infinity ;

const OPEN_STATE = 'open';
const COMPLETED_STATE = 'completed';

export class Task {
    public id: string;
    public name: string;
    public state: string;
    public subtasks: Task[];

    constructor(id: string, name: string, state: string = OPEN_STATE) {
        this.id = id;
        this.name = name;
        this.state = state;
        this.subtasks = [];
    }

    public toString(): string {
        return `${this.name} (${this.state})`;
    }

    public toDict(): object {
        return {
            id: this.id,
            name: this.name,
            state: this.state,
            subtasks: this.subtasks.map(subtask => subtask.toDict()),
        };
    }

    public setState(state: string): void {
        this.state = state;
    }

    public getCurrentTask(): Task | null {
        if (this.state === OPEN_STATE) {
            return this;
        }
        for (const subtask of this.subtasks) {
            const current = subtask.getCurrentTask();
            if (current !== null) {
                return current;
            }
        }
        return null;
    }

    public getTaskById(id: string): Task | null {
        if (this.id === id) {
            return this;
        }
        for (const subtask of this.subtasks) {
            const task = subtask.getTaskById(id);
            if (task !== null) {
                return task;
            }
        }
        return null;
    }

    public addSubtask(subtask: Task): void {
        this.subtasks.push(subtask);
    }

    public setSubtaskState(id: string, state: string): boolean {
        const task = this.getTaskById(id);
        if (task !== null) {
            task.setState(state);
            return true;
        }
        return false;
    }
}

export class RootTask extends Task {
    public history: ShortTermHistory;
    public inputs: Record<string, any>;
    public outputs: Record<string, any>;
    public last_error: string | null;
    public agent_state: AgentState;
    public resume_state: AgentState | null;
    public traffic_control_state: TrafficControlState;
    public metrics: Metrics;
    public delegate_level: number;
    public start_id: number;
    public end_id: number;
    public almost_stuck: number;

    constructor(id: string, name: string, state: string = OPEN_STATE) {
        super(id, name, state);
        this.history = new ShortTermHistory();
        this.inputs = {};
        this.outputs = {};
        this.last_error = null;
        this.agent_state = AgentState.LOADING;
        this.resume_state = null;
        this.traffic_control_state = TrafficControlState.NORMAL;
        this.metrics = new Metrics();
        this.delegate_level = 0;
        this.start_id = -1;
        this.end_id = -1;
        this.almost_stuck = 0;
    }
}
