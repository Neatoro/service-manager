import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { resolve as resolvePath } from 'path';
import { promisify } from 'util';

const runCommand = promisify(exec);

export abstract class BuilderService {

  get imageTypes() {
    return {
      node: 'docker/node'
    };
  }

  async buildImage({ service, manifest, data }) {
    const tempDir = resolvePath(process.cwd(), `temp/${service.id}/${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(resolvePath(tempDir, 'app.zip'), data);

    await runCommand(this.getBuildCommand({ tempDir, type: manifest.type, manifest }));
  }

  getStartParameters(manifest) {
    if (manifest.type === 'node') {
      return ['node', manifest.main];
    }
  }

  abstract getImagePollPolicy();

  abstract getBuildCommand({ tempDir, type, manifest });

  abstract getImageName(service);

};
