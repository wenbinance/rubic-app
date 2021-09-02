import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { BLOCKCHAIN_NAME } from 'src/app/shared/models/blockchain/BLOCKCHAIN_NAME';
import { first, switchMap, tap } from 'rxjs/operators';
import { BehaviorSubject, forkJoin, from } from 'rxjs';
import ConnectionLink from '../types/ConnectionLink';
import { Web3Public } from './Web3Public';
import { PublicProviderService } from '../public-provider/public-provider.service';
import { BlockchainsInfo } from '../blockchain-info';
import { UseTestingModeService } from '../../use-testing-mode/use-testing-mode.service';

@Injectable({
  providedIn: 'root'
})
export class Web3PublicService {
  private readonly _nodesChecked$ = new BehaviorSubject<boolean>(false);

  private readonly connectionLinks: ConnectionLink[];

  constructor(
    publicProvider: PublicProviderService,
    private useTestingModeService: UseTestingModeService
  ) {
    this.connectionLinks = publicProvider.connectionLinks;
    this.connectionLinks.forEach(connection =>
      this.addWeb3(connection.rpcLink, connection.blockchainName)
    );

    this.checkAllRpcProviders();

    this.useTestingModeService.isTestingMode.subscribe(isTestingMode => {
      if (isTestingMode) {
        this.connectionLinks.forEach(connection => {
          if (!connection.blockchainName.includes('_TESTNET')) {
            const testingConnection = this.connectionLinks.find(
              c => c.blockchainName === `${connection.blockchainName}_TESTNET`
            );
            if (!testingConnection) {
              return;
            }

            this[connection.blockchainName] = new Web3Public(
              new Web3(testingConnection.rpcLink),
              BlockchainsInfo.getBlockchainByName(testingConnection.blockchainName),
              this.useTestingModeService
            );
          }
        });
      }
    });

    this.useTestingModeService.web3PublicSettings.rpcTimeout.subscribe(
      this.checkAllRpcProviders.bind(this)
    );
  }

  private checkAllRpcProviders(timeout?: number): void {
    const web3List = Object.values(BLOCKCHAIN_NAME)
      .map(key => this[key])
      .filter(i => i);

    const checkNode$ = (web3Public: Web3Public) =>
      web3Public.healthCheck(timeout).pipe(
        tap(isNodeWorks => {
          if (isNodeWorks === null) {
            return;
          }

          const blockchainName = web3Public.blockchain.name;
          const connector = this.connectionLinks.find(
            item => item.blockchainName === blockchainName
          );
          if (!isNodeWorks && connector?.additionalRpcLink) {
            this[web3Public.blockchain.name].setProvider(connector.additionalRpcLink);

            console.debug(
              `Broken ${web3Public.blockchain.label} node has been replaced with a spare.`
            );
          }
        })
      );

    forkJoin(web3List.map(checkNode$)).subscribe(() => this._nodesChecked$.next(true));
  }

  private addWeb3(rpcLink: string, blockchainName: BLOCKCHAIN_NAME) {
    const web3Public = new Web3Public(
      new Web3(rpcLink),
      BlockchainsInfo.getBlockchainByName(blockchainName),
      this.useTestingModeService
    );

    const nodesChecked$ = this._nodesChecked$.asObservable();

    this[blockchainName] = new Proxy(web3Public, {
      get(target: Web3Public, prop) {
        if (prop === 'healthCheck' || prop === 'setProvider') {
          return target[prop].bind(target);
        }

        if (typeof target[prop] === 'function') {
          return (...params: unknown[]) =>
            nodesChecked$
              .pipe(
                first(value => value),
                switchMap(() => from(target[prop].call(target, ...params)))
              )
              .toPromise();
        }

        return target[prop];
      }
    });
  }
}
