import { AbiItem } from 'web3-utils';

const CURVE_REGISTRY_ABI = [
  {
    name: 'TokenExchange',
    inputs: [
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'receiver', type: 'address', indexed: true },
      { name: 'pool', type: 'address', indexed: true },
      { name: 'token_sold', type: 'address', indexed: false },
      { name: 'token_bought', type: 'address', indexed: false },
      { name: 'amount_sold', type: 'uint256', indexed: false },
      { name: 'amount_bought', type: 'uint256', indexed: false }
    ],
    anonymous: false,
    type: 'event'
  },
  {
    stateMutability: 'nonpayable',
    type: 'constructor',
    inputs: [
      { name: '_address_provider', type: 'address' },
      { name: '_calculator', type: 'address' }
    ],
    outputs: []
  },
  { stateMutability: 'payable', type: 'fallback' },
  {
    stateMutability: 'payable',
    type: 'function',
    name: 'exchange_with_best_rate',
    inputs: [
      { name: '_from', type: 'address' },
      { name: '_to', type: 'address' },
      { name: '_amount', type: 'uint256' },
      { name: '_expected', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    gas: 1034953685
  },
  {
    stateMutability: 'payable',
    type: 'function',
    name: 'exchange_with_best_rate',
    inputs: [
      { name: '_from', type: 'address' },
      { name: '_to', type: 'address' },
      { name: '_amount', type: 'uint256' },
      { name: '_expected', type: 'uint256' },
      { name: '_receiver', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    gas: 1034953685
  },
  {
    stateMutability: 'payable',
    type: 'function',
    name: 'exchange',
    inputs: [
      { name: '_pool', type: 'address' },
      { name: '_from', type: 'address' },
      { name: '_to', type: 'address' },
      { name: '_amount', type: 'uint256' },
      { name: '_expected', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    gas: 357925
  },
  {
    stateMutability: 'payable',
    type: 'function',
    name: 'exchange',
    inputs: [
      { name: '_pool', type: 'address' },
      { name: '_from', type: 'address' },
      { name: '_to', type: 'address' },
      { name: '_amount', type: 'uint256' },
      { name: '_expected', type: 'uint256' },
      { name: '_receiver', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    gas: 357925
  },
  {
    stateMutability: 'payable',
    type: 'function',
    name: 'exchange_multiple',
    inputs: [
      { name: '_route', type: 'address[9]' },
      { name: '_swap_params', type: 'uint256[3][4]' },
      { name: '_amount', type: 'uint256' },
      { name: '_expected', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    gas: 313921
  },
  {
    stateMutability: 'payable',
    type: 'function',
    name: 'exchange_multiple',
    inputs: [
      { name: '_route', type: 'address[9]' },
      { name: '_swap_params', type: 'uint256[3][4]' },
      { name: '_amount', type: 'uint256' },
      { name: '_expected', type: 'uint256' },
      { name: '_receiver', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    gas: 313921
  },
  {
    stateMutability: 'view',
    type: 'function',
    name: 'get_best_rate',
    inputs: [
      { name: '_from', type: 'address' },
      { name: '_to', type: 'address' },
      { name: '_amount', type: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'address' },
      { name: '', type: 'uint256' }
    ],
    gas: 3039568757
  },
  {
    stateMutability: 'view',
    type: 'function',
    name: 'get_best_rate',
    inputs: [
      { name: '_from', type: 'address' },
      { name: '_to', type: 'address' },
      { name: '_amount', type: 'uint256' },
      { name: '_exclude_pools', type: 'address[8]' }
    ],
    outputs: [
      { name: '', type: 'address' },
      { name: '', type: 'uint256' }
    ],
    gas: 3039568757
  },
  {
    stateMutability: 'view',
    type: 'function',
    name: 'get_exchange_amount',
    inputs: [
      { name: '_pool', type: 'address' },
      { name: '_from', type: 'address' },
      { name: '_to', type: 'address' },
      { name: '_amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    gas: 31035
  },
  {
    stateMutability: 'view',
    type: 'function',
    name: 'get_input_amount',
    inputs: [
      { name: '_pool', type: 'address' },
      { name: '_from', type: 'address' },
      { name: '_to', type: 'address' },
      { name: '_amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    gas: 35674
  },
  {
    stateMutability: 'view',
    type: 'function',
    name: 'get_exchange_amounts',
    inputs: [
      { name: '_pool', type: 'address' },
      { name: '_from', type: 'address' },
      { name: '_to', type: 'address' },
      { name: '_amounts', type: 'uint256[100]' }
    ],
    outputs: [{ name: '', type: 'uint256[100]' }],
    gas: 39461
  },
  {
    stateMutability: 'view',
    type: 'function',
    name: 'get_calculator',
    inputs: [{ name: '_pool', type: 'address' }],
    outputs: [{ name: '', type: 'address' }],
    gas: 5254
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    name: 'update_registry_address',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
    gas: 115473
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    name: 'set_calculator',
    inputs: [
      { name: '_pool', type: 'address' },
      { name: '_calculator', type: 'address' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    gas: 40757
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    name: 'set_default_calculator',
    inputs: [{ name: '_calculator', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    gas: 40515
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    name: 'claim_balance',
    inputs: [{ name: '_token', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    gas: 44159
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    name: 'set_killed',
    inputs: [{ name: '_is_killed', type: 'bool' }],
    outputs: [{ name: '', type: 'bool' }],
    gas: 40575
  },
  {
    stateMutability: 'view',
    type: 'function',
    name: 'registry',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    gas: 3006
  },
  {
    stateMutability: 'view',
    type: 'function',
    name: 'factory_registry',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    gas: 3036
  },
  {
    stateMutability: 'view',
    type: 'function',
    name: 'crypto_registry',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    gas: 3066
  },
  {
    stateMutability: 'view',
    type: 'function',
    name: 'default_calculator',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    gas: 3096
  },
  {
    stateMutability: 'view',
    type: 'function',
    name: 'is_killed',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
    gas: 3126
  }
] as AbiItem[];

export default CURVE_REGISTRY_ABI;
