import { getLogger } from 'log4js';
import { resolve, join } from 'node:path';
import { platform, userInfo } from 'node:os';
import { v4 as uuidv4 } from 'uuid';
import { parse as parseToml } from '@iarna/toml';
import { config as dotenvConfig } from 'dotenv';
import { Singleton } from './utils/singleton';
import { mkdirSync, readFileSync } from 'node:fs';
import { Command, OptionValues } from 'commander';

dotenvConfig();

const logger = getLogger(__filename);

type UnionType = string | number | boolean | null | undefined;

interface IFieldInfo {
  type: string;
  optional: boolean;
  default: any;
}

function getFieldInfo(f: any): IFieldInfo {
  let fieldType = f.type;
  let optional = false;

  if (Array.isArray(fieldType)) {
    fieldType = fieldType.find(t => t !== null);
    optional = true;
  }

  const typeName = typeof fieldType === 'function' ? fieldType.name.toLowerCase() : 'unknown';

  return { type: typeName, optional, default: f.default };
}

interface ILLMConfig {
  model: string;
  apiKey?: string;
  baseUrl?: string;
  apiVersion?: string;
  embeddingModel: string;
  embeddingBaseUrl?: string;
  embeddingDeploymentName?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegionName?: string;
  numRetries: number;
  retryMinWait: number;
  retryMaxWait: number;
  timeout?: number;
  maxMessageChars: number;
  temperature: number;
  topP: number;
  customLlmProvider?: string;
  maxInputTokens?: number;
  maxOutputTokens?: number;
  inputCostPerToken?: number;
  outputCostPerToken?: number;
  ollamaBaseUrl?: string;
}

class LLMConfig implements ILLMConfig {
  model: string = 'gpt-4o';
  apiKey?: string;
  baseUrl?: string;
  apiVersion?: string;
  embeddingModel: string = 'local';
  embeddingBaseUrl?: string;
  embeddingDeploymentName?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegionName?: string;
  numRetries: number = 5;
  retryMinWait: number = 3;
  retryMaxWait: number = 60;
  timeout?: number;
  maxMessageChars: number = 10000;
  temperature: number = 0;
  topP: number = 0.5;
  customLlmProvider?: string;
  maxInputTokens?: number;
  maxOutputTokens?: number;
  inputCostPerToken?: number;
  outputCostPerToken?: number;
  ollamaBaseUrl?: string;

  defaultsToDict(): Record<string, IFieldInfo> {
    const result: Record<string, IFieldInfo> = {};
    for (const key of Object.keys(this)) {
      // @ts-ignore
      result[key] = getFieldInfo(this[key] as any);
    }
    return result;
  }

  toString(): string {
    const attrStr = Object.keys(this).map(key => {
      let value = (this as any)[key];
      if (['apiKey', 'awsAccessKeyId', 'awsSecretAccessKey'].includes(key)) {
        value = value ? '******' : null;
      }
      return `${key}=${JSON.stringify(value)}`;
    }).join(', ');
    return `LLMConfig(${attrStr})`;
  }

  toJSON() {
    return this.toString();
  }
}

interface IAgentConfig {
  memoryEnabled: boolean;
  memoryMaxThreads: number;
  llmConfig?: string;
}

class AgentConfig implements IAgentConfig {
  memoryEnabled: boolean = false;
  memoryMaxThreads: number = 2;
  llmConfig?: string;

  constructor(memoryEnabled: boolean | null = false, memoryMaxThreads: number = 2, llmConfig?: string) {
    this.memoryEnabled = memoryEnabled || false;
    this.memoryMaxThreads = memoryMaxThreads;
    this.llmConfig = llmConfig;
  }

  defaultsToDict(): Record<string, IFieldInfo> {
    const result: Record<string, IFieldInfo> = {};
    for (const key of Object.keys(this) as (keyof this)[]) {
      result[key as string] = getFieldInfo(this[key]);
    }
    return result;
  }
}

interface ISandboxConfig {
  boxType: string;
  containerImage: string;
  userId: number;
  timeout: number;
  [key: string]: any;
}

class SandboxConfig implements ISandboxConfig {
  boxType: string = 'ssh';
  containerImage: string = `ghcr.io/opendevin/sandbox:${process.env.OPEN_DEVIN_BUILD_VERSION || 'main'}`;
  userId: number = userInfo().uid;
  timeout: number = 120;

  defaultsToDict(): Record<string, IFieldInfo> {
    const result: Record<string, IFieldInfo> = {};
    for (const key of Object.keys(this)) {
      // @ts-ignore
      result[key] = getFieldInfo(this[key]);
    }
    return result;
  }

