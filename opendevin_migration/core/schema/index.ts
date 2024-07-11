// AgentState as const object and union type
export const AgentState = {
    RUNNING: 'RUNNING',
    PAUSED: 'PAUSED',
    AWAITING_USER_INPUT: 'AWAITING_USER_INPUT',
    FINISHED: 'FINISHED',
    LOADING: 'LOADING',
} as const;

export type AgentState = typeof AgentState[keyof typeof AgentState];
