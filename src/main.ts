import * as core from '@actions/core'
import { DistrService, HelmChartType } from '@glasskube/distr-sdk'
import * as fs from 'node:fs/promises'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const token = core.getInput('api-token')
    const apiBase = core.getInput('api-base')
    const appId = core.getInput('application-id')
    const versionName: string = core.getInput('version-name')
    core.debug(
      `apiBase: ${apiBase}, appId: ${appId}, versionName: ${versionName}, token given: ${token !== ''}`
    )

    const distr = new DistrService({
      apiBase: apiBase,
      apiKey: token
    })

    const composePath: string = core.getInput('compose-file')
    if (composePath !== '') {
      const composeFile = await fs.readFile(composePath, 'utf8')
      const version = await distr.createDockerApplicationVersion(
        appId,
        versionName,
        composeFile
      )
      core.setOutput('created-version-id', version.id)
    } else {
      const chartName: string = core.getInput('chart-name')
      const chartVersion: string = core.getInput('chart-version')
      const chartType = core.getInput('chart-type') as HelmChartType
      const chartUrl: string = core.getInput('chart-url')
      const baseValuesPath: string = core.getInput('base-values-file')
      const templatePath: string = core.getInput('template-file')

      const baseValuesFile = baseValuesPath
        ? await fs.readFile(baseValuesPath, 'utf8')
        : undefined
      const templateFile = templatePath
        ? await fs.readFile(templatePath, 'utf8')
        : undefined
      const version = await distr.createKubernetesApplicationVersion(
        appId,
        versionName,
        {
          chartName,
          chartVersion,
          chartType,
          chartUrl,
          baseValuesFile,
          templateFile
        }
      )
      core.setOutput('created-version-id', version.id)
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
