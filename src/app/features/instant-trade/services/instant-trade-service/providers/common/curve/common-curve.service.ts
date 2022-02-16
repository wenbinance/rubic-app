import { inject, Injectable } from '@angular/core';
import {
  ItOptions,
  ItProvider
} from '@features/instant-trade/services/instant-trade-service/models/it-provider';
import BigNumber from 'bignumber.js';
import InstantTrade from '@features/instant-trade/models/instant-trade';
import { from, Observable, of } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { INSTANT_TRADES_PROVIDERS } from '@shared/models/instant-trade/instant-trade-providers';
import InstantTradeToken from '@features/instant-trade/models/instant-trade-token';
import { BLOCKCHAIN_NAME } from '@shared/models/blockchain/blockchain-name';
import { AuthService } from '@core/services/auth/auth.service';
import { WalletConnectorService } from '@core/services/blockchain/wallets/wallet-connector-service/wallet-connector.service';
import { EthLikeWeb3PrivateService } from '@core/services/blockchain/blockchain-adapters/eth-like/web3-private/eth-like-web3-private.service';
import { AbiItem } from 'web3-utils';
import { TransactionReceipt } from 'web3-eth';
import {
  ItSettingsForm,
  SettingsService
} from '@features/swaps/services/settings-service/settings.service';
import { TradeContractData } from '@features/instant-trade/services/instant-trade-service/providers/common/uniswap-v2/common-service/models/TradeContractData';
import { TransactionOptions } from '@shared/models/blockchain/transaction-options';
import { TokenWithFeeError } from '@core/errors/models/common/token-with-fee-error';
import { EthLikeWeb3Public } from '@core/services/blockchain/blockchain-adapters/eth-like/web3-public/eth-like-web3-public';
import { BlockchainsInfo } from '@core/services/blockchain/blockchain-info';
import { PublicBlockchainAdapterService } from '@core/services/blockchain/blockchain-adapters/public-blockchain-adapter.service';
import CURVE_PROVIDER_ABI from '@features/instant-trade/services/instant-trade-service/providers/common/curve/constants/provider-abi';
import CURVE_REGISTRY_ABI from '@features/instant-trade/services/instant-trade-service/providers/common/curve/constants/registry_abi';
import { Web3Pure } from '@core/services/blockchain/blockchain-adapters/common/web3-pure';
import { subtractPercent } from '@shared/utils/utils';
import { GasService } from '@core/services/gas-service/gas.service';
import { TokensService } from '@core/services/tokens/tokens.service';

@Injectable({
  providedIn: 'root'
})
export abstract class CommonCurveService implements ItProvider {
  protected blockchain: BLOCKCHAIN_NAME;

  protected providerContractAbi: AbiItem[];

  protected registryContractAbi: AbiItem[];

  protected blockchainAdapter: EthLikeWeb3Public;

  private walletAddress: string;

  private readonly providerAddress: string = '0x0000000022D53366457F9d5E68Ec105046FC4383';

  private registryAddress: string;

  public abstract readonly providerType: INSTANT_TRADES_PROVIDERS;

  private bestPoolAddress: string;

  private settings: ItSettingsForm;

  //Injected services.

  private readonly publicBlockchainAdapterService = inject(PublicBlockchainAdapterService);

  private readonly authService = inject(AuthService);

  private readonly walletConnectorService = inject(WalletConnectorService);

  private readonly web3PrivateService = inject(EthLikeWeb3PrivateService);

  private readonly settingsService = inject(SettingsService);

  private readonly tokensService = inject(TokensService);

  private readonly gasService = inject(GasService);

  protected constructor(blockchain: BLOCKCHAIN_NAME) {
    this.blockchain = blockchain;
    this.providerContractAbi = CURVE_PROVIDER_ABI;
    this.registryContractAbi = CURVE_REGISTRY_ABI;

    this.authService.getCurrentUser().subscribe(user => {
      this.walletAddress = user?.address;
    });

    this.settingsService.instantTradeValueChanges
      .pipe(startWith(this.settingsService.instantTradeValue))
      .subscribe(settingsForm => {
        this.settings = {
          ...settingsForm,
          slippageTolerance: settingsForm.slippageTolerance / 100
        };
      });

    BlockchainsInfo.checkIsEthLike(this.blockchain);
    this.blockchainAdapter = this.publicBlockchainAdapterService[
      this.blockchain
    ] as EthLikeWeb3Public;

    from(
      this.blockchainAdapter.callContractMethod(
        this.providerAddress,
        CURVE_PROVIDER_ABI,
        'get_address',
        {
          methodArguments: [2]
        }
      )
    ).subscribe(address => {
      this.registryAddress = address;
    });
  }

