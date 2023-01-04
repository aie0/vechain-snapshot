import { MongoClient, ServerApiVersion } from 'mongodb'

import { SyncData } from '../domain/syncData'
import { TokenHolding } from '../domain/tokenHolding'
import { TokenTransfer } from '../domain/tokenTransfer'
import logger from '../utils/logger'

type GetTokenHoldingsOpts = {
  tokenAddress: string
  aggregateBlock: number
  holderAddress?: string
  limit?: number
}

type GetTokenHoldingsResponse = {
  holdings: TokenHolding[]
}

type AggregateHoldersForTokenOpts = {
  tokenAddress: string,
  toBlock: number
}

type SetTransfersOpts = {
    transfers: TokenTransfer[]
}

type TokenAggregatedHolding = {
  _id: string;
  balance: number,
  aggregateBlock: number,
  timestamp: number
}

type SetTokenSyncDataOpts = {
  data: SyncData
}

type GetTokenSyncDataOpts = {
  tokenAddress: string
};

type GetTokenSyncDataResponse = {
  data?: SyncData
};

class MongoService {
  private readonly client: MongoClient

  private readonly logger = logger

  constructor (mongoClient?: MongoClient) {
    if (mongoClient) {
      this.client = mongoClient
    } else {
      this.client = MongoService.getDefaultClient()
    }
  }

  static getDefaultClient () {
    const credentials = process.env.MONGO_CA_PATH
    const client = new MongoClient(process.env.MONGO_URI ? process.env.MONGO_URI : '', {
      sslKey: credentials,
      sslCert: credentials,
      serverApi: ServerApiVersion.v1
    })
    return client
  }

  async aggregateHoldersForToken (opts: AggregateHoldersForTokenOpts) {
    this.logger.log('MongoService::aggregateHoldersForToken')

    try {
      await this.client.connect()

      const m = `function () {
        emit({
          holderAddress: this.to,
          aggregateBlock: aggregateBlock,
          tokenAddress: tokenAddress
        }, this.value);
        emit({
          holderAddress: this.from,
          aggregateBlock: aggregateBlock,
          tokenAddress: tokenAddress
        }, -this.value);
      }`

      const r = `function (key, values) {
        return Array.sum(values);
      }`

      const f = `function (key, value) {
        return {
          balance: value,
          blockNum: blockNum
        }; 
      }`

      const query = {
        tokenAddress: {
          $eq: opts.tokenAddress
        }
      }

      const blockNumQuery = {}
      Object.assign(blockNumQuery,
        (opts.toBlock)
          ? {
              $lte: opts.toBlock
            }
          : {})

      if (opts.toBlock) {
        Object.assign(query, {
          blockNum: blockNumQuery
        })
      }

      await this.client.db('testDB').collection('transfers').mapReduce(m, r, {
        finalize: f,
        query,
        scope: {
          tokenAddress: opts.tokenAddress,
          aggregateBlock: opts.toBlock,
          blockNum: 1 // doesn't matter
        },
        out: {
          merge: 'aggregatedHolders'
        }
      })
    } finally {
      await this.client.close()
    }

    this.logger.log('MongoService::aggregateHoldersForToken::finished')
  }

  async getHoldingForToken (opts: GetTokenHoldingsOpts): Promise<GetTokenHoldingsResponse> {
    this.logger.log('MongoService::getHoldingForToken')

    const query = {
      '_id.tokenAddress': opts.tokenAddress
    }

    if (opts.aggregateBlock) {
      Object.assign(query, {
        '_id.aggregateBlock': {
          $lte: opts.aggregateBlock
        }
      })
    }

    if (opts.holderAddress) {
      Object.assign(query, {
        '_id.holderAddress': opts.holderAddress
      })
    }

    const pipeline: any[] = [{
      $match: query
    }, {
      $group: {
        _id: '$_id.holderAddress',
        balance: { $sum: '$value.balance' },
        aggregateBlock: { $max: '$_id.aggregateBlock' },
        timestamp: { $max: '$value.timestamp' }
      }
    }]

    if (opts.limit) {
      pipeline.push({
        $sort: { balance: -1 }
      })

      pipeline.push({
        $limit: (opts.limit) ? opts.limit : 10
      })
    }

    const result: TokenHolding[] = []
    try {
      await this.client.connect()

      const temp = await this.client.db('testDB').collection('aggregatedHolders').aggregate<TokenAggregatedHolding>(pipeline).toArray()

      if (temp) {
        for (let i = 0; i < temp.length; i++) {
          result.push({
            tokenAddress: opts.tokenAddress,
            holderAddress: temp[i]._id,
            value: temp[i].balance,
            aggregateBlock: temp[i].aggregateBlock
          } as TokenHolding)
        }
      }
    } finally {
      await this.client.close()
    }

    this.logger.log('MongoService::getHoldingForToken::finished')

    return {
      holdings: result
    } as GetTokenHoldingsResponse
  }

  async getTokenSyncDataByToken (opts: GetTokenSyncDataOpts): Promise<GetTokenSyncDataResponse> {
    this.logger.log('MongoService::getTokenSyncDataByToken')

    let result: SyncData | null = null

    try {
      await this.client.connect()

      const temp = await this.client.db('testDB').collection('syncData').findOne<SyncData>({
        tokenAddress: opts.tokenAddress
      }, {
        sort: [['timestamp', -1]]
      })

      if (temp) {
        result = {
          toBlockNum: temp.toBlockNum,
          toTimestamp: temp.toTimestamp,
          tokenAddress: temp.tokenAddress
        }
      }
    } finally {
      await this.client.close()
    }

    this.logger.log('MongoService::getTokenSyncDataByToken::finished')
    return {
      data: result
    } as GetTokenSyncDataResponse
  }

  async setTokenSyncData (opts: SetTokenSyncDataOpts) {
    this.logger.log('MongoService::setTokenSyncData')

    try {
      await this.client.connect()

      await this.client.db('testDB').collection('syncData').insertOne(opts.data)
    } finally {
      await this.client.close()
    }

    this.logger.log('MongoService::setTokenSyncData::finished')
  }

  async setTransfers (opts: SetTransfersOpts) {
    this.logger.log('MongoService::setTransfers')

    try {
      await this.client.connect()

      await this.client.db('testDB').collection('transfers').insertMany(opts.transfers)
    } finally {
      await this.client.close()
    }

    this.logger.log('MongoService::setTransfers::finished')
  }

  async setMigrations (opts: SetTransfersOpts) {
    this.logger.log('MongoService::setMigrations')

    try {
      await this.client.connect()

      await this.client.db('testDB').collection('migrations').insertMany(opts.transfers)
    } finally {
      await this.client.close()
    }

    this.logger.log('MongoService::setMigrations::finished')
  }
}

export {
  MongoService,
  GetTokenSyncDataOpts,
  GetTokenSyncDataResponse,
  SetTokenSyncDataOpts,
  AggregateHoldersForTokenOpts,
  GetTokenHoldingsOpts
}
