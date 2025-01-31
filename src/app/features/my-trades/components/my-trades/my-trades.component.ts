import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  Inject,
  OnInit
} from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { MyTradesService } from 'src/app/features/my-trades/services/my-trades.service';
import { ErrorsService } from 'src/app/core/errors/errors.service';
import { TableData } from '@shared/models/my-trades/table-trade';
import BigNumber from 'bignumber.js';
import {
  TableRowsData,
  TableRowTrade
} from '@features/my-trades/components/my-trades/models/table-row-trade';
import { defaultSort } from '@taiga-ui/addon-table';
import { CounterNotificationsService } from 'src/app/core/services/counter-notifications/counter-notifications.service';
import { TuiDestroyService, watch } from '@taiga-ui/cdk';
import { catchError, filter, first, mergeMap, takeUntil } from 'rxjs/operators';
import { WalletsModalService } from 'src/app/core/wallets/services/wallets-modal.service';
import { WINDOW } from '@ng-web-apis/common';
import { NoDataMyTradesError } from '@core/errors/models/my-trades/no-data-my-trades-error';
import { PageData } from '@features/my-trades/components/my-trades/models/page-data';

const DESKTOP_WIDTH = 1240;

@Component({
  selector: 'app-my-trades',
  templateUrl: './my-trades.component.html',
  styleUrls: ['./my-trades.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TuiDestroyService]
})
export class MyTradesComponent implements OnInit {
  private readonly tableDataSubject$ = new BehaviorSubject<TableRowsData>(undefined);

  public readonly tableData$ = this.tableDataSubject$.asObservable();

  public loading = true;

  public isDesktop: boolean;

  public walletAddress: string;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly myTradesService: MyTradesService,
    private readonly authService: AuthService,
    private readonly errorsService: ErrorsService,
    private readonly walletsModalService: WalletsModalService,
    private readonly counterNotificationsService: CounterNotificationsService,
    private readonly destroy$: TuiDestroyService,
    @Inject(WINDOW) private readonly window: Window
  ) {}

  ngOnInit(): void {
    this.initDataAndSubscriptions();
  }

  /**
   * Inits component data and subscriptions.
   */
  private initDataAndSubscriptions(): void {
    this.counterNotificationsService.resetCounter();
    this.isDesktop = this.window.innerWidth >= DESKTOP_WIDTH;

    this.myTradesService.tableData$
      .pipe(
        filter(trades => !!trades),
        catchError(() => {
          this.errorsService.catch(new NoDataMyTradesError());
          return of({
            totalCount: 0,
            trades: []
          });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(trades => {
        if (this.authService.user) {
          this.updateTableData(trades);
        }
      });

    this.authService
      .getCurrentUser()
      .pipe(
        watch(this.cdr),
        mergeMap(user => {
          this.walletAddress = user?.address || null;
          this.loading = true;
          this.cdr.detectChanges();

          if (this.walletAddress) {
            return this.myTradesService.updateTableTrades().pipe(first());
          }
          this.tableDataSubject$.next({
            totalCount: 0,
            rowTrades: []
          });
          this.loading = false;
          return of(undefined);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  private updateTableData(tableData: TableData): void {
    const tableRowsData = tableData.trades
      .map(
        trade =>
          ({
            Status: trade.status,
            FromTo: trade.fromToken?.blockchain + trade.toToken.blockchain,
            Provider: trade.provider,
            Sent: new BigNumber(trade.fromToken?.amount),
            Expected: new BigNumber(trade.toToken.amount),
            Date: trade.date,
            inProgress: false
          } as TableRowTrade)
      )
      .sort((a, b) => defaultSort(a.Date, b.Date) * -1);

    this.tableDataSubject$.next({
      totalCount: tableData.totalCount,
      rowTrades: tableRowsData
    });

    setTimeout(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  public refreshTable(): void {
    this.loading = true;
    this.myTradesService.updateTableTrades().pipe(first()).subscribe();
  }

  public showConnectWalletModal(): void {
    this.walletsModalService.open$();
  }

  public onPageChange(data: PageData): void {
    this.loading = true;
    this.myTradesService.updateTableTrades(data.page, data.pageSize).pipe(first()).subscribe();
  }

  @HostListener('window:resize')
  private onResize(): void {
    this.isDesktop = this.window.innerWidth >= DESKTOP_WIDTH;
  }
}