  toString(): string {
    const attrStr = Object.keys(this).map(key => {
      const value = (this as any)[key];
      return `${key}=${JSON.stringify(value)}`;
    }).join(', ');
    return `SandboxConfig(${attrStr})`;
  }

  toJSON() {
    return this.toString();
  }
}

interface IAppConfig {
  llms: Record<string, LLMConfig>;
  agents: Record<string, AgentConfig>;
  defaultAgent: string;
  sandbox: SandboxConfig;
  runtime: string;
  fileStore: string;
  fileStorePath: string;
  workspaceBase: string;
  workspaceMountPath: string;
  workspaceMountPathInSandbox: string;
  workspaceMountRewrite?: string;
  cacheDir: string;
  runAsDevin: boolean;
  confirmationMode: boolean;
  maxIterations: number;
  maxBudgetPerTask?: number;
  e2bApiKey: string;
  useHostNetwork: boolean;
  sshHostname: string;
  disableColor: boolean;
  initializePlugins: boolean;
  persistSandbox: boolean;
  sshPort: number;
  sshPassword?: string;
  jwtSecret: string;
  debug: boolean;
  enableAutoLint: boolean;
  enableCliSession: boolean;
  fileUploadsMaxFileSizeMb: number;
  fileUploadsRestrictFileTypes: boolean;
  fileUploadsAllowedExtensions: string[];
}

@Singleton
class AppConfig implements IAppConfig {
  llms: Record<string, LLMConfig> = {};
  agents: Record<string, AgentConfig> = {};
  defaultAgent: string = 'CodeActAgent';
  sandbox: SandboxConfig = new SandboxConfig();
  runtime: string = 'server';
  fileStore: string = 'memory';
  fileStorePath: string = '/tmp/file_store';
  workspaceBase: string = join(process.cwd(), 'workspace');
  workspaceMountPath: string = 'UNDEFINED';
  workspaceMountPathInSandbox: string = '/workspace';
  workspaceMountRewrite?: string;
  cacheDir: string = '/tmp/cache';
  runAsDevin: boolean = true;
  confirmationMode: boolean = false;
  maxIterations: number = 100;
  maxBudgetPerTask?: number;
  e2bApiKey: string = '';
  useHostNetwork: boolean = false;
  sshHostname: string = 'localhost';
  disableColor: boolean = false;
  initializePlugins: boolean = true;
  persistSandbox: boolean = false;
  sshPort: number = 63710;
  sshPassword?: string;
  jwtSecret: string = uuidv4();
  debug: boolean = false;
  enableAutoLint: boolean = false;
  enableCliSession: boolean = false;
  fileUploadsMaxFileSizeMb: number = 0;
  fileUploadsRestrictFileTypes: boolean = false;
  fileUploadsAllowedExtensions: string[] = ['.*'];

  static defaultsDict: Record<string, IFieldInfo> = {};

  constructor() {
    AppConfig.defaultsDict = this.defaultsToDict();
  }

  getLlmConfig(name = 'llm'): LLMConfig {
    if (name in this.llms) {
      return this.llms[name];
    }
    if (name && name !== 'llm') {
      logger.warn(`llm config group ${name} not found, using default config`);
    }
    if (!('llm' in this.llms)) {
      this.llms['llm'] = new LLMConfig();
    }
    return this.llms['llm'];
  }

  setLlmConfig(value: LLMConfig, name = 'llm') {
    this.llms[name] = value;
  }

  getAgentConfig(name = 'agent'): AgentConfig {
    if (name in this.agents) {
      return this.agents[name];
    }
    if (!('agent' in this.agents)) {
      this.agents['agent'] = new AgentConfig();
    }
    return this.agents['agent'];
  }

  setAgentConfig(value: AgentConfig, name = 'agent') {
    this.agents[name] = value;
  }

  getLlmConfigFromAgent(name = 'agent'): LLMConfig {
    const agentConfig = this.getAgentConfig(name);
    const llmConfigName = agentConfig.llmConfig;
    return this.getLlmConfig(llmConfigName);
  }

  defaultsToDict(): Record<string, IFieldInfo> {
    const result: Record<string, IFieldInfo> = {};
    for (const key of Object.keys(this)) {
      const fieldValue = (this as any)[key];

      if (fieldValue instanceof LLMConfig || fieldValue instanceof AgentConfig || fieldValue instanceof SandboxConfig) {
        result[key] = { type: fieldValue.constructor.name.toLowerCase(), optional: false, default: fieldValue.defaultsToDict() };
      } else {
        // @ts-ignore
        result[key] = getFieldInfo(this[key]);
      }
    }
    return result;
  }

