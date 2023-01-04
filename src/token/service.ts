import { SyncData } from '../domain/syncData'
import { GetTransfersResponse, TokenConnector } from '../domain/tokenConnector'
import { TokenHolding } from '../domain/tokenHolding'
import {
  AggregateHoldersForTokenOpts,
  GetTokenHoldingsOpts,
  GetTokenSyncDataOpts,
  MongoService,
  SetTokenSyncDataOpts
} from '../mongo/service'
import logger from '../utils/logger'

type GetHoldingForTokenResponse = {
    holdings: TokenHolding[]
}

type AggregateTransfersOpts = AggregateHoldersForTokenOpts
type GetHoldingForTokenOpts = GetTokenHoldingsOpts

type SyncTransfersOpts = {
    tokenAddress: string,
    toBlockNum: number,
    offset: number,
    limit: number
}

class TokenService {
  private readonly dbService: MongoService
  private readonly ethService: TokenConnector

  private readonly logger = logger

  constructor (dbService: MongoService, ethService: TokenConnector) {
    this.dbService = dbService
    this.ethService = ethService
  }

  async aggregateTransfers (opts: AggregateTransfersOpts) {
    await this.dbService.aggregateHoldersForToken({
      tokenAddress: opts.tokenAddress,
      toBlock: opts.toBlock
    })
  }

  async getHoldingForToken (opts: GetHoldingForTokenOpts): Promise<GetHoldingForTokenResponse> {
    const resp = await this.dbService.getHoldingForToken({
      tokenAddress: opts.tokenAddress,
      holderAddress: opts.holderAddress,
      aggregateBlock: opts.aggregateBlock
    })

    return {
      holdings: resp.holdings
    } as GetHoldingForTokenResponse
  }

  async syncTransfers (opts: SyncTransfersOpts) {
    this.logger.log('BotService::syncTransfers')
    const syncResp = await this.dbService.getTokenSyncDataByToken({ tokenAddress: opts.tokenAddress } as GetTokenSyncDataOpts)
    let syncData = syncResp.data

    if (!syncData) {
      syncData = {
        toBlockNum: 0,
        toTimestamp: 0,
        tokenAddress: opts.tokenAddress
      } as SyncData
    }

    let isOk = true
    let offset = 0

    let response: GetTransfersResponse
    let toBlockNum = -1
    let toTimestamp = 0

    while (isOk) {
      response = await this.ethService.getTransfersForToken({
        toBlockNum: opts.toBlockNum,
        tokenAddress: syncData.tokenAddress,
        offset,
        limit: opts.limit
      })

      if (response.offset > 0) {
        offset += response.offset

        const maxObj = response.transfers.reduce((res, obj) => {
          return (obj.timestamp > res.timestamp) ? obj : res
        })
        toBlockNum = Math.max(maxObj.blockNum, toBlockNum)
        toTimestamp = Math.max(maxObj.timestamp, toTimestamp)

        await this.dbService.setTransfers({ transfers: response.transfers })

        this.logger.log('BotService::syncTransfers::finished')
      } else {
        isOk = false
      }
    }

    // store checkpoint
    syncData.toTimestamp = toTimestamp
    syncData.toBlockNum = toBlockNum
    syncData.syncDate = new Date(toTimestamp).setHours(0, 0, 0, 0)
    await this.dbService.setTokenSyncData({ data: syncData } as SetTokenSyncDataOpts)
  }
}

export {
  TokenService,
  SyncTransfersOpts,
  AggregateTransfersOpts,
  GetHoldingForTokenOpts,
  GetHoldingForTokenResponse
}
