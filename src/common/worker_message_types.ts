/*
 * Copyright 2023 Google LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {
  CancellationToken,
  Disposable,
  GenericRequestHandler,
} from 'vscode-jsonrpc';
import {
  QueryDownloadOptions,
  QueryPanelMessage,
  MSQLQueryPanelMessage,
} from './message_types';
import {CellData, MalloyConfig} from './types';

interface NamedQuerySpec {
  type: 'named';
  name: string;
  uri: string;
}

interface QueryStringSpec {
  type: 'string';
  text: string;
  uri: string;
}

interface QueryFileSpec {
  type: 'file';
  index: number;
  uri: string;
}

interface NamedSQLQuerySpec {
  type: 'named_sql';
  name: string;
  uri: string;
}

interface UnnamedSQLQuerySpec {
  type: 'unnamed_sql';
  index: number;
  uri: string;
}

export type WorkerQuerySpec =
  | NamedQuerySpec
  | QueryStringSpec
  | QueryFileSpec
  | NamedSQLQuerySpec
  | UnnamedSQLQuerySpec;

/*
 * Incoming messages
 */

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MessageExit {}

export interface MessageRun {
  query: WorkerQuerySpec;
  panelId: string;
  name: string;
  showSQLOnly: boolean;
}

export interface MessageRunMSQL {
  panelId: string;
  malloySQLQuery: string;
  statementIndex: number | null;
  showSQLOnly?: boolean;
}

export interface MessageCancel {
  panelId: string;
}

export interface MessageCancelMSQL {
  panelId: string;
}

export interface MessageConfig {
  config: MalloyConfig;
}

export interface MessageFetch {
  id: string;
  uri: string;
  data?: string;
  error?: string;
}

export interface MessageFetchBinary {
  id: string;
  uri: string;
  data?: Uint8Array;
  error?: string;
}

export interface MessageFetchCellData {
  id: string;
  uri: string;
  data?: CellData[];
  error?: string;
}

export interface MessageDownload {
  query: WorkerQuerySpec;
  panelId: string;
  name: string;
  uri: string;
  downloadOptions: QueryDownloadOptions;
}

export type FetchMessage =
  | MessageFetch
  | MessageFetchBinary
  | MessageFetchCellData;

/**
 * Type map of extension message types to message interfaces.
 */
export interface MessageMap {
  'malloy/cancel': MessageCancel;
  'malloy/config': MessageConfig;
  'malloy/exit': void;
  'malloy/fetch': MessageFetch;
  'malloy/fetchBinary': MessageFetchBinary;
  'malloy/fetchCellData': MessageFetchCellData;
  'malloy/cancelMSQL': MessageCancelMSQL;
  'malloy/run': MessageRun;
  'malloy/download': MessageDownload;
  'malloy/run-msql': MessageRunMSQL;
}

/**
 * Outgoing messages
 */

export interface WorkerDownloadMessage {
  name: string;
  error?: string;
}

export interface WorkerLogMessage {
  message: string;
}

export interface WorkerQueryPanelMessage {
  panelId: string;
  message: QueryPanelMessage;
}

export interface WorkerSQLQueryPanelMessage {
  panelId: string;
  message: MSQLQueryPanelMessage;
}

export interface WorkerFetchBinaryMessage {
  uri: string;
}

export interface WorkerFetchCellDataMessage {
  uri: string;
}

export interface WorkerFetchMessage {
  uri: string;
}

/**
 * Map of worker message types to worker message interfaces.
 */
export interface WorkerMessageMap {
  'malloy/download': WorkerDownloadMessage;
  'malloy/log': WorkerLogMessage;
  'malloy/queryPanel': WorkerQueryPanelMessage;
  'malloy/fetchBinary': WorkerFetchBinaryMessage;
  'malloy/fetch': WorkerFetchMessage;
  'malloy/fetchCellData': WorkerFetchCellDataMessage;
  'malloy/MSQLQueryPanel': WorkerSQLQueryPanelMessage;
}

/**
 * Worker side message handler interface. Enforces message directionality.
 */
export interface WorkerMessageHandler {
  onRequest<K extends keyof MessageMap>(
    type: K,
    message: ListenerType<MessageMap[K]>
  ): Disposable;

  sendRequest<R, K extends keyof WorkerMessageMap>(
    type: K,
    message: WorkerMessageMap[K]
  ): Promise<R>;

  log(message: string): void;
}

/**
 * Extension side message handler interface. Enforces message directionality.
 */
export interface ExtensionMessageHandler {
  onRequest<K extends keyof WorkerMessageMap>(
    type: K,
    message: ListenerType<WorkerMessageMap[K]>
  ): Disposable;

  sendRequest<R, K extends keyof MessageMap>(
    type: K,
    message: MessageMap[K]
  ): Promise<R>;
}

/**
 * Abstraction for the two different types of connections we
 * deal with, the vscode-language-server ClientConnection, and the the
 * vscode-json-rpc Message connection.
 */
export interface GenericConnection {
  onRequest<R, E>(
    method: string,
    handler: GenericRequestHandler<R, E>
  ): Disposable;

  sendRequest<R>(
    method: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    param: any,
    token?: CancellationToken
  ): Promise<R>;
}

export type ListenerType<K> = (message: K) => void;
