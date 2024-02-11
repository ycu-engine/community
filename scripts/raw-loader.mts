import module from 'node:module'
import { extname } from 'node:path'
import type { LoadHook, ResolveHook, ResolveFnOutput } from 'module'

import { isMainThread } from 'node:worker_threads'

// Loaded via --import flag
if (isMainThread) {
  module.register('./raw-loader.mts', {
    parentURL: import.meta.url,
    data: true,
  })
}

const FORMAT = 'raw'
const extensions = ['.md', '.css', '.scss']

export const resolve: ResolveHook = async (specifier, context, nextResolve) => {
  const ext = extname(specifier)
  if (!extensions.includes(ext)) return nextResolve(specifier, context)
  const { url } = await nextResolve(specifier, context)
  // @ts-expect-error - markdown format は後述の load で処理される
  return {
    format: FORMAT,
    shortCircuit: true,
    url,
  } as ResolveFnOutput
}

export const load: LoadHook = async (url, context, nextLoad) => {
  // @ts-expect-error - 前述の resolve で format が markdown になっている
  if (context.format !== FORMAT) return nextLoad(url, context)

  const rawSource =
    '' + (await nextLoad(url, { ...context, format: 'module' })).source

  const code = `export default \`${rawSource}\``
  return { source: code, format: 'module' }
}