  toString(): string {
    const attrStr = Object.keys(this).map(key => {
      let value = (this as any)[key];
      if (['e2bApiKey', 'githubToken', 'jwtSecret', 'sshPassword'].includes(key)) {
        value = value ? '******' : null;
      }
      return `${key}=${JSON.stringify(value)}`;
    }).join(', ');
    return `AppConfig(${attrStr})`;
  }

  toJSON() {
    return this.toString();
  }
}

const config = new AppConfig();

function loadFromEnv(cfg: AppConfig, envOrTomlDict: Record<string, any>) {
  function getOptionalType(unionType: UnionType): any {
    return unionType;
  }

  function setAttrFromEnv(subConfig: any, prefix = '') {
    for (let [fieldName, fieldType] of Object.entries(subConfig)) {
      const envVarName = (prefix + fieldName).toUpperCase();

      if (typeof fieldType === 'object' && !Array.isArray(fieldType)) {
        const nestedSubConfig = subConfig[fieldName];
        setAttrFromEnv(nestedSubConfig, fieldName + '_');
      } else if (envVarName in envOrTomlDict) {
        const value = envOrTomlDict[envVarName];
        try {
          if (Array.isArray(fieldType)) {
            fieldType = getOptionalType(fieldType);
          }

          let castValue;
          if (typeof fieldType === 'boolean') {
            castValue = String(value).toLowerCase() === 'true';
          } else if (typeof fieldType === 'function') {
            castValue = fieldType(value);
          } else {
            castValue = value;
          }
          subConfig[fieldName] = castValue;
        } catch (e) {
          logger.error(`Error setting env var ${envVarName}=${value}: check that the value is of the right type`);
        }
      }
    }
  }

  if ('SANDBOX_TYPE' in envOrTomlDict) {
    logger.error('SANDBOX_TYPE is deprecated. Please use SANDBOX_BOX_TYPE instead.');
    envOrTomlDict['SANDBOX_BOX_TYPE'] = envOrTomlDict['SANDBOX_TYPE'];
  }
  setAttrFromEnv(cfg);

  const defaultLlmConfig = config.getLlmConfig();
  setAttrFromEnv(defaultLlmConfig, 'LLM_');

  const defaultAgentConfig = config.getAgentConfig();
  setAttrFromEnv(defaultAgentConfig, 'AGENT_');
}

function loadFromToml(cfg: AppConfig, tomlFile: string = 'config.toml') {
  try {
    const tomlContents = parseToml(readFileSync(tomlFile, 'utf-8'));
    const tomlConfig = tomlContents as Record<string, any>;

    if (!('core' in tomlConfig)) {
      loadFromEnv(cfg, tomlConfig);
      return;
    }

    const coreConfig = tomlConfig['core'];

    Object.entries(tomlConfig).forEach(([key, value]) => {
      if (typeof value === 'object') {
        try {
          if (key && key.toLowerCase() === 'agent') {
            const nonDictFields = Object.fromEntries(Object.entries(value).filter(([k, v]) => typeof v !== 'object'));
            const agentConfig = new AgentConfig(nonDictFields);
            cfg.setAgentConfig(agentConfig, 'agent');

            Object.entries(value).forEach(([nestedKey, nestedValue]) => {
              if (typeof nestedValue === 'object') {
                const nestedAgentConfig = new AgentConfig(nestedValue);
                cfg.setAgentConfig(nestedAgentConfig, nestedKey);
              }
            });
          }

          if (key && key.toLowerCase() === 'llm') {
            const nonDictFields = Object.fromEntries(Object.entries(value).filter(([k, v]) => typeof v !== 'object'));
            const llmConfig = new LLMConfig(nonDictFields);
            cfg.setLlmConfig(llmConfig, 'llm');

            Object.entries(value).forEach(([nestedKey, nestedValue]) => {
              if (typeof nestedValue === 'object') {
                const nestedLlmConfig = new LLMConfig(nestedValue);
                cfg.setLlmConfig(nestedLlmConfig, nestedKey);
              }
            });
          }
        } catch (e) {
          logger.warn(`Cannot parse config from toml, toml values have not been applied.\n Error: ${e}`);
        }
      }
    });

    try {
      const sandboxConfig = config.sandbox;
      const keysToMigrate = Object.keys(coreConfig).filter(key => key.startsWith('sandbox_'));
      keysToMigrate.forEach(key => {
        const newKey = key.replace('sandbox_', '');
        if (newKey === 'type') newKey = 'box_type';
        if (newKey in sandboxConfig) {
          sandboxConfig[newKey] = coreConfig[key];
          delete coreConfig[key];
        } else {
          logger.warn(`Unknown sandbox config: ${key}`);
        }
      });

      if ('sandbox' in tomlConfig) {
        const newSandboxConfig = new SandboxConfig(tomlConfig['sandbox']);
        AppConfig.sandbox = newSandboxConfig;
      }
    } catch (e) {
      logger.warn(`Cannot parse config from toml, toml values have not been applied.\nError: ${e}`);
    }
  } catch (e) {
    logger.info(`Config file not found: ${e}`);
  }
}

