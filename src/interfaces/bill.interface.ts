export type BillStatus = 'UNPAID' | 'PAID';

export interface Bill {
  id: string;
  customerId: string;
  serviceName: string;
  serviceReferenceId: string;
  description: string;
  amount: number;
  status: BillStatus;
  createdAt: string;
  updatedAt: string | null;
  paymentTimestamp: string | null;
}

// Generic list response shape from backend BaseResponseDTO
export interface BillListResponse {
  status: number;
  message: string;
  data: Bill[];
  timestamp: string;
}

export interface BillDetailResponse {
  status: number;
  message: string;
  data: Bill;
  timestamp: string;
}

export interface BillQueryAll {
  customerId?: string;
  serviceName?: string;
  status?: BillStatus | '';
}

export interface BillQueryCustomer {
  status?: BillStatus | '';
  sortBy?: 'createdAt' | 'serviceName';
  order?: 'asc' | 'desc';
}

export interface BillQueryService {
  serviceName: string;
  customerId?: string;
  status?: BillStatus | '';
}

export interface PayBillRequestPayload {
  billId: string;
  // Optional customerId; backend will validate against JWT either way
  customerId?: string;
}

export interface PayBillResponse {
  status: number;
  message: string;
  data: Bill;
  timestamp: string;
}