import * as fs from 'node:fs';
import * as path from 'node:path';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, Connection } from '@salesforce/core';

// Load messages for help text
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-sf-data-export', 'export');

export default class RestExport extends SfCommand<void> {
  // Enables the use of --target-org
  public static readonly requiresOrg = true;

  public static readonly summary = messages.getMessage('restExportSummary');
  public static readonly examples = messages.getMessages('restExportExamples');

  public static readonly flags = {
    'target-org': Flags.requiredOrg({
      char: 'o',
      summary: messages.getMessage('flags.target-org.summary'),
      required: true,
    }),
    output: Flags.string({
      char: 'f',
      summary: messages.getMessage('flags.output.summary'),
      default: './data/restExport.json',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(RestExport);

    // EXPLICIT ACCESS: Access the org via the parsed flags
    // This is often more stable in the latest SF CLI versions
    const org = flags['target-org'];

    if (!org) {
      throw new Error('Could not find the target org.');
    }

    const conn: Connection = org.getConnection('60.0');

    this.spinner.start('Calling Apex REST Export Resource');

    try {
      // 1. Hit the custom endpoint you created in Org A
      const result = await conn.request({
        method: 'GET',
        url: '/services/apexrest/DataExport/',
      });

      // 2. Prepare the directory
      const filePath = path.resolve(flags['output']);
      const directory = path.dirname(filePath);

      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      // 3. Write the JSON data to disk
      fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf8');

      this.spinner.stop('Done');
      this.log(`\nSUCCESS: Data written to ${filePath}`);
    } catch (err) {
      this.spinner.stop('Failed');
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.error(`REST Call Failed: ${errorMessage}`);
    }
  }
}
