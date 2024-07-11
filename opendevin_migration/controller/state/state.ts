import { RootTask } from './task'; // Adjust the path as needed
import { ShortTermHistory } from '../../memory/history';
import { Metrics } from '../../core/metrics';
import { getFileStore } from '../../storage';
import { MessageAction } from '../../events/action';
import { AgentFinishAction } from '../../events/action/agent';
import { opendevin_logger as logger } from '../../core/logger';

// TrafficControlState as const object and union type
const TrafficControlState = {
    NORMAL: 'normal',
    THROTTLING: 'throttling',
    PAUSED: 'paused',
} as const;

type TrafficControlState = typeof TrafficControlState[keyof typeof TrafficControlState];

// AgentState as const object and union type
const AgentState = {
    RUNNING: 'RUNNING',
    PAUSED: 'PAUSED',
    AWAITING_USER_INPUT: 'AWAITING_USER_INPUT',
    FINISHED: 'FINISHED',
    LOADING: 'LOADING',
} as const;

type AgentState = typeof AgentState[keyof typeof AgentState];

const RESUMABLE_STATES: AgentState[] = [
    AgentState.RUNNING,
    AgentState.PAUSED,
    AgentState.AWAITING_USER_INPUT,
    AgentState.FINISHED,
];

class State {
    root_task: RootTask = new RootTask();
    iteration: number = 0;
    max_iterations: number = 100;
    history: ShortTermHistory = {} as ShortTermHistory;
    inputs: Record<string, any> = {};
    outputs: Record<string, any> = {};
    last_error: string | null = null;
    agent_state: AgentState = AgentState.LOADING;
    resume_state: AgentState | null = null;
    traffic_control_state: TrafficControlState = TrafficControlState.NORMAL;
    metrics: Metrics = {} as Metrics;
    delegate_level: number = 0;
    start_id: number = -1;
    end_id: number = -1;
    almost_stuck: number = 0;

    saveToSession(sid: string): void {
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

    static restoreFromSession(sid: string): State {
        const fs = getFileStore();
        let state: State;
        try {
            const encoded = fs.read(`sessions/${sid}/agent_state.pkl`);
            const pickled = Buffer.from(encoded, 'base64').toString();
            state = JSON.parse(pickled);
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

    getCurrentUserIntent(): string | null {
        let last_user_message: string | null = null;
        for (const event of this.history.getEvents(true)) {
            if (event instanceof MessageAction && event.source === 'user') {
                last_user_message = event.content;
            } else if (event instanceof AgentFinishAction) {
                if (last_user_message !== null) {
                    return last_user_message;
                }
            }
        }
        return last_user_message;
    }
}

export { State, TrafficControlState, AgentState, RESUMABLE_STATES };
