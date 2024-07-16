// <analyze>
// For this conversion, I'll focus on maintaining the structure and functionality of the original Python code while adapting it to TypeScript. Key considerations include:

// 1. Converting Python's enums to TypeScript union types for better type safety.
// 2. Using interfaces to define complex data structures like State.
// 3. Adapting Python-specific features like dataclasses and pickle to TypeScript equivalents.
// 4. Handling imports and exports carefully to maintain project continuity.
// 5. Using TypeScript's type system to improve type safety and catch potential errors.
// 6. Marking areas that require further attention or human review.

// The main challenges in this conversion are:
// - Replicating Python's pickle functionality in TypeScript
// - Handling file system operations in a Node.js environment
// - Adapting Python-specific language features to TypeScript

// I'll use the Node.js fs module for file operations and implement a simple serialization method to replace pickle. Some functionality may need to be reviewed or implemented differently in a TypeScript environment.
// </analyze>

// <converted_code>

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { RootTask } from './task';
import { logger } from '../core/logger';
import { Metrics } from '../core/metrics';
import { AgentState } from '../core/schema';
import { MessageAction, AgentFinishAction } from '../events/action';
import { ShortTermHistory } from '../memory/history';
import { getFileStore } from '../storage';

// REVIEW NEEDED: Confirm if this union type correctly represents the TrafficControlState enum
type TrafficControlState = 'normal' | 'throttling' | 'paused';

const RESUMABLE_STATES: AgentState[] = [
    AgentState.RUNNING,
    AgentState.PAUSED,
    AgentState.AWAITING_USER_INPUT,
    AgentState.FINISHED,
];

interface State {
    root_task: RootTask;
    iteration: number;
    max_iterations: number;
    confirmation_mode: boolean;
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
}

class StateManager {
    private state: State;

    constructor() {
        this.state = this.createInitialState();
    }

    private createInitialState(): State {
        return {
            root_task: new RootTask(),
            iteration: 0,
            max_iterations: 100,
            confirmation_mode: false,
            history: new ShortTermHistory(),
            inputs: {},
            outputs: {},
            last_error: null,
            agent_state: AgentState.LOADING,
            resume_state: null,
            traffic_control_state: 'normal',
            metrics: new Metrics(),
            delegate_level: 0,
            start_id: -1,
            end_id: -1,
            almost_stuck: 0,
        };
    }

    saveToSession(sid: string): void {
        const fs = getFileStore();
        logger.debug(`Saving state to session ${sid}:${this.state.agent_state}`);
        const serialized = JSON.stringify(this.state);
        const encoded = Buffer.from(serialized).toString('base64');
        try {
            fs.write(`sessions/${sid}/agent_state.json`, encoded);
        } catch (e) {
            logger.error(`Failed to save state to session: ${e}`);
            throw e;
        }
    }

    static restoreFromSession(sid: string): StateManager {
        const fs = getFileStore();
        try {
            const encoded = fs.read(`sessions/${sid}/agent_state.json`);
            const serialized = Buffer.from(encoded, 'base64').toString('utf-8');
            const state = JSON.parse(serialized) as State;
            const stateManager = new StateManager();
            stateManager.state = state;

            if (RESUMABLE_STATES.includes(state.agent_state)) {
                stateManager.state.resume_state = state.agent_state;
            } else {
                stateManager.state.resume_state = null;
            }
            stateManager.state.agent_state = AgentState.LOADING;

            // Recreate the history object
            stateManager.state.history = new ShortTermHistory();
            stateManager.state.history.start_id = state.start_id;
            stateManager.state.history.end_id = state.end_id;

            return stateManager;
        } catch (e) {
            logger.error(`Failed to restore state from session: ${e}`);
            throw e;
        }
    }

    getCurrentUserIntent(): string | null {
        let lastUserMessage: string | null = null;
        for (const event of this.state.history.getEvents(true)) {
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

export { StateManager, State, TrafficControlState };

// INFO: Conversion Info section.
// <conversion_info>
// - State interface replaces Python dataclass
// - TrafficControlState is a union type
// - RESUMABLE_STATES is an array of AgentState
// - StateManager class handles state operations
// - JSON used for serialization instead of pickle
// - File operations use Node.js fs module
// - ShortTermHistory, RootTask, Metrics classes assumed to be implemented
// - AgentState, MessageAction, AgentFinishAction imports to be verified
// </conversion_info>

// <synthesis>
/*
    The Python code was converted to TypeScript, maintaining the overall structure and functionality.
    Key changes include using interfaces for complex types, implementing a StateManager class,
    and adapting serialization methods. Some areas require further review, especially regarding
    the implementation of imported classes and the handling of file operations in a Node.js environment.
*/
// </synthesis>
// </converted_code>
