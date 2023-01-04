import { Framework } from '@vechain/connex-framework'
import { Driver, SimpleNet, Net } from '@vechain/connex-driver'
import {
  GetTransfersOpts,
  GetTransfersResponse,
  TokenConnector
} from '../domain/tokenConnector'
import { TokenTransfer } from '../domain/tokenTransfer'
import logger from '../utils/logger'

class VechainService implements TokenConnector {
  private readonly provider: Net
  private driver?: Driver
  private isInit = false
  private readonly logger = logger

  constructor (provider?: Net) {
    if (provider) {
      this.provider = provider
    } else {
      const network = process.env.MAINNET_ETH_NODE || ''
      this.provider = new SimpleNet(network)
    }
  }

  async getTransfersForToken (opts: GetTransfersOpts): Promise<GetTransfersResponse> {
    return await this._getTxsForToken(opts, true)
  }

  async getMigrationsForToken (opts: GetTransfersOpts): Promise<GetTransfersResponse> {
    return await this._getTxsForToken(opts, false)
  }

  async _getTxsForToken (opts: GetTransfersOpts, isTransfer: boolean): Promise<GetTransfersResponse> {
    this.logger.log('VechainService::getTransfersForToken')
    if (!this.isInit) {
      this.driver = await Driver.connect(this.provider)
      this.isInit = true
    }
    let connex

    if (this.driver) {
      connex = new Framework(this.driver)
    } else {
      throw new Error('connex cannot be initiated')
    }

    const transfers: TokenTransfer[] = []
    // Solidity: event Transfer(address indexed _from, address indexed _to, uint256 _value)
    const transferEventABI = { anonymous: false, inputs: [{ indexed: true, name: '_from', type: 'address' }, { indexed: true, name: '_to', type: 'address' }, { indexed: false, name: '_value', type: 'uint256' }], name: isTransfer ? 'Transfer' : 'Migration', type: 'event' }
    const transferEvent = connex.thor.account(opts.tokenAddress).event(transferEventABI)

    // Create a filter from eventABI
    const filter = transferEvent.filter([])

    // Set filter options
    filter?.order('asc') // Work from the 1st event
      .range({
        unit: 'block',
        from: 0,
        to: opts.toBlockNum
      }) // Set the range

    const response = await filter?.apply(opts.offset, opts.limit)
    let i
    for (i = 0; i < response.length; i++) {
      const tx = response[i]
      transfers.push({
        blockNum: tx.meta.blockNumber,
        timestamp: tx.meta.blockTimestamp,
        from: tx.decoded._from,
        to: tx.decoded._to,
        value: tx.decoded._value,
        tokenAddress: opts.tokenAddress
      })
    }

    this.logger.log('VechainService::getTransfersForToken::finished')

    return {
      transfers,
      offset: i
    } as GetTransfersResponse
  }
}

export {
  VechainService
}
