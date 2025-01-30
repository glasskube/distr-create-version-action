import * as core from '@actions/core'
import { DistrService } from '@glasskube/distr-sdk'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const versionName: string = core.getInput('distr-application-version-name')

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.info(`versionName: ${versionName}`)

    const token = core.getInput('DISTR_TOKEN')
    const apiBase = core.getInput('DISTR_API_BASE')
    const appId = core.getInput('distr-application-id')

    core.info(`${apiBase} ${appId}`)

    const distr = new DistrService({
      apiBase: apiBase,
      apiKey: token
    })

    const v = await distr.getLatestVersion(appId)
    core.info(`latest version: ${JSON.stringify(v)}`)

    core.info(new Date().toTimeString())

    // Set outputs for other workflow steps to use
    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
