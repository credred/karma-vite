import type { ConfigOptions, Config as KarmaConfig } from 'karma';
import type { AugmentedRequired } from './utils';
import type { Logger as RawLogger } from 'log4js';
import type { ServerResponse } from 'http';

export type Config = AugmentedRequired<
  ConfigOptions,
  'urlRoot' | 'basePath' | 'reporters'
> &
  KarmaConfig;

export interface Logger {
  create(name: string): RawLogger;
}

export type ServeFile = (
  filepath: string,
  rangeHeader: string | undefined,
  response: ServerResponse,
  transform?: (content: string) => string,
  content?: string,
  doNotCache?: boolean,
) => void;
