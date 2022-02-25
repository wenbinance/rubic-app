import { CelerSwapInfo } from './celer-swap-info.interface';

export interface CelerSwapRequest extends CelerSwapInfo {
  receiver: string;
  nonce: number;
  nativeOut: boolean;
}
