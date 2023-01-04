import { TokenTransfer } from './tokenTransfer'

type GetTransfersResponse = {
    transfers: TokenTransfer[];
    offset: number;
};

type GetTransfersOpts = {
    offset: number;
    limit: number;
    toBlockNum: number;
    tokenAddress: string;
};

interface TokenConnector {
    getTransfersForToken (opts: GetTransfersOpts): Promise<GetTransfersResponse>
}

export type {
  TokenConnector,
  GetTransfersResponse,
  GetTransfersOpts
}
