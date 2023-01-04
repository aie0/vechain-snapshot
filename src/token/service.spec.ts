import { VechainService } from '../vechain/service'
import { GetTransfersOpts } from '../domain/tokenConnector'
import { MongoService } from '../mongo/service'
import { resetAllCollections } from '../tests/helpers/reset'
import { initTransfers, testTransfers } from '../tests/helpers/transfers'
import {
  TokenService,
  SyncTransfersOpts,
  GetHoldingForTokenOpts,
  AggregateTransfersOpts
} from './service'

describe('token', () => {
  afterEach(async () => {
    await resetAllCollections(MongoService.getDefaultClient())
  })

  it('aggregation of token holders', async () => {
    const eth = new VechainService()
    const client = MongoService.getDefaultClient()
    const mongo = new MongoService(client)
    const s = new TokenService(mongo, eth)

    const transfers = await initTransfers(mongo, client)

    const before = transfers[transfers.length - 1].blockNum
    await s.aggregateTransfers({
      tokenAddress: process.env.TOKEN_ADDRESS,
      toBlock: before
    } as AggregateTransfersOpts)

    const temp = await s.getHoldingForToken({
      tokenAddress: process.env.TOKEN_ADDRESS,
      holderAddress: '0x3211'
    } as GetHoldingForTokenOpts)

    expect(temp.holdings.length).toBe(1)
    expect(temp.holdings[0].tokenAddress).toBe(process.env.TOKEN_ADDRESS)
    expect(temp.holdings[0].holderAddress).toBe('0x3211')
    expect(temp.holdings[0].value).toBe(9)
    expect(temp.holdings[0].aggregateBlock).toBeLessThanOrEqual(transfers[transfers.length - 1].blockNum)
    expect(temp.holdings[0].aggregateBlock).toBeGreaterThanOrEqual(before)
  })

  it('sync transfers for token', async () => {
    const client = MongoService.getDefaultClient()
    const mongo = new MongoService(client)
    const eth = new VechainService()
    const s = new TokenService(mongo, eth)

    eth.getTransfersForToken = jest.fn().mockImplementation(async (opts: GetTransfersOpts) => {
      if (opts.offset === 0) { // 1st page
        return {
          transfers: testTransfers.slice(0, 2),
          offset: 2
        }
      } else if (opts.offset === 2) { // 2nd page
        return {
          transfers: testTransfers.slice(2),
          offset: 2
        }
      } else {
        expect(opts.offset).toBe(4)
        return {
          transfers: [],
          offset: 0
        }
      }
    })

    await s.syncTransfers({
      tokenAddress: process.env.TOKEN_ADDRESS,
      toBlockNum: testTransfers[testTransfers.length - 1].blockNum
    } as SyncTransfersOpts)

    try {
      await client.connect()
      const result = await client.db('testDB').collection('transfers').find().toArray()

      expect(result).toStrictEqual(testTransfers)
    } finally {
      await client.close()
    }
  })
})
