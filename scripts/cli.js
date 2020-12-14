#!/usr/bin/env node

const { program } = require('commander');
const { execSync } = require('child_process');
const os = require('os')
const path = require('path');

function executeCommandSync({ message, command }) {
  console.log(message);
  const processResult = execSync(command);
  console.log(processResult.toString());
  return processResult.toString();
}

program
  .name('service-manager')
  .version('0.0.1')
  .description('Deploy tool');

program
  .command('deploy <type>')
  .description('deploy instance of type')
  .action(async (type) => {
    executeCommandSync({
      message: 'Building buildkit image',
      command: 'docker build -t buildctl -f scripts/buildctl.docker .'
    });

    executeCommandSync({
      message: 'Creating Registry',
      command: 'kubectl apply -f kubernetes/static/registry.yml'
    });

    executeCommandSync({
      message: 'Creating docker network for build process',
      command: 'docker network create service-manager-build'
    });

    executeCommandSync({
      message: 'Start buildkitd',
      command: 'docker run -d --rm --name buildkitd --network service-manager-build --privileged moby/buildkit:rootless --addr tcp://0.0.0.0:3242'
    });

    executeCommandSync({
      message: 'Start registry forward',
      command: `docker run --rm -d -v ${path.resolve(os.homedir(), '.kube', 'config')}:/.kube/config --network service-manager-build --name kube bitnami/kubectl:latest port-forward --address 0.0.0.0 deployment/service-manager-registry-deployment 5000:5000`
    });

    executeCommandSync({
      message: 'Build service-manager image',
      command: `docker run --rm --name buildctl --network service-manager-build -e BUILDKIT_HOST=tcp://buildkitd:3242 -v ${process.cwd()}:/app buildctl buildctl build --frontend=dockerfile.v0 --local context=/app --local dockerfile=/app --output type=image,name=kube:5000/service-manager,push=true,registry.insecure=true`
    });

    executeCommandSync({
      message: 'Stop registry forward',
      command: 'docker kill kube'
    });

    executeCommandSync({
      message: 'Stop buildkitd',
      command: 'docker kill buildkitd'
    });

    executeCommandSync({
      message: 'Deleting docker network for build process',
      command: 'docker network rm service-manager-build'
    });

    const registryIp = executeCommandSync({
      message: 'Getting Registry Cluster IP',
      command: `kubectl get service service-manager-registry-service -o jsonpath={.spec.clusterIP}`
    });

    const kubeIp = executeCommandSync({
      message: 'Getting Kube Cluster IP',
      command: `kubectl get svc kubernetes -o jsonpath={.spec.clusterIP}`
    });

    const accessTokenName = executeCommandSync({
      message: 'Getting Access Token Secret Name',
      command: `kubectl get sa service-manager-access -o jsonpath={.secrets[0].name}`
    });

    executeCommandSync({
      message: 'Generating Kubernets Config',
      command: `npm run kub:gen -- -v registry=${registryIp}:5000 -v kube=${kubeIp} -v kube_access_secret=${accessTokenName}`
    });

    executeCommandSync({
      message: `Apply ${type} configuration`,
      command: `kubectl apply -f kubernetes/${type}`
    });

    executeCommandSync({
      message: 'Apply static configuration',
      command: `kubectl apply -f kubernetes/static`
    });

    executeCommandSync({
      message: 'Apply gen configuration',
      command: `kubectl apply -f kubernetes/gen`
    });
  });

program.parse(process.argv);
