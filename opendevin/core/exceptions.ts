export class AgentNoInstructionError extends Error {
    constructor(message: string = 'Instruction must be provided') {
        super(message);
        this.name = 'AgentNoInstructionError';
    }
}

export class AgentEventTypeError extends Error {
    constructor(message: string = 'Event must be a dictionary') {
        super(message);
        this.name = 'AgentEventTypeError';
    }
}

export class AgentAlreadyRegisteredError extends Error {
    constructor(name?: string) {
        super(name ? `Agent class already registered under '${name}'` : 'Agent class already registered');
        this.name = 'AgentAlreadyRegisteredError';
    }
}

export class AgentNotRegisteredError extends Error {
    constructor(name?: string) {
        super(name ? `No agent class registered under '${name}'` : 'No agent class registered');
        this.name = 'AgentNotRegisteredError';
    }
}

export class TaskInvalidStateError extends Error {
    constructor(state?: string) {
        super(state ? `Invalid state ${state}` : 'Invalid state');
        this.name = 'TaskInvalidStateError';
    }
}

export class BrowserInitException extends Error {
    constructor(message: string = 'Failed to initialize browser environment') {
        super(message);
        this.name = 'BrowserInitException';
    }
}

export class BrowserUnavailableException extends Error {
    constructor(message: string = 'Browser environment is not available, please check if has been initialized') {
        super(message);
        this.name = 'BrowserUnavailableException';
    }
}

export class LLMMalformedActionError extends Error {
    constructor(message: string = 'Malformed response') {
        super(message);
        this.name = 'LLMMalformedActionError';
    }
}

export class LLMNoActionError extends Error {
    constructor(message: string = 'Agent must return an action') {
        super(message);
        this.name = 'LLMNoActionError';
    }
}

export class LLMResponseError extends Error {
    constructor(message: string = 'Failed to retrieve action from LLM response') {
        super(message);
        this.name = 'LLMResponseError';
    }
}
