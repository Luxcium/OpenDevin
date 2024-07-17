// <analyze>
/*
This Python file contains logging functionality for the OpenDevin project. The conversion to TypeScript requires careful consideration of the following aspects:

1. Logging: Node.js has a different logging system compared to Python. We'll need to use a logging library like 'winston' to replicate the functionality.

2. Color output: The 'termcolor' library in Python doesn't have a direct equivalent in TypeScript. We'll use 'chalk' for colored console output.

3. File system operations: We'll use the Node.js 'fs' module for file operations.

4. Type definitions: We'll create interfaces and types to represent the complex data structures used in the original code.

5. Class conversions: We'll convert Python classes to TypeScript classes, adjusting for language differences.

6. Error handling: We'll adapt the error handling to use TypeScript's try-catch mechanism.

7. Environment variables: We'll use Node.js's process.env for accessing environment variables.

The conversion will focus on maintaining the core functionality while adapting to TypeScript and Node.js ecosystem.
*/
// </analyze>

// <converted_code>

import { createLogger, format, transports, Logger } from 'winston';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
// import * as os from 'os';

// TODO: Import config from the appropriate location
import { config } from './config';

// Types and interfaces
type ColorType =
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'grey'
  | 'redBright'
  | 'greenBright'
  | 'yellowBright'
  | 'blueBright'
  | 'magentaBright'
  | 'cyanBright'
  | 'white';

interface LogColors {
  [key: string]: ColorType;
}

const LOG_COLORS: LogColors = {
  ACTION: 'green',
  USER_ACTION: 'redBright',
  OBSERVATION: 'yellow',
  USER_OBSERVATION: 'greenBright',
  DETAIL: 'cyan',
  ERROR: 'red',
  PLAN: 'magentaBright'
};

// Custom formatter
const coloredFormatter = format.printf(
  ({ level, message, timestamp, msgType, eventSource, filename, lineno }) => {
    const color = LOG_COLORS[msgType] || 'white';
    const coloredMessage = chalk[color](message);
    const coloredTimestamp = chalk[color](timestamp);
    const coloredMsgType = chalk[color](msgType);

    if (msgType === 'ERROR' || config.debug) {
      return `${coloredTimestamp} - ${chalk[color](level)}: ${filename}:${lineno}\n${coloredMsgType}\n${coloredMessage}`;
    }

    if (msgType === 'STEP') {
      return `\n\n==============\n${message}\n`;
    }

    return `${coloredTimestamp} - ${coloredMsgType}\n${coloredMessage}`;
  }
);

// Create logger
const opendevinLogger = createLogger({
  level: config.debug ? 'debug' : 'info',
  format: format.combine(
    format.timestamp({ format: 'HH:mm:ss' }),
    format.splat(),
    coloredFormatter
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: path.join(process.cwd(), 'logs', 'opendevin.log')
    })
  ]
});

// Sensitive data filter
const sensitiveDataFilter = format((info) => {
  const sensitivePatterns = [
    'api_key',
    'aws_access_key_id',
    'aws_secret_access_key',
    'e2b_api_key',
    'github_token',
    'jwt_secret',
    'ssh_password',
    'JWT_SECRET',
    'LLM_API_KEY',
    'GITHUB_TOKEN',
    'SANDBOX_ENV_GITHUB_TOKEN'
  ];

  sensitivePatterns.forEach((pattern) => {
    const regex = new RegExp(`${pattern}='?([\w-]+)'?`, 'g');
    info.message = info.message.replace(regex, `${pattern}='******'`);
  });

  return info;
});

opendevinLogger.format = format.combine(
  sensitiveDataFilter(),
  opendevinLogger.format
);

// Uncaught exception handler
process.on('uncaughtException', (error: Error) => {
  opendevinLogger.error('Uncaught Exception:', error);
  process.exit(1);
});

// LLM logging
class LlmFileHandler {
  private messageCounter: number = 1;
  private session: string;
  private logDirectory: string;

  constructor(private filename: string) {
    this.session = config.debug
      ? new Date().toISOString().replace(/:/g, '-').slice(0, 16)
      : 'default';
    this.logDirectory = path.join(process.cwd(), 'logs', 'llm', this.session);
    fs.mkdirSync(this.logDirectory, { recursive: true });

    if (!config.debug) {
      // Clear the log directory if not in debug mode
      fs.readdirSync(this.logDirectory).forEach((file) => {
        const filePath = path.join(this.logDirectory, file);
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          opendevinLogger.error(
            `Failed to delete ${filePath}. Reason: ${error}`
          );
        }
      });
    }
  }

  log(message: string): void {
    const filename = `${this.filename}_${this.messageCounter.toString().padStart(3, '0')}.log`;
    const filePath = path.join(this.logDirectory, filename);
    fs.writeFileSync(filePath, message);
    opendevinLogger.debug(`Logging to ${filePath}`);
    this.messageCounter++;
  }
}

const llmPromptLogger = new LlmFileHandler('prompt');
const llmResponseLogger = new LlmFileHandler('response');

// Export all necessary components
export {
  opendevinLogger,
  llmPromptLogger,
  llmResponseLogger,
  ColorType,
  LogColors,
  LOG_COLORS
};

// INFO: Conversion Info section.
// <conversion_info>
// - Logger: winston
// - Color output: chalk
// - File operations: fs module
// - Config: Imported from './config'
// - Sensitive data patterns defined
// - LlmFileHandler class for LLM logging
// - Uncaught exception handler implemented
// </conversion_info>

// <synthesis>
/*
    The Python logging system has been converted to use Winston for logging in TypeScript.
    Chalk is used for colored output instead of termcolor.
    File operations now use the Node.js fs module.
    The overall structure and functionality of the logging system have been maintained,
    with adjustments made for TypeScript and Node.js specifics.
    LLM logging functionality has been implemented as a separate class.
    Sensitive data filtering has been implemented as a Winston format.
*/
// </synthesis>
// </converted_code>
