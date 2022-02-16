import { Injectable } from '@angular/core';
import { CommonCurveService } from '@features/instant-trade/services/instant-trade-service/providers/common/curve/common-curve.service';
import { INSTANT_TRADES_PROVIDERS } from '@shared/models/instant-trade/instant-trade-providers';
import { BLOCKCHAIN_NAME } from '@shared/models/blockchain/blockchain-name';

@Injectable({
  providedIn: 'root'
})
export class CurveEthereumService extends CommonCurveService {
  public readonly providerType = INSTANT_TRADES_PROVIDERS.CURVE;

  constructor() {
    super(BLOCKCHAIN_NAME.ETHEREUM);
  }
}
