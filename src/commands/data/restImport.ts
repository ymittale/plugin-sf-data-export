import * as fs from 'node:fs';
import * as path from 'node:path';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, Connection } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';

// Load messages for help text
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-sf-data-export', 'export');

export default class RestImport extends SfCommand<void> {
  // Enables the use of --target-org
  public static readonly requiresOrg = true;

  public static readonly summary = messages.getMessage('restImportSummary');
  public static readonly examples = messages.getMessages('restImportExamples');

  public static readonly flags = {
    'target-org': Flags.requiredOrg({
      char: 'o',
      summary: messages.getMessage('flags.target-org.summary'),
      required: true,
    }),
    'input-file': Flags.string({
      char: 'f',
      summary: messages.getMessage('flags.input-file.summary'),
      default: './data/restExport.json',
    }),
  };

  public async run(): Promise<void> {
    try {
      const { flags } = await this.parse(RestImport);

      const org = flags['target-org'];

      if (!org) {
        throw new Error('Could not find the target org.');
      }

      const conn: Connection = org.getConnection('60.0');

      // 1. Read the JSON file from your local data folder
      const data = fs.readFileSync(path.resolve(flags['input-file']), 'utf8');

      // 2. POST the data to Org B's Apex REST endpoint
      const result = await conn.request<AnyJson>({
        method: 'POST',
        url: '/services/apexrest/DataImport/',
        body: data,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/plain',
        },
      });

      this.log('Data successfully pushed to Org B');
      this.log(`Response from Salesforce: ${result as string}`);
      // this.styledJSON(result);
    } catch (err) {
      this.error(err instanceof Error ? err.message : String(err));
    }
  }
}
