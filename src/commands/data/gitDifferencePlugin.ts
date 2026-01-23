import { simpleGit, SimpleGit } from 'simple-git';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { Config } from '@oclif/core';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);

const messages = Messages.loadMessages('@salesforce/plugin-sf-data-export', 'export');

export class GitDifferencePlugin extends SfCommand<void> {
  // 1. Inherit default flags (json, loglevel, etc.) by extending SfCommand
  public static readonly summary = messages.getMessage('gitDiffSummary');
  public static readonly examples = messages.getMessages('examples');

  // Custom flags stay here
  public static readonly flags = {
    'base-sha': Flags.string({
      char: 'b',
      summary: messages.getMessage('flags.base-sha.summary'),
      default: 'HEAD~1',
    }),
  };

  // Explicit accessibility modifier (private) for ESLint
  private git: SimpleGit;

  // Explicit accessibility modifier (public) for ESLint
  // You must include these arguments to satisfy the SfCommand signature
  public constructor(argv: string[], config: Config) {
    super(argv, config); // The required super call
    this.git = simpleGit();
  }

  /*
   * Detects filenames changed between two points in Git history.
   * @param baseSha The starting commit (defaults to previous commit)
   * @returns Array of modified filenames
   */
  public async getChangedFiles(baseSha: string = 'HEAD~1'): Promise<string[]> {
    try {
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        throw new Error('Current directory is not a git repository');
      }

      // --name-only returns just the paths of the files
      const diffString = await this.git.diff(['--name-only', baseSha, 'HEAD']);

      // Filter out empty strings from the resulting array
      return diffString.split('\n').filter(Boolean);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Git Detection Failed: ${message}`);
    }
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(GitDifferencePlugin);

    this.spinner.start('Analyzing git diff');

    try {
      const changedFiles = await this.getChangedFiles(flags['base-sha']);

      this.spinner.stop();

      if (changedFiles.length === 0) {
        this.log('No files changed.');
      } else {
        this.log('Changed files:');
        changedFiles.forEach((f) => this.log(` - ${f}`));
      }
    } catch (err) {
      this.spinner.stop('Error');
      this.error(err instanceof Error ? err.message : String(err));
    }
  }
}