function finalizeConfig(cfg: AppConfig) {
  if (cfg.workspaceMountPath === 'UNDEFINED') {
    cfg.workspaceMountPath = resolve(cfg.workspaceBase);
  }
  cfg.workspaceBase = resolve(cfg.workspaceBase);

  if (cfg.sandbox.boxType === 'local') {
    cfg.workspaceMountPathInSandbox = cfg.workspaceMountPath;
  }

  if (cfg.workspaceMountRewrite) {
    const base = cfg.workspaceBase || process.cwd();
    const parts = cfg.workspaceMountRewrite.split(':');
    cfg.workspaceMountPath = base.replace(parts[0], parts[1]);
  }

  Object.values(cfg.llms).forEach(llm => {
    if (!llm.embeddingBaseUrl) {
      llm.embeddingBaseUrl = llm.baseUrl;
    }
  });

  if (cfg.useHostNetwork && platform() === 'darwin') {
    logger.warn(
      'Please upgrade to Docker Desktop 4.29.0 or later to use host network mode on macOS. ' +
      'See https://github.com/docker/roadmap/issues/238#issuecomment-2044688144 for more information.'
    );
  }

  if (cfg.cacheDir) {
    mkdirSync(cfg.cacheDir, { recursive: true });
  }
}

loadFromToml(config);
loadFromEnv(config, process.env);
finalizeConfig(config);

function getLlmConfigArg(llmConfigArg: string, tomlFile: string = 'config.toml'): LLMConfig | null {
  llmConfigArg = llmConfigArg.trim();

  if (llmConfigArg.startsWith('llm.')) {
    llmConfigArg = llmConfigArg.slice(4);
  }

  logger.info(`Loading llm config from ${llmConfigArg}`);

  try {
    const tomlContents = parseToml(readFileSync(tomlFile, 'utf-8'));
    const tomlConfig = tomlContents as Record<string, any>;

    if ('llm' in tomlConfig && llmConfigArg in tomlConfig['llm']) {
      return new LLMConfig(tomlConfig['llm'][llmConfigArg]);
    }
    logger.debug(`Loading from toml failed for ${llmConfigArg}`);
  } catch (e) {
    logger.error(`Config file not found: ${e}`);
  }
  return null;
}

function getParser(): Command {
  const program = new Command();

  program
    .option('-d, --directory <directory>', 'The working directory for the agent')
    .option('-t, --task <task>', 'The task for the agent to perform', '')
    .option('-f, --file <file>', 'Path to a file containing the task. Overrides -t if both are provided.')
    .option('-c, --agent-cls <agentCls>', 'Name of the default agent to use', config.defaultAgent)
    .option('-i, --max-iterations <maxIterations>', 'The maximum number of iterations to run the agent', config.maxIterations.toString())
    .option('-b, --max-budget-per-task <maxBudgetPerTask>', 'The maximum budget allowed per task, beyond which the agent will stop.', config.maxBudgetPerTask?.toString())
    .option('--eval-output-dir <evalOutputDir>', 'The directory to save evaluation output', 'evaluation/evaluation_outputs/outputs')
    .option('--eval-n-limit <evalNLimit>', 'The number of instances to evaluate')
    .option('--eval-num-workers <evalNumWorkers>', 'The number of workers to use for evaluation', '4')
    .option('--eval-note <evalNote>', 'The note to add to the evaluation directory')
    .option('-l, --llm-config <llmConfig>', 'The group of llm settings, e.g. "llama3" for [llm.llama3] section in the toml file. Overrides model if both are provided.');

  return program;
}

function parseArguments(): OptionValues {
  const parser = getParser();
  parser.parse(process.argv);
  const parsedArgs = parser.opts();

  if (parsedArgs.directory) {
    config.workspaceBase = resolve(parsedArgs.directory);
    console.log(`Setting workspace base to ${config.workspaceBase}`);
  }

  return parsedArgs;
}

export {
  AppConfig,
  AgentConfig,
  LLMConfig,
  SandboxConfig,
  getFieldInfo,
  loadFromEnv,
  loadFromToml,
  finalizeConfig,
  getLlmConfigArg,
  getParser,
  parseArguments, config
};
