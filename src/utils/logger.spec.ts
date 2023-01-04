import logger from './logger'

describe('logger', () => {
  it('log', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    expect(consoleSpy).not.toBeCalled()

    logger.log('yo')

    expect(consoleSpy).toBeCalled()
  })

  it('warn', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

    expect(consoleSpy).not.toBeCalled()

    logger.warn('yo')

    expect(consoleSpy).toBeCalled()
  })

  it('error', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(consoleSpy).not.toBeCalled()

    logger.error('yo')

    expect(consoleSpy).toBeCalled()
  })
})
