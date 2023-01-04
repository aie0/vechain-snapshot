import { resetAllCollections } from '../tests/helpers/reset'
import { initTransfers, testTransfers } from '../tests/helpers/transfers'
import { TokenTransfer } from '../domain/tokenTransfer'
import { MongoService } from './service'

describe('mongo', () => {
  const c = MongoService.getDefaultClient()
  const s = new MongoService(c)

  afterEach(async () => {
    await resetAllCollections(MongoService.getDefaultClient())
  })

  it('aggregation of token holders - scoped above', async () => {
    const transfers = await initTransfers(s, c)

    const before = transfers[transfers.length - 1].blockNum - 1
    await s.aggregateHoldersForToken({
      tokenAddress: process.env.TOKEN_ADDRESS || '',
      toBlock: before
    })

    try {
      await c.connect()
      const count = await c.db('testDB').collection('aggregatedHolders').countDocuments()
      expect(count).toBe(3)
    } finally {
      await c.close()
    }

    const temp = await s.getHoldingForToken({
      tokenAddress: process.env.TOKEN_ADDRESS || '',
      holderAddress: '0x3211',
      aggregateBlock: before
    })

    expect(temp.holdings.length).toBe(1)
    expect(temp.holdings[0].tokenAddress).toBe(process.env.TOKEN_ADDRESS || '')
    expect(temp.holdings[0].holderAddress).toBe('0x3211')
    expect(temp.holdings[0].value).toBe(15)
    expect(temp.holdings[0].aggregateBlock).toBeLessThanOrEqual(transfers[transfers.length - 1].blockNum)
    expect(temp.holdings[0].aggregateBlock).toBeGreaterThanOrEqual(before)
  })

  it('migration', async () => {
    const transfers: TokenTransfer[] = testTransfers

    await s.setMigrations({
      transfers
    })

    try {
      await c.connect()
      const count = await c.db('testDB').collection('migrations').countDocuments()
      expect(count).toBe(4)
    } finally {
      await c.close()
    }

    return transfers
  })

  it('aggregation of top token holders', async () => {
    const transfers = await initTransfers(s, c)

    await s.aggregateHoldersForToken({
      tokenAddress: process.env.TOKEN_ADDRESS || '',
      toBlock: transfers[transfers.length - 1].blockNum
    })

    try {
      await c.connect()
      const count = await c.db('testDB').collection('aggregatedHolders').countDocuments()
      expect(count).toBe(4)
    } finally {
      await c.close()
    }

    let temp = await s.getHoldingForToken({
      tokenAddress: process.env.TOKEN_ADDRESS || '',
      limit: 2,
      aggregateBlock: transfers[transfers.length - 1].blockNum
    })

    expect(temp.holdings.length).toBe(2)
    expect(temp.holdings[0].holderAddress).toBe('0x3211')
    expect(temp.holdings[1].holderAddress).toBe('0x1223')

    temp = await s.getHoldingForToken({
      tokenAddress: process.env.TOKEN_ADDRESS || '',
      limit: 3,
      aggregateBlock: transfers[transfers.length - 1].blockNum
    })

    expect(temp.holdings.length).toBe(3)
    expect(temp.holdings[0].holderAddress).toBe('0x3211')
    expect(temp.holdings[1].holderAddress).toBe('0x1223')
    expect(temp.holdings[2].holderAddress).toBe('0x321')

    temp = await s.getHoldingForToken({
      tokenAddress: process.env.TOKEN_ADDRESS || '',
      limit: 100,
      aggregateBlock: transfers[transfers.length - 1].blockNum
    })

    expect(temp.holdings.length).toBe(4)
    expect(temp.holdings[0].holderAddress).toBe('0x3211')
    expect(temp.holdings[1].holderAddress).toBe('0x1223')
    expect(temp.holdings[2].holderAddress).toBe('0x321')
    expect(temp.holdings[3].holderAddress).toBe('0x123')
  })
})
