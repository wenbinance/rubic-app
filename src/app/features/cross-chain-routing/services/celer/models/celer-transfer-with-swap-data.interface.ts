import { CelerSwapInfo } from './celer-swap-info.interface';

export interface CelerTransferWithSwapData {
  receiver: string;
  amountIn: number;
  dstChainId: number;
  srcSwap: CelerSwapInfo;
  dstSwap: CelerSwapInfo;
  maxBridgeSlippage: number;
  nonce: number;
}
