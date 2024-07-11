// File: opendevin_migration/controller/state/state.ts

import { RootTask } from './task';
import { ShortTermHistory } from '../../memory/history';
import { Metrics } from '../../core/metrics';
import { getFileStore } from '../../storage';
import { MessageAction } from '../../events/action';
import { AgentFinishAction } from '../../events/action/agent';
import { opendevin_logger as logger } from '../../core/logger';
import { AgentState } from '../../core/schema';

type TrafficControlState = 'normal' | 'throttling' | 'paused';

const TrafficControlState = {
    NORMAL: 'normal' as TrafficControlState,
    THROTTLING: 'throttling' as TrafficControlState,
    PAUSED: 'paused' as TrafficControlState
};

const RESUMABLE_STATES: AgentState[] = [
    AgentState.RUNNING,
    AgentState.PAUSED,
    AgentState.AWAITING_USER_INPUT,
    AgentState.FINISHED
];

class State {
    public root_task: RootTask;
    public iteration: number;
    public max_iterations: number;
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

    public constructor() {
        this.root_task = new RootTask();
        this.iteration = 0;
        this.max_iterations = 100;
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

    public saveToSession(sid: string): void {
        const fs = getFileStore();
        const pickled = Buffer.from(JSON.stringify(this)).toString('base64');
        logger.debug(`Saving state to session ${sid}:${this.agent_state}`);
        try {
            fs.write(`sessions/${sid}/agent_state.pkl`, pickled);
        } catch (e) {
            logger.error(`Failed to save state to session: ${e}`);
            throw e;
        }
    }

    public static restoreFromSession(sid: string): State {
        const fs = getFileStore();
        let state: State;
        try {
            const encoded = fs.read(`sessions/${sid}/agent_state.pkl`);
            const pickled = Buffer.from(encoded, 'base64').toString();
            state = JSON.parse(pickled) as State;
        } catch (e) {
            logger.error(`Failed to restore state from session: ${e}`);
            throw e;
        }
        if (RESUMABLE_STATES.includes(state.agent_state)) {
            state.resume_state = state.agent_state;
        } else {
            state.resume_state = null;
        }
        state.agent_state = AgentState.LOADING;
        return state;
    }

    public getState(): Record<string, any> {
        const state: Record<string, any> = { ...this };

        if ('history' in state) {
            state.start_id = state.history.start_id;
            state.end_id = state.history.end_id;
        }

        delete state.history;
        return state;
    }

    public setState(state: Record<string, any>): void {
        Object.assign(this, state);

        if (!this.history) {
            this.history = new ShortTermHistory();
        }

        this.history.start_id = this.start_id;
        this.history.end_id = this.end_id;
    }

    public getCurrentUserIntent(): string | null {
        let lastUserMessage: string | null = null;
        for (const event of this.history.getEvents(true)) {
            if (event instanceof MessageAction && event.source === 'user') {
                lastUserMessage = event.content;
            } else if (event instanceof AgentFinishAction) {
                if (lastUserMessage !== null) {
                    return lastUserMessage;
                }
            }
        }
        return lastUserMessage;
    }
}

export { State, TrafficControlState, RESUMABLE_STATES };
