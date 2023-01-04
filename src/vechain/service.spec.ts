import { SimpleNet } from '@vechain/connex-driver'

import { VechainService } from './service'
import { blocksResponse, bestResponse, transfersResponse } from '../tests/helpers/transfers'

afterAll(() => {
  jest.restoreAllMocks()
})

describe('vechain', () => {
  it('gets transfers for token', async () => {
    const s = new VechainService()
    const result = await s.getTransfersForToken({
      tokenAddress: process.env.TOKEN_ADDRESS || '',
      offset: 0,
      limit: 5,
      toBlockNum: parseInt(process.env.SNAPSHOT_BLOCK_NUMBER || '')
    })
    expect(result).toStrictEqual({
      transfers: [
        { blockNum: 3572455, timestamp: 1566142930, from: '0x0000000000000000000000000000000000000000', to: '0x76921f9dab5cf6cec34f3bdd47d0b0266d3b610b', value: '1000000000000000000000000000', tokenAddress: '0x46209D5e5a49C1D403F4Ee3a0A88c3a27E29e58D' },
        { blockNum: 3572477, timestamp: 1566143150, from: '0x76921f9dab5cf6cec34f3bdd47d0b0266d3b610b', to: '0xe219f0b305573f5f878c5363d77d6726a9b1d580', value: '10000000000000000000000', tokenAddress: '0x46209D5e5a49C1D403F4Ee3a0A88c3a27E29e58D' },
        { blockNum: 3611683, timestamp: 1566537290, from: '0x76921f9dab5cf6cec34f3bdd47d0b0266d3b610b', to: '0x747fa3858456f3978cc747ca4290111b933986d5', value: '999990000000000000000000000', tokenAddress: '0x46209D5e5a49C1D403F4Ee3a0A88c3a27E29e58D' },
        { blockNum: 3639042, timestamp: 1566811760, from: '0xe219f0b305573f5f878c5363d77d6726a9b1d580', to: '0x254afc2490d83b1a56fe621cd708f89456472d87', value: '2000000000000000000000', tokenAddress: '0x46209D5e5a49C1D403F4Ee3a0A88c3a27E29e58D' },
        { blockNum: 3639151, timestamp: 1566812850, from: '0x254afc2490d83b1a56fe621cd708f89456472d87', to: '0xeabbb37abc23f75a0e5cfefc51698c6d56e71238', value: '1000000000000000000000', tokenAddress: '0x46209D5e5a49C1D403F4Ee3a0A88c3a27E29e58D' }],
      offset: 5
    })
  })

  it('gets migrations for token', async () => {
    const mockedProvider = new SimpleNet('')
    jest.spyOn(mockedProvider, 'http').mockImplementation((method, path, params?) => {
      if (path.includes('blocks/0')) {
        return Promise.resolve(blocksResponse)
      } else if (path.includes('blocks/best')) {
        return Promise.resolve(bestResponse)
      } else {
        return Promise.resolve(transfersResponse)
      }
    })

    const s = new VechainService(mockedProvider)
    const result = await s.getMigrationsForToken({
      tokenAddress: process.env.MIGRATION_ADDRESS || '',
      offset: 0,
      limit: 5,
      toBlockNum: parseInt(process.env.SNAPSHOT_BLOCK_NUMBER || '')
    })
    expect(result).toStrictEqual({
      transfers: [
        { blockNum: 3572455, timestamp: 1566142930, from: '0x0000000000000000000000000000000000000000', to: '0x76921f9dab5cf6cec34f3bdd47d0b0266d3b610b', value: '1000000000000000000000000000', tokenAddress: '0x46209D5e5a49C1D403F4Ee3a0A88c3a27E29e58D' },
        { blockNum: 3572477, timestamp: 1566143150, from: '0x76921f9dab5cf6cec34f3bdd47d0b0266d3b610b', to: '0xe219f0b305573f5f878c5363d77d6726a9b1d580', value: '10000000000000000000000', tokenAddress: '0x46209D5e5a49C1D403F4Ee3a0A88c3a27E29e58D' },
        { blockNum: 3611683, timestamp: 1566537290, from: '0x76921f9dab5cf6cec34f3bdd47d0b0266d3b610b', to: '0x747fa3858456f3978cc747ca4290111b933986d5', value: '999990000000000000000000000', tokenAddress: '0x46209D5e5a49C1D403F4Ee3a0A88c3a27E29e58D' },
        { blockNum: 3639042, timestamp: 1566811760, from: '0xe219f0b305573f5f878c5363d77d6726a9b1d580', to: '0x254afc2490d83b1a56fe621cd708f89456472d87', value: '2000000000000000000000', tokenAddress: '0x46209D5e5a49C1D403F4Ee3a0A88c3a27E29e58D' },
        { blockNum: 3639151, timestamp: 1566812850, from: '0x254afc2490d83b1a56fe621cd708f89456472d87', to: '0xeabbb37abc23f75a0e5cfefc51698c6d56e71238', value: '1000000000000000000000', tokenAddress: '0x46209D5e5a49C1D403F4Ee3a0A88c3a27E29e58D' }],
      offset: 5
    })
  })
})
