import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';


Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

const messages = Messages.loadMessages(
  '@salesforce/plugin-sf-data-export',
  'export'
);


export default class ObjectCompare extends SfCommand<void> {
  public static readonly summary =  messages.getMessage('objectCompareSummary');
  public static readonly examples = messages.getMessages('compareExamples');


  public static readonly flags = {
    object: Flags.string({
      char: 's',
      summary:messages.getMessage('flags.object.summary'),
      required: true,
    }),
    'source-org': Flags.requiredOrg({
      char: 'a',
      summary: messages.getMessage('flags.source-org.summary'),
      required: true,
    }),
    'target-org': Flags.requiredOrg({
      char: 'b',
      summary: messages.getMessage('flags.target-org.summary'),
      required: true,
    }),
  };

  // Run Method
  public async run(): Promise<void> {
    const { flags } = await this.parse(ObjectCompare);
    
    // Get connections for both orgs
    const connSource = flags['source-org'].getConnection('60.0');
    const connTarget = flags['target-org'].getConnection('60.0');

    this.spinner.start(`Comparing ${flags.object} metadata`);

    // Fetch describes in parallel for speed
    const [sourceDesc, targetDesc] = await Promise.all([
      connSource.describe(flags.object),
      connTarget.describe(flags.object)
    ]);

    const sourceFields = new Set(sourceDesc.fields.map(f => f.name));
    const targetFields = new Set(targetDesc.fields.map(f => f.name));

    // Find differences
    const missingInTarget = [...sourceFields].filter(f => !targetFields.has(f));
    const missingInSource = [...targetFields].filter(f => !sourceFields.has(f));

    this.spinner.stop();

    // Display Results in a Table
    if (missingInTarget.length > 0) {
      this.log('\nFields in Source but MISSING in Target:');
      this.styledJSON(missingInTarget);
    }

    if (missingInSource.length > 0) {
      this.log('\nFields in Target but MISSING in Source:');
      this.styledJSON(missingInSource);
    }

    if (missingInTarget.length === 0 && missingInSource.length === 0) {
      this.log('Both orgs have identical field names for this object!');
    }
  }
}