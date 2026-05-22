/**
 * build/afterSign.js
 *
 * Хук electron-builder, который вызывается после фазы «sign» сборки.
 * Для macOS делаем ad-hoc подпись `.app` командой `codesign --sign -`.
 *
 * Зачем: без подписи на современном macOS Gatekeeper показывает
 * «PsyNote повреждён и не может быть открыт». Ad-hoc подпись (с пустой
 * identity) не требует Apple Developer ID, выполняется локально и
 * убирает «is damaged» — пользователю остаётся только один раз снять
 * карантинный xattr или нажать «Открыть всё равно» в Privacy & Security.
 *
 * Для Windows / Linux хук — no-op.
 */
const { execFile } = require('node:child_process')

module.exports = async function afterSign(context) {
  const { electronPlatformName, appOutDir, packager } = context
  if (electronPlatformName !== 'darwin') return

  const appName = packager.appInfo.productFilename
  const appPath = `${appOutDir}/${appName}.app`

  await new Promise((resolve, reject) => {
    execFile(
      'codesign',
      ['--force', '--deep', '--sign', '-', appPath],
      (err, _stdout, stderr) => {
        if (err) {
          console.error('[afterSign] codesign failed:', stderr || err.message)
          reject(err)
        } else {
          console.log(`[afterSign] ad-hoc signed: ${appPath}`)
          resolve()
        }
      }
    )
  })
}
