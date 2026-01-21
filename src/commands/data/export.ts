/*
 * Copyright 2026, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


import * as fs from 'node:fs';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

const messages = Messages.loadMessages(
  '@salesforce/plugin-sf-data-export',
  'export'
);

type ExportResult = Array<Record<string, unknown>>;

export default class Export extends SfCommand<ExportResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'target-org': Flags.requiredOrg(),
    soql: Flags.string({
      char: 'q',
      summary: messages.getMessage('flags.soql.summary'),
      required: true,
    }),
    output: Flags.string({
      char: 'f',
      summary: messages.getMessage('flags.output.summary'),
      default: 'export.json',
    }),
  };

  // Run Method
  public async run(): Promise<ExportResult> {
    const { flags } = await this.parse(Export);

    const conn = flags['target-org'].getConnection('60.0');

    const result = await conn.query<Record<string, unknown>>(flags.soql);

    fs.writeFileSync(
      flags.output,
      JSON.stringify(result.records, null, 2)
    );

    this.log(
      messages.getMessage('success', [
        result.records.length.toString(),
        flags.output,
      ])
    );

    return result.records;
  }
}