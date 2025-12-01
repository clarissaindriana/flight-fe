import { defineStore } from 'pinia';
import { ref } from 'vue';
import { billService, formatBillStatus } from '@/services/bill.service';
import type {
  Bill,
  BillQueryAll,
  BillQueryCustomer,
  BillQueryService,
} from '@/interfaces/bill.interface';

export const useBillStore = defineStore('bill', () => {
  const allBills = ref<Bill[]>([]);
  const customerBills = ref<Bill[]>([]);
  const serviceBills = ref<Bill[]>([]);
  const currentBill = ref<Bill | null>(null);

  const loading = ref(false);
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  // --- Fetchers ---

  const fetchAllBills = async (query?: BillQueryAll) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await billService.getAllBills(query);
      allBills.value = res.data ?? [];
    } catch (err: any) {
      error.value =
        err?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Failed to fetch bills');
      allBills.value = [];
    } finally {
      loading.value = false;
    }
  };

  const fetchCustomerBills = async (query?: BillQueryCustomer) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await billService.getCustomerBills(query);
      customerBills.value = res.data ?? [];
    } catch (err: any) {
      error.value =
        err?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Failed to fetch customer bills');
      customerBills.value = [];
    } finally {
      loading.value = false;
    }
  };

  const fetchServiceBills = async (query: BillQueryService) => {
    loading.value = true;
    error.value = null;
    try {
      const { serviceName, ...rest } = query;
      const res = await billService.getServiceBills(serviceName, rest);
      serviceBills.value = res.data ?? [];
    } catch (err: any) {
      error.value =
        err?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Failed to fetch service bills');
      serviceBills.value = [];
    } finally {
      loading.value = false;
    }
  };

  const fetchBillDetail = async (billId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await billService.getBillDetail(billId);
      currentBill.value = res.data;
      return res.data;
    } catch (err: any) {
      error.value =
        err?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Failed to fetch bill detail');
      currentBill.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  };

  // --- Actions ---

  const payBill = async (billId: string, customerId?: string) => {
    loading.value = true;
    error.value = null;
    successMessage.value = null;
    try {
      const res = await billService.payBill(billId, {
        billId,
        customerId,
      });

      const paid = res.data;
      currentBill.value = paid;

      // Update in-memory collections if present
      const updateInList = (list: Bill[]) => {
        const idx = list.findIndex((b) => b.id === paid.id);
        if (idx !== -1) list[idx] = paid;
      };
      updateInList(allBills.value);
      updateInList(customerBills.value);
      updateInList(serviceBills.value);

      successMessage.value = 'Pembayaran Berhasil!';
      
      // Automatically refresh related booking if this is a flight bill.
      // The backend callback will handle it, but we also refresh here proactively for UX.
      if (paid.serviceName && paid.serviceName.toLowerCase() === 'flight' && paid.serviceReferenceId) {
        try {
          const { useBookingStore } = await import('@/stores/booking/booking');
          const bookingStore = useBookingStore();
          await bookingStore.refreshBooking(paid.serviceReferenceId);
        } catch (e) {
          // Silently fail - this is just a UX improvement, not critical
          console.warn('Failed to refresh booking after payment:', e);
        }
      }
      
      // Return the paid bill data for caller to use
      return paid;
    } catch (err: any) {
      // Keep API validation messages
      error.value =
        err?.response?.data?.message ??
        (err instanceof Error ? err.message : 'Payment Failed. An unexpected error occurred. Please try again later.');
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // --- Helpers ---

  const getBillStatusText = (status: Bill['status']): string => {
    return formatBillStatus(status);
  };

  const clearError = () => {
    error.value = null;
  };

  const clearSuccess = () => {
    successMessage.value = null;
  };

  return {
    allBills,
    customerBills,
    serviceBills,
    currentBill,
    loading,
    error,
    successMessage,
    fetchAllBills,
    fetchCustomerBills,
    fetchServiceBills,
    fetchBillDetail,
    payBill,
    getBillStatusText,
    clearError,
    clearSuccess,
  };
});