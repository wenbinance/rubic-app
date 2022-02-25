import { Injectable } from '@angular/core';
import { EthLikeWeb3PrivateService } from '@app/core/services/blockchain/blockchain-adapters/eth-like/web3-private/eth-like-web3-private.service';
import { ENVIRONMENT } from 'src/environments/environment';
import { CELER_CONTRACT_ABI } from './constants/CELER_CONTRACT_ABI';
import { CelerTransferWithSwapData } from './models/celer-transfer-with-swap-data.interface';
import { TransactionReceipt } from 'web3-eth';

@Injectable()
export class CelerService {
  private readonly celerContractAddress = ENVIRONMENT.crossChain.celerContractAddress;

  constructor(private readonly web3PrivateService: EthLikeWeb3PrivateService) {}

  public async transferWithSwap(data: CelerTransferWithSwapData): Promise<TransactionReceipt> {
    return await this.web3PrivateService.tryExecuteContractMethod(
      this.celerContractAddress,
      CELER_CONTRACT_ABI,
      'transferWithSwap',
      this.getCeletTransferWithSwapArguments(data)
    );
  }

  approve(): void {}

  needApprove(): boolean {
    return true;
  }

  /**
   * Calculates swap should be done via Celer.
   */
  public shouldSwapViaCeler(value: boolean): boolean {
    return value;
  }

  private getCeletTransferWithSwapArguments(data: CelerTransferWithSwapData): unknown[] {
    const { receiver, amountIn, dstChainId, srcSwap, dstSwap, maxBridgeSlippage, nonce } = data;

    return [
      receiver,
      amountIn.toString(),
      dstChainId.toString(),
      JSON.stringify(srcSwap),
      JSON.stringify(dstSwap),
      maxBridgeSlippage.toString(),
      nonce.toString()
    ];
  }
}
