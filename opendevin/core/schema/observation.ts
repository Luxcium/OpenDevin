/**
 * ObservationType schema containing different observation types.
 */
export const ObservationType = {
    /**
     * The content of a file
     */
    READ: 'read',

    /**
     * Write operation
     */
    WRITE: 'write',

    /**
     * The HTML content of a URL
     */
    BROWSE: 'browse',

    /**
     * The output of a command
     */
    RUN: 'run',

    /**
     * Runs an IPython cell.
     */
    RUN_IPYTHON: 'run_ipython',

    /**
     * A message from the user
     */
    CHAT: 'chat',

    /**
     * The result of a task delegated to another agent
     */
    DELEGATE: 'delegate',

    /**
     * A message
     */
    MESSAGE: 'message',

    /**
     * An error occurred
     */
    ERROR: 'error',

    /**
     * Operation was successful
     */
    SUCCESS: 'success',

    /**
     * A null value
     */
    NULL: 'null',

    /**
     * The state of the agent has changed
     */
    AGENT_STATE_CHANGED: 'agent_state_changed',

    /**
     * The user rejected something
     */
    USER_REJECTED: 'user_rejected'
} as const;

/**
 * Type alias for ObservationType values
 */
export type ObservationTypeSchema = typeof ObservationType[keyof typeof ObservationType];
