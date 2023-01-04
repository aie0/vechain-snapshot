/* istanbul ignore next */
const logger = {
  log (...parameters: unknown[]) {
    console.log(...parameters)
  },
  warn (...parameters: unknown[]) {
    console.warn(...parameters)
  },
  error (...parameters: unknown[]) {
    console.error(...parameters)
  }
}

export default logger
