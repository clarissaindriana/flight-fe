import api from './api';
import type {
  Bill,
  BillStatus,
  BillQueryAll,
  BillQueryCustomer,
  BillQueryService,
  PayBillRequestPayload,
} from '@/interfaces/bill.interface';
import type { CommonResponseInterface } from '@/interfaces/common.response.interface';

export const billService = {
  /**
   * Get all bills (Superadmin)
   * Backend: GET /api/bill
   * Supports filters: customerId, serviceName, status
   */
  async getAllBills(
    query?: BillQueryAll,
  ): Promise<CommonResponseInterface<Bill[]>> {
    const params: Record<string, any> = {};

    if (query?.customerId) params.customerId = query.customerId;
    if (query?.serviceName) params.serviceName = query.serviceName;
    if (query?.status) params.status = query.status;

    const res = await api.get('/bill', { params });
    return res.data;
  },

  /**
   * Get bills for current customer (Customer role)
   * Backend: GET /api/bill/customer
   * Supports filters: status (UNPAID / PAID), sortBy, order
   * customerId is taken from JWT in backend.
   */
  async getCustomerBills(
    query?: BillQueryCustomer,
  ): Promise<CommonResponseInterface<Bill[]>> {
    const params: Record<string, any> = {};

    if (query?.status) params.status = query.status;
    if (query?.sortBy) params.sortBy = query.sortBy;
    if (query?.order) params.order = query.order;

    const res = await api.get('/bill/customer', { params });
    return res.data;
  },

  /**
   * Get bills for a specific service (service roles or Superadmin)
   * Backend: GET /api/bill/{serviceName}
   * Example: /api/bill/flight, /api/bill/tourpackage
   *
   * NOTE: serviceName here should match backend path variable (case-insensitive),
   * e.g. "flight", "accommodation", "vehiclerental", "insurance", "tourpackage".
   */
  async getServiceBills(
    serviceName: string,
    query?: Omit<BillQueryService, 'serviceName'>,
  ): Promise<CommonResponseInterface<Bill[]>> {
    const params: Record<string, any> = {};

    if (query?.customerId) params.customerId = query.customerId;
    if (query?.status) params.status = query.status;

    const safeServiceName = encodeURIComponent(serviceName);
    const res = await api.get(`/bill/${safeServiceName}`, { params });
    return res.data;
  },

  /**
   * Get detail for a single bill (All roles, with backend role restrictions)
   * Backend: GET /api/bill/detail/{billId}
   */
  async getBillDetail(
    billId: string,
  ): Promise<CommonResponseInterface<Bill>> {
    const res = await api.get(`/bill/detail/${encodeURIComponent(billId)}`);
    return res.data;
  },

  /**
   * Pay a bill (Customer)
   * Backend: POST /api/bill/{billId}/pay
   *
   * The backend:
   * - Validates the bill status is UNPAID.
   * - Validates customerId in JWT matches bill.customerId.
   * - Optionally validates customerId in body if provided.
   * - Deducts saldo via external /api/users/payment.
   */
  async payBill(
    billId: string,
    payload?: PayBillRequestPayload,
  ): Promise<CommonResponseInterface<Bill>> {
    const body: PayBillRequestPayload = payload ?? { billId };
    const res = await api.post(
      `/bill/${encodeURIComponent(billId)}/pay`,
      body,
    );
    return res.data;
  },
};

/**
 * Helper to map backend BillStatus to human readable label.
 */
export const formatBillStatus = (status: BillStatus): string => {
  if (status === 'UNPAID') return 'Unpaid';
  if (status === 'PAID') return 'Paid';
  return status;
};

/**
 * Helper to pick a badge style name based on bill status.
 * Can be used in components to choose classes or button variants.
 */
export const getBillStatusBadgeVariant = (
  status: BillStatus,
): 'danger' | 'success' | 'secondary' => {
  if (status === 'UNPAID') return 'danger';
  if (status === 'PAID') return 'success';
  return 'secondary';
};