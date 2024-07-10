import { RootTask } from './task'; // Adjust the path as needed
import { ShortTermHistory } from '../../memory/history';
import { Metrics } from '../../core/metrics';
import { getFileStore } from '../../storage';
import { MessageAction } from '../../events/action';
import { AgentFinishAction } from '../../events/action/agent';
import { opendevin_logger as logger } from '../../core/logger';

const TrafficControlState = {
    NORMAL: 'normal',
    THROTTLING: 'throttling',
    PAUSED: 'paused',
} as const;
type TrafficControlState = typeof TrafficControlState[keyof typeof TrafficControlState];

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
    root_task: RootTask;
    iteration: number;
    max_iterations: number;
    history: ShortTermHistory;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    last_error: string | null;
    agent_state: AgentState;
    resume_state: AgentState | null;
    traffic_control_state: TrafficControlState;
    metrics: Metrics;
    delegate_level: number;
    start_id: number;
    end_id: number;
    almost_stuck: number;

    constructor() {
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

    saveToSession(sid: string) {
        const fs = getFileStore();
        const pickled = Buffer.from(JSON.stringify(this));
        logger.debug(`Saving state to session ${sid}:${this.agent_state}`);
        const encoded = pickled.toString('base64');
        try {
            fs.write(`sessions/${sid}/agent_state.pkl`, encoded);
        } catch (e) {
            logger.error(`Failed to save state to session: ${e}`);
            throw e;
        }
    }

    static restoreFromSession(sid: string): State {
        const fs = getFileStore();
        try {
            const encoded = fs.read(`sessions/${sid}/agent_state.pkl`);
            const pickled = Buffer.from(encoded, 'base64').toString();
            const state = JSON.parse(pickled);
            return state;
        } catch (e) {
            logger.error(`Failed to restore state from session: ${e}`);
            throw e;
        }
    }

    getCurrentUserIntent() {
        let lastUserMessage = null;
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
