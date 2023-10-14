declare module '@sbp/sbp' {
  export type SbpInvocation = [string, ...unknown[]]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _default: (...args: SbpInvocation) => any
  export default _default
}
