/**
 * AgentState object containing different states of an agent.
 */
export const AgentState = {
    /**
     * The agent is loading.
     */
    LOADING: 'loading',

    /**
     * The agent is initialized.
     */
    INIT: 'init',

    /**
     * The agent is running.
     */
    RUNNING: 'running',

    /**
     * The agent is awaiting user input.
     */
    AWAITING_USER_INPUT: 'awaiting_user_input',

    /**
     * The agent is paused.
     */
    PAUSED: 'paused',

    /**
     * The agent is stopped.
     */
    STOPPED: 'stopped',

    /**
     * The agent is finished with the current task.
     */
    FINISHED: 'finished',

    /**
     * The agent rejects the task.
     */
    REJECTED: 'rejected',

    /**
     * An error occurred during the task.
     */
    ERROR: 'error',

    /**
     * The agent is awaiting user confirmation.
     */
    AWAITING_USER_CONFIRMATION: 'awaiting_user_confirmation',

    /**
     * The user confirmed the agent's action.
     */
    USER_CONFIRMED: 'user_confirmed',

    /**
     * The user rejected the agent's action.
     */
    USER_REJECTED: 'user_rejected'
} as const;

/**
 * Type alias for AgentState values
 */
export type AgentState = typeof AgentState[keyof typeof AgentState];
