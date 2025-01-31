import { Injectable } from '@angular/core';
import BigNumber from 'bignumber.js';
import { TransactionReceipt } from 'web3-eth';
import { BehaviorSubject, Observable, of } from 'rxjs';
import {
  ItOptions,
  ItProvider
} from '@features/instant-trade/services/instant-trade-service/models/it-provider';
import { EthLikeWeb3Public } from 'src/app/core/services/blockchain/blockchain-adapters/eth-like/web3-public/eth-like-web3-public';
import { WalletConnectorService } from 'src/app/core/services/blockchain/wallets/wallet-connector-service/wallet-connector.service';
import { PublicBlockchainAdapterService } from '@core/services/blockchain/blockchain-adapters/public-blockchain-adapter.service';
import { EthLikeWeb3PrivateService } from '@core/services/blockchain/blockchain-adapters/eth-like/web3-private/eth-like-web3-private.service';
import { BLOCKCHAIN_NAME, BlockchainName } from '@shared/models/blockchain/blockchain-name';
import {
  ItSettingsForm,
  SettingsService
} from 'src/app/features/swaps/services/settings-service/settings.service';
import { SwapFormService } from 'src/app/features/swaps/services/swaps-form-service/swap-form.service';
import { ZrxApiResponse } from 'src/app/features/instant-trade/services/instant-trade-service/models/zrx/zrx-types';
import { HttpService } from 'src/app/core/services/http/http.service';
import InstantTradeToken from '@features/instant-trade/models/instant-trade-token';
import InstantTrade from '@features/instant-trade/models/instant-trade';
import { TokensService } from 'src/app/core/services/tokens/tokens.service';
import { ZrxCalculateTradeParams } from '@features/instant-trade/services/instant-trade-service/providers/common/zrx/models/zrx-calculate-trade-params';
import { ZRX_API_ADDRESS } from '@features/instant-trade/services/instant-trade-service/providers/common/zrx/constants/zrx-api-addresses';
import { ZRX_NATIVE_TOKEN } from '@features/instant-trade/services/instant-trade-service/providers/common/zrx/constants/zrx-native-token';
import {
  SUPPORTED_ZRX_BLOCKCHAINS,
  SupportedZrxBlockchain
} from '@features/instant-trade/services/instant-trade-service/providers/common/zrx/constants/supported-zrx-blockchain';
import { filter, first, mergeMap, startWith } from 'rxjs/operators';
import { TransactionOptions } from 'src/app/shared/models/blockchain/transaction-options';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { ENVIRONMENT } from 'src/environments/environment';
import { Web3Pure } from '@core/services/blockchain/blockchain-adapters/common/web3-pure';
import { INSTANT_TRADES_PROVIDERS } from '@shared/models/instant-trade/instant-trade-providers';

const AFFILIATE_ADDRESS = ENVIRONMENT.zrxAffiliateAddress;

@Injectable({
  providedIn: 'root'
})
export class ZrxService implements ItProvider {
  public static isSupportedBlockchain(
    blockchain: BlockchainName
  ): blockchain is SupportedZrxBlockchain {
    return SUPPORTED_ZRX_BLOCKCHAINS.some(
      supportedBlockchain => supportedBlockchain === blockchain
    );
  }

  public readonly providerType = INSTANT_TRADES_PROVIDERS.ZRX;

  public readonly contractAddress = '0xdef1c0ded9bec7f1a1670819833240f027b25eff';

  private readonly gasMargin: number;

  private blockchainAdapter: EthLikeWeb3Public;

  private settings: ItSettingsForm;

  private currentTradeData: ZrxApiResponse;

  private tradeDataIsUpdated$: BehaviorSubject<boolean>;

  protected blockchain: SupportedZrxBlockchain;

  private apiAddress: string;

