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

import * as vscode from "vscode";
import { ConnectionBackend } from "../../common";
import { getDefaultIndex } from "../../common/connection_manager_types";
import connectionIcon from "../../media/database.svg";
import * as path from "path";
import { VSCodeConnectionManager } from "../connection_manager";

export class ConnectionsProvider
  implements vscode.TreeDataProvider<ConnectionItem>
{
  getTreeItem(element: ConnectionItem): vscode.TreeItem {
    return element;
  }

  private _onDidChangeTreeData: vscode.EventEmitter<
    ConnectionItem | undefined
  > = new vscode.EventEmitter<ConnectionItem | undefined>();

  readonly onDidChangeTreeData: vscode.Event<ConnectionItem | undefined> =
    this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  async getChildren(element?: ConnectionItem): Promise<ConnectionItem[]> {
    if (element === undefined) {
      const config = VSCodeConnectionManager.getConnectionsConfig();
      const defaultIndex = getDefaultIndex(config);
      return config.map(
        (config, index) =>
          new ConnectionItem(
            config.name,
            config.backend,
            index === defaultIndex
          )
      );
    } else {
      return [];
    }
  }
}

class ConnectionItem extends vscode.TreeItem {
  constructor(
    public name: string,
    public backend: string,
    public isDefault: boolean
  ) {
    super(name, vscode.TreeItemCollapsibleState.None);
    const backendName =
      backend === ConnectionBackend.BigQuery
        ? "BigQuery"
        : backend === ConnectionBackend.Postgres
        ? "Postgres"
        : "DuckDB";
    this.description = `(${backendName}${isDefault ? ", default" : ""})`;

    this.iconPath = {
      light: path.join(__filename, "..", connectionIcon),
      dark: path.join(__filename, "..", connectionIcon),
    };
  }
}
