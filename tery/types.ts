export interface Transaction {
  id: string;
  date: string;
  recipient: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  flag: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  bank: string;
  accountNumber: string;
  flag: string;
}

export interface User {
  name: string;
  email: string;
  verified: boolean;
  totalSent: number;
  transactionsCount: number;
  avatar: string;
}

export type ViewState = 'welcome' | 'send' | 'beneficiaries' | 'history' | 'profile' | 'admin';