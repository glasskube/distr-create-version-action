import * as core from '@actions/core'
import { DistrService } from '@glasskube/distr-sdk'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const appId = core.getInput('distr-application-id')
    const versionName: string = core.getInput('distr-application-version-name')
    const composeFile: string = core.getInput(
      'distr-application-version-compose-file'
    )

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.info(`appId: ${appId}, versionName: ${versionName}`)
    core.info(`composeFile: ${composeFile}`)

    const token = core.getInput('distr-api-token')
    const apiBase = core.getInput('distr-api-base')

    core.info(`apiBase: ${apiBase}`)

    const distr = new DistrService({
      apiBase: apiBase,
      apiKey: token
    })

    const v = await distr.getLatestVersion(appId)
    core.info(`latest version: ${JSON.stringify(v)}`)

    const version = await distr.createDockerApplicationVersion(
      appId,
      versionName,
      composeFile
    )

    core.info(new Date().toTimeString())

    // Set outputs for other workflow steps to use
    core.setOutput('version-id', version.id)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
