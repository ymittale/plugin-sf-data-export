import * as path from 'node:path';
import { readFileSync } from 'node:fs';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
// import {Org, Connection} from '@salesforce/core';

// import { SfError } from '@salesforce/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

const messages = Messages.loadMessages('@salesforce/plugin-sf-data-export', 'export');

type ContactRecord = {
  Id: string;
};

// type ExportResult = Array<Record<string, unknown>>;

export default class CallCaseCreationController extends SfCommand<void> {
  public static readonly summary = messages.getMessage('callApexClassSummary');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'target-org': Flags.requiredOrg(),
  };

  // Run Method for case creation controller
  public async run(): Promise<void> {
    const { flags } = await this.parse(CallCaseCreationController);

    // Get the connection to the target org
    const conn = flags['target-org'].getConnection('60.0');

    // 1. Locate and read the contact.json file
    // process.cwd() ensures it looks in the directory where you run the command
    const filePath = path.join(process.cwd(), 'contact.json');
    const fileContent = readFileSync(filePath, 'utf-8');

    try {
      // 2. Parse the JSON
      // const contacts = JSON.parse(fileContent);
      const contacts: ContactRecord[] = JSON.parse(fileContent) as ContactRecord[];

      // 3. Extract the Ids
      // const idListString = contacts.map((c: any) => `'${c.Id}'`).join(',');
      const idListString: string = contacts.map((c: ContactRecord): string => `'${c.Id}'`).join(',');

      // 4. Define the Apex snippet to call your method
      // Example: Calling Class 'CaseCreationController' and method 'createCases'
      const apexCode = `
                        List<Id> contactIds = new List<Id>{${idListString}};
                        CaseCreationController.createCases(contactIds);
                      `;

      this.spinner.start(`Reading ${contacts.length} IDs from contact.json and executing Apex`);

      const result = await conn.tooling.executeAnonymous(apexCode);

      this.spinner.stop();

      if (result.success) {
        this.log(`Success: Method called for ${contacts.length} contacts found in file.`);
      } else {
        // Check for compilation errors first, then the exception message
        const errorMsg = result.exceptionMessage ?? result.compileProblem ?? 'Unknown Error';
        const stackTrace = result.exceptionStackTrace ? `\nStack Trace: ${result.exceptionStackTrace}` : '';

        this.error(`Apex Error: ${errorMsg}${stackTrace}`);
      }
    } catch (err: unknown) {
      this.spinner.stop('Error');
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.error(`Operation failed: ${errorMessage}`);
    }
  }
}
