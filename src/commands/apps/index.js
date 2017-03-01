import fs from 'fs-extra';
import _ from 'lodash';
import { Config, Log } from '../../utils';
import appsList from './list';
import appCreate from './create';
import appDelete from './delete';

const helpMessage = `
Usage:

  reaction apps [command]

    Commands:
      list      List your app deployments
      create    Create a new app deployment on Launchdock
      delete    Remove an existing app deployment from Launchdock
`;

export async function apps(yargs) {
  Log.args(yargs.argv);

  const subCommands = yargs.argv._;
  const args = _.omit(yargs.argv, ['_', '$0']);
  const { name, image } = args;

  if (!subCommands[1]) {
    return Log.default(helpMessage);
  }

  // create
  if (subCommands[1] === 'create') {

    if (!name) {
      return Log.error('Error: App name required');
    }

    if (!image) {
      const notInReactionDir = () => {
        Log.error('\nNot in a Reaction app directory.\n');
        Log.info(`To create a new local project, run: ${Log.magenta('reaction init')}\n`);
        Log.info('Or to create a deployment with a prebuilt Docker image, use the --image flag\n');
        Log.info(`Example: ${Log.magenta(`reaction apps create --name ${name} --image myorg/myapp:latest`)}\n`);
      };

      let packageFile;
      try {
        packageFile = fs.readJSONSync('./package.json');
      } catch(e) {
        notInReactionDir();
        process.exit(1);
      }

      if (packageFile.name !== 'reaction') {
        notInReactionDir();
        process.exit(1);
      }

      const keys = Config.get('global', 'launchdock.keys', []);

      if (!keys.length) {
        Log.error('\nAn SSH public key is required to do custom deployments\n');
        Log.info(`To publish a new key: ${Log.magenta('reaction keys add /path/to/key.pub')}\n`);
        process.exit(1);
      }
    }

    return appCreate({ name, image });
  }

  // list
  if (subCommands[1] === 'list') {
    const allApps = await appsList();

    if (allApps.length !== 0) {
      Log.info('\nApps:\n');
      allApps.forEach((app) => Log.info(` ${Log.magenta(app.name)}`));
    }
  }

  // delete
  if (subCommands[1] === 'delete') {
    if (!name) {
      return Log.error('App name required');
    }

    return appDelete({ name });
  }
}