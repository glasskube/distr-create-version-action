import * as core from '@actions/core';
import {DistrService, HelmChartType} from '@distr-sh/distr-sdk';
import * as fs from 'node:fs/promises';

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const token = requiredInput('api-token');
    const apiBase = core.getInput('api-base') || undefined;
    const appId = requiredInput('application-id');
    const versionName = requiredInput('version-name');
    const updateDeployments = core.getBooleanInput('update-deployments');

    const distr = new DistrService({
      apiBase: apiBase,
      apiKey: token,
    });

    const composePath = core.getInput('compose-file');
    const templatePath = core.getInput('template-file');
    const templateFile = templatePath ? await fs.readFile(templatePath, 'utf8') : undefined;
    const linkTemplate = core.getInput('link-template') || undefined;

    let versionId: string;
    if (composePath !== '') {
      const composeFile = await fs.readFile(composePath, 'utf8');
      const version = await distr.createDockerApplicationVersion(appId, versionName, {
        composeFile,
        templateFile,
        linkTemplate,
      });
      if (!version.id) {
        throw new Error('Created version does not have an ID');
      }
      versionId = version.id;
      core.setOutput('created-version-id', version.id);
    } else {
      const chartVersion = requiredInput('chart-version');
      const chartType = requiredInput('chart-type') as HelmChartType;
      const chartName = chartType === 'repository' ? requiredInput('chart-name') : undefined;
      const chartUrl = requiredInput('chart-url');
      const baseValuesPath = core.getInput('base-values-file');
      const baseValuesFile = baseValuesPath ? await fs.readFile(baseValuesPath, 'utf8') : undefined;
      const version = await distr.createKubernetesApplicationVersion(appId, versionName, {
        chartName,
        chartVersion,
        chartType,
        chartUrl,
        baseValuesFile,
        templateFile,
        linkTemplate,
      });
      if (!version.id) {
        throw new Error('Created version does not have an ID');
      }
      versionId = version.id;
      core.setOutput('created-version-id', version.id);
    }

    if (updateDeployments) {
      core.info('Updating all deployments to the new version...');
      const result = await distr.updateAllDeployments(appId, versionId);
      core.info(`Updated ${result.updatedTargets.length} deployment target(s)`);
      if (result.skippedTargets.length > 0) {
        core.info(`Skipped ${result.skippedTargets.length} deployment target(s):`);
        result.skippedTargets.forEach((target) => {
          core.info(`  - ${target.deploymentTargetName}: ${target.reason}`);
        });
      }
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}

function requiredInput(id: string): string {
  const val = core.getInput(id);
  if (val === '') {
    throw new Error(`Input ${id} is required`);
  }
  return val;
}