  public async createTrade(trade: InstantTrade, options: ItOptions): Promise<TransactionReceipt> {
    this.walletConnectorService.checkSettings(trade.blockchain);
    await this.blockchainAdapter.checkBalance(
      trade.from.token,
      trade.from.amount,
      this.walletAddress
    );
    const tradeContractData: TradeContractData = {
      contractAddress: this.registryAddress,
      contractAbi: this.registryContractAbi,
      methodName: 'exchange_with_best_rate',
      methodArguments: [
        trade.from.token.address,
        trade.to.token.address,
        Web3Pure.toWei(trade.from.amount, trade.from.token.decimals),
        Web3Pure.toWei(
          subtractPercent(trade.to.amount, this.settings.slippageTolerance),
          trade.to.token.decimals
        )
      ]
    };

    // this.blockchainAdapter
    //   .getEstimatedGas(
    //     tradeContractData.contractAbi,
    //     tradeContractData.contractAddress,
    //     tradeContractData.methodName,
    //     tradeContractData.methodArguments,
    //     this.walletAddress
    //   )
    //   .then(gas => console.log(gas.toFixed()));

    await this.tryExecuteTradeAndGetMethodName(tradeContractData);

    return this.web3PrivateService.executeContractMethod(
      this.registryAddress,
      tradeContractData.contractAbi,
      tradeContractData.methodName,
      tradeContractData.methodArguments,
      {
        onTransactionHash: options.onConfirm
      }
    );
  }

  public async calculateTrade(
    fromToken: InstantTradeToken,
    fromAmount: BigNumber,
    toToken: InstantTradeToken,
    shouldCalculateGas: boolean
  ): Promise<InstantTrade> {
    const { 0: poolAddress, 1: output } = await this.blockchainAdapter.callContractMethod<{
      0: string;
      1: string;
    }>(this.registryAddress, CURVE_REGISTRY_ABI, 'get_best_rate', {
      methodArguments: [
        fromToken.address,
        toToken.address,
        Web3Pure.toWei(fromAmount, fromToken.decimals)
      ]
    });

    this.bestPoolAddress = poolAddress;

    const instantTrade: InstantTrade = {
      blockchain: this.blockchain,
      from: {
        token: fromToken,
        amount: fromAmount
      },
      to: {
        token: toToken,
        amount: Web3Pure.fromWei(output, toToken.decimals)
      }
    };

    return instantTrade;

    if (!shouldCalculateGas) {
      return instantTrade;
    }

    const gasPriceInEth = await this.gasService.getGasPriceInEthUnits(this.blockchain);
    const nativeCoinPrice = await this.tokensService.getNativeCoinPriceInUsd(this.blockchain);
    const gasPriceInUsd = gasPriceInEth.multipliedBy(nativeCoinPrice);
    const estimatedGas = '120000';
    const gasFeeInEth = gasPriceInEth.multipliedBy(estimatedGas);
    const gasFeeInUsd = gasPriceInUsd.multipliedBy(estimatedGas);

    return {
      ...instantTrade,
      gasLimit: estimatedGas,
      gasPrice: Web3Pure.toWei(gasPriceInEth),
      gasFeeInUsd,
      gasFeeInEth
    };
  }

  public getAllowance(tokenAddress: string): Observable<BigNumber> {
    if (this.blockchainAdapter.isNativeAddress(tokenAddress)) {
      return of(new BigNumber(Infinity));
    }
    return from(
      this.blockchainAdapter.getAllowance({
        tokenAddress,
        ownerAddress: this.walletAddress,
        spenderAddress: this.registryAddress
      })
    );
  }

  public async approve(
    tokenAddress: string,
    options: {
      onTransactionHash?: (hash: string) => void;
    }
  ): Promise<void> {
    this.walletConnectorService.checkSettings(this.blockchain);
    await this.web3PrivateService.approveTokens(
      tokenAddress,
      this.registryAddress,
      'infinity',
      options
    );
  }

  /**
   * Makes test calls on uniswap contract and returns one of swap functions for tokens with or without fee.
   * @param tradeData Trade data for tokens without fee.
   * @param tradeDataSupportingFee Trade data for tokens with fee.
   */
  private async tryExecuteTradeAndGetMethodName(
    tradeData: TradeContractData
  ): Promise<string | never> {
    const tryExecute = async (methodData: {
      methodName: string;
      methodArguments: unknown[];
      options?: TransactionOptions;
    }): Promise<boolean> => {
      try {
        await this.blockchainAdapter.tryExecuteContractMethod(
          this.registryAddress,
          this.registryContractAbi,
          methodData.methodName,
          methodData.methodArguments,
          this.walletAddress,
          methodData.options
        );
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    };

    const isTradeSuccessful = await tryExecute(tradeData);

    if (isTradeSuccessful) {
      return tradeData.methodName;
    }
    throw new TokenWithFeeError();
  }
}
