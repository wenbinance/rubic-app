import BigNumber from 'bignumber.js';

export interface TokenLp {
  BRBCAmount: string;
  USDCAmount: string;
  deadline: string;
  isStaked: boolean;
  lastRewardGrowth: string;
  tokenId: string;
  startTime: string;
}

export interface TokenLpParsed {
  BRBCAmount: BigNumber;
  USDCAmount: BigNumber;
  collectedRewards: BigNumber;
  rewardsToCollect: BigNumber;
  deadline: string;
  isStaked: boolean;
  lastRewardGrowth: string;
  tokenId: string;
  start: Date;
  period: number;
}
