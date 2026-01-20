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

export default class BulkExport extends SfCommand<ExportResult>{
    public static readonly summary = messages.getMessage('bulkSummary');
    public static readonly examples = messages.getMessages('bulkExamples');

    public static readonly flags = {
      'target-org': Flags.requiredOrg(),
      object: Flags.string({
        char: 's',
        summary:messages.getMessage('flags.object.summary'),
        required: true,
      }),
      output: Flags.string({
        char: 't',
        summary: messages.getMessage('flags.output.summary'),
        default: 'bulkExport.json',
      }),
    };

    public async run(): Promise<ExportResult> {
      const { flags } = await this.parse(BulkExport);

      const conn = flags['target-org'].getConnection('60.0');

      this.spinner.start(`Fetching fields for ${flags.object}`);

      // 1. Describe the object to get all field names
      const describe = await conn.describe(flags.object);
      const fields = describe.fields.map((f) => f.name).join(', ');

      // 2. Build the "Select All" query
      const query = `SELECT ${fields} FROM ${flags.object}`;

      this.spinner.status = 'Querying data...';
      const result = await conn.query(query);

      // 3. Save to file
      const fileName = `${flags.object}_all_fields.json`;
      fs.writeFileSync(fileName, JSON.stringify(result.records, null, 2));

      this.spinner.stop();
      this.log(`Successfully exported ${result.records.length} records to ${fileName}`);

      return result.records;

    }
}



