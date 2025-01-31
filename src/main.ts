import * as core from '@actions/core'
import { DistrService } from '@glasskube/distr-sdk'
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

    const composeFile: string = core.getInput('compose-file')
    if (composeFile !== '') {
      const composeData = await fs.readFile(composeFile, 'utf8')
      const version = await distr.createDockerApplicationVersion(
        appId,
        versionName,
        composeData
      )
      core.setOutput('created-version-id', version.id)
    } else {
      const chartName: string = core.getInput('chart-name')
      const chartVersion: string = core.getInput('chart-version')
      const chartType: string = core.getInput('chart-type')
      const chartUrl: string = core.getInput('chart-url')
      const baseValuesFile: string = core.getInput('base-values-file')
      const templateFile: string = core.getInput('template-file')

      const baseValuesFileData = baseValuesFile
        ? await fs.readFile(baseValuesFile, 'utf8')
        : undefined
      const templateFileData = templateFile
        ? await fs.readFile(templateFile, 'utf8')
        : undefined
      const version = await distr.createKubernetesApplicationVersion(
        appId,
        versionName,
        {
          chartName,
          chartVersion,
          chartType,
          chartUrl,
          baseValuesFileData,
          templateFileData
        }
      )
      core.setOutput('created-version-id', version.id)
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