  private walletAddress: string;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly publicBlockchainAdapterService: PublicBlockchainAdapterService,
    private readonly web3PrivateService: EthLikeWeb3PrivateService,
    private readonly walletConnectorService: WalletConnectorService,
    private readonly swapFormService: SwapFormService,
    private readonly httpService: HttpService,
    private readonly tokensService: TokensService,
    private readonly authService: AuthService
  ) {
    this.gasMargin = 1.4;
    this.tradeDataIsUpdated$ = new BehaviorSubject(false);

    this.swapFormService.input.controls.fromBlockchain.valueChanges.subscribe(() =>
      this.setZrxParams()
    );

    this.settingsService.instantTradeValueChanges
      .pipe(startWith(this.settingsService.instantTradeValue))
      .subscribe(formValue => {
        this.settings = {
          ...formValue,
          slippageTolerance: formValue.slippageTolerance / 100
        };
      });

    this.authService.getCurrentUser().subscribe(user => {
      this.walletAddress = user?.address;
    });
  }

  /**
   * Updates zrx data, which depends on selected blockchain.
   */
  private setZrxParams(): void {
    const { fromBlockchain } = this.swapFormService.inputValue;

    if (ZrxService.isSupportedBlockchain(fromBlockchain)) {
      this.blockchain = fromBlockchain;
      this.blockchainAdapter = this.publicBlockchainAdapterService[this.blockchain];
      this.apiAddress = ZRX_API_ADDRESS[this.blockchain];
    }
  }

  public getAllowance(tokenAddress: string): Observable<BigNumber> {
    if (this.blockchainAdapter.isNativeAddress(tokenAddress)) {
      return of(new BigNumber(Infinity));
    }
    return this.tradeDataIsUpdated$.pipe(
      filter(value => !!value),
      first(),
      mergeMap(() => {
        this.tradeDataIsUpdated$.next(false);
        return this.blockchainAdapter.getAllowance({
          tokenAddress,
          ownerAddress: this.walletAddress,
          spenderAddress: this.currentTradeData?.allowanceTarget
        });
      })
    );
  }

  public async approve(tokenAddress: string, options: TransactionOptions): Promise<void> {
    this.walletConnectorService.checkSettings(this.blockchain);
    await this.web3PrivateService.approveTokens(
      tokenAddress,
      this.currentTradeData.allowanceTarget,
      'infinity',
      options
    );
  }

  public async calculateTrade(
    fromToken: InstantTradeToken,
    fromAmount: BigNumber,
    toToken: InstantTradeToken,
    shouldCalculateGas: boolean
  ): Promise<InstantTrade> {
    const fromTokenClone = { ...fromToken };
    const toTokenClone = { ...toToken };

    if (this.blockchainAdapter.isNativeAddress(fromToken.address)) {
      fromTokenClone.address = ZRX_NATIVE_TOKEN;
    }
    if (this.blockchainAdapter.isNativeAddress(toToken.address)) {
      toTokenClone.address = ZRX_NATIVE_TOKEN;
    }

    const params: ZrxCalculateTradeParams = {
      sellToken: fromTokenClone.address,
      buyToken: toTokenClone.address,
      sellAmount: Web3Pure.toWei(fromAmount, fromToken.decimals),
      slippagePercentage: this.settings.slippageTolerance.toString()
    };
    if (AFFILIATE_ADDRESS) {
      params.affiliateAddress = AFFILIATE_ADDRESS;
    }
    this.currentTradeData = await this.fetchTrade(params);
    this.tradeDataIsUpdated$.next(true);

    const trade: InstantTrade = {
      blockchain: BLOCKCHAIN_NAME.ETHEREUM,
      from: {
        token: fromToken,
        amount: Web3Pure.fromWei(this.currentTradeData.sellAmount, fromToken.decimals)
      },
      to: {
        token: toToken,
        amount: Web3Pure.fromWei(this.currentTradeData.buyAmount, toToken.decimals)
      }
    };
    if (!shouldCalculateGas) {
      return trade;
    }

    const estimatedGas = Web3Pure.calculateGasMargin(this.currentTradeData.gas, this.gasMargin);
    const gasPriceInEth = Web3Pure.fromWei(this.currentTradeData.gasPrice);
    const nativeCoinPrice = await this.tokensService.getNativeCoinPriceInUsd(this.blockchain);
    const gasPriceInUsd = gasPriceInEth.multipliedBy(nativeCoinPrice);
    const gasFeeInEth = gasPriceInEth.multipliedBy(estimatedGas);
    const gasFeeInUsd = gasPriceInUsd.multipliedBy(estimatedGas);

    return {
      ...trade,
      gasLimit: estimatedGas,
      gasPrice: this.currentTradeData.gasPrice,
      gasFeeInEth,
      gasFeeInUsd
    };
  }

  public async createTrade(
    trade: InstantTrade,
    options: ItOptions = {}
  ): Promise<TransactionReceipt> {
    this.walletConnectorService.checkSettings(trade.blockchain);

    const amount = Web3Pure.fromWei(trade.from.amount, trade.from.token.decimals);
    await this.blockchainAdapter.checkBalance(trade.from.token, amount, this.walletAddress);

    return this.web3PrivateService.trySendTransaction(
      this.currentTradeData.to,
      this.currentTradeData.value,
      {
        data: this.currentTradeData.data,
        gas: trade.gasLimit,
        gasPrice: this.currentTradeData.gasPrice,
        inWei: true,
        onTransactionHash: options.onConfirm
      }
    );
  }

  /**
   * Fetches zrx data from their api.
   * @param params Zrx params.
   */
  private fetchTrade(params: ZrxCalculateTradeParams): Promise<ZrxApiResponse> {
    return this.httpService
      .get<ZrxApiResponse>('swap/v1/quote', params, this.apiAddress)
      .toPromise();
  }
}
