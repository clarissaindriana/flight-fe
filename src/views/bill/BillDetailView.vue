<template>
  <div class="bill-detail-view">
    <!-- Pay modal -->
    <div v-if="showPayModal" class="modal-backdrop">
      <div class="modal">
        <h3>Konfirmasi Pembayaran</h3>
        <p v-if="bill">
          Anda akan membayar tagihan sebesar
          <strong>{{ formatAmount(bill.amount) }}</strong>
          untuk layanan
          <strong>{{ bill.serviceName }}</strong>.
        </p>
        <p v-if="storeError" class="modal-error">
          {{ storeError }}
        </p>
        <div class="modal-actions">
          <button
            type="button"
            class="btn btn-secondary"
            :disabled="loading"
            @click="closePayModal"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="loading"
            @click="confirmPay"
          >
            {{ loading ? 'Processing...' : 'Bayar Sekarang' }}
          </button>
        </div>
      </div>
    </div>

    <div class="detail-card">
      <header class="detail-header">
        <div>
          <h1>Detail Tagihan</h1>
          <p v-if="bill">
            ID Tagihan: <span class="mono">{{ bill.id }}</span>
          </p>
        </div>

        <div class="header-actions" v-if="bill">
          <span :class="['status-badge', statusClass(bill.status)]">
            {{ billStore.getBillStatusText(bill.status) }}
          </span>

          <button
            v-if="canPay"
            type="button"
            class="btn btn-primary"
            @click="openPayModal"
          >
            Bayar Sekarang
          </button>
        </div>
      </header>

      <div v-if="loading" class="state loading">
        <div class="spinner"></div>
        <p>Loading bill detail...</p>
      </div>

      <div v-else-if="error" class="state error">
        <p>{{ error }}</p>
      </div>

      <div v-else-if="!bill" class="state empty">
        <p>No Bill Found.</p>
      </div>

      <div v-else class="detail-grid">
        <!-- Left: Main info -->
        <section class="detail-section">
          <h2>Informasi Tagihan</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>ID Tagihan</label>
              <span class="mono">{{ bill.id }}</span>
            </div>
            <div class="info-item">
              <label>ID Pelanggan</label>
              <span class="mono">{{ bill.customerId }}</span>
            </div>
            <div class="info-item">
              <label>Layanan</label>
              <span>{{ bill.serviceName }}</span>
            </div>
            <div class="info-item">
              <label>ID Referensi Layanan</label>
              <span class="mono">{{ bill.serviceReferenceId }}</span>
            </div>
            <div class="info-item">
              <label>Deskripsi</label>
              <span>{{ bill.description || '—' }}</span>
            </div>
            <div class="info-item">
              <label>Jumlah</label>
              <span class="amount">{{ formatAmount(bill.amount) }}</span>
            </div>
          </div>
        </section>

        <!-- Right: Status & timeline -->
        <section class="detail-section">
          <h2>Status & Timeline</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Status</label>
              <span :class="['status-badge', statusClass(bill.status)]">
                {{ billStore.getBillStatusText(bill.status) }}
              </span>
            </div>
            <div class="info-item">
              <label>Tanggal Dibuat</label>
              <span>{{ formatDate(bill.createdAt) }}</span>
            </div>
            <div class="info-item">
              <label>Terakhir Diperbarui</label>
              <span>{{ formatDate(bill.updatedAt) }}</span>
            </div>
            <div class="info-item">
              <label>Batas Waktu</label>
              <span>{{ formatDate(dueDate) }}</span>
            </div>
            <div class="info-item" v-if="bill.status === 'PAID'">
              <label>Dibayar pada</label>
              <span>{{ formatDate(bill.paymentTimestamp) }}</span>
            </div>
          </div>

          <div v-if="storeSuccess" class="alert success">
            {{ storeSuccess }}
          </div>
          <div v-if="storeError" class="alert error">
            {{ storeError }}
          </div>
        </section>
      </div>

      <footer class="view-actions">
        <button type="button" class="btn btn-secondary" @click="goBack">
          Kembali ke Daftar Tagihan
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBillStore } from '@/stores/bill/bill';
import { useAuthStore } from '@/stores/auth/auth';
import type { Bill } from '@/interfaces/bill.interface';
import { getUserRole } from '@/lib/rbac';

const route = useRoute();
const router = useRouter();
const billStore = useBillStore();
const authStore = useAuthStore();

const billId = route.params.id as string;

const loading = computed(() => billStore.loading);
const error = computed(() => billStore.error);
const bill = computed<Bill | null>(() => billStore.currentBill);
const storeError = computed(() => billStore.error);
const storeSuccess = computed(() => billStore.successMessage);

const role = getUserRole();
const isCustomer = role === 'Customer';

const currentUserId = computed(() => authStore.currentUser?.id ?? null);

// Compute due date (createdAt + 7 days, FE-only)
const dueDate = computed<Date | null>(() => {
  if (!bill.value?.createdAt) return null;
  const base = new Date(bill.value.createdAt);
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + 7);
  return d;
});

const canPay = computed<boolean>(() => {
  if (!isCustomer) return false;
  if (!bill.value) return false;
  return bill.value.status === 'UNPAID';
});

const showPayModal = ref(false);

const openPayModal = () => {
  showPayModal.value = true;
  billStore.clearError();
  billStore.clearSuccess();
};

const closePayModal = () => {
  showPayModal.value = false;
};

const confirmPay = async () => {
  if (!bill.value) return;
  try {
    await billStore.payBill(bill.value.id, currentUserId.value ?? undefined);
    await billStore.fetchBillDetail(bill.value.id);
    showPayModal.value = false;
  } catch {
    // Error details already in storeError
  }
};

const goBack = () => {
  router.push('/bills');
};

const formatDate = (value: string | Date | null): string => {
  if (!value) return '—';
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    return d.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return typeof value === 'string' ? value : '—';
  }
};

const formatAmount = (value: any): string => {
  const num = Number(value ?? 0);
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return `Rp ${num.toLocaleString('id-ID')}`;
  }
};

const statusClass = (status: Bill['status']): string => {
  if (status === 'UNPAID') return 'status-unpaid';
  if (status === 'PAID') return 'status-paid';
  return 'status-unknown';
};

onMounted(async () => {
  billStore.clearError();
  billStore.clearSuccess();
  await billStore.fetchBillDetail(billId);
});
</script>

<style scoped>
.bill-detail-view {
  min-height: 100vh;
  background: var(--color-gray-50);
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
}

.detail-card {
  width: 100%;
  max-width: 960px;
  background: #fff;
  border-radius: var(--radius-2xl);
  border: 1px solid var(--color-gray-200);
  box-shadow: var(--shadow-md);
  padding: 1.75rem 2rem 2rem;
  position: relative;
}

/* Header */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-gray-200);
}

.detail-header h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--color-gray-900);
  letter-spacing: -0.02em;
}

.detail-header p {
  margin: 0.25rem 0 0;
  color: var(--color-gray-600);
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
}

/* Status badge */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.status-unpaid {
  background: var(--color-yellow-100);
  color: var(--color-yellow-800);
}
.status-paid {
  background: var(--color-green-100);
  color: var(--color-green-800);
}
.status-unknown {
  background: var(--color-gray-100);
  color: var(--color-gray-800);
}

/* Detail grid */
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1.1fr);
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.detail-section {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-gray-200);
  padding: 1.25rem 1.25rem 1.5rem;
}

.detail-section h2 {
  margin: 0 0 1.25rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-gray-800);
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.9rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.info-item label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  color: var(--color-gray-500);
}

.info-item span {
  font-size: 0.95rem;
  color: var(--color-gray-900);
  font-weight: 500;
}

.amount {
  font-weight: 700;
  color: #7A8450;
}

/* State blocks */
.state {
  margin-top: 2rem;
  text-align: center;
  color: var(--color-gray-600);
}

.state.loading .spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-gray-200);
  border-top-color: #F9CDD5;
  border-radius: 50%;
  margin: 0 auto 0.75rem;
  animation: spin 1s linear infinite;
}

.state.error {
  color: var(--color-red);
}

.state.empty {
  font-style: italic;
}

/* Alerts inside detail */
.alert {
  margin-top: 0.75rem;
  padding: 0.6rem 0.85rem;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 500;
}
.alert.success {
  background: rgba(16, 185, 129, 0.06);
  color: #047857;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.alert.error {
  background: rgba(239, 68, 68, 0.06);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

/* Footer actions */
.view-actions {
  margin-top: 1.75rem;
  display: flex;
  justify-content: center;
}

/* Buttons */
.btn {
  padding: 0.65rem 1.25rem;
  border-radius: var(--radius-md);
  border: none;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}
.btn-primary {
  background: #7A8450;
  color: #fff;
  box-shadow: 0 2px 8px rgba(122, 132, 80, 0.35);
}
.btn-primary:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(122, 132, 80, 0.45);
}
.btn-secondary {
  background: #ffffff;
  color: var(--color-gray-700);
  border: 1.5px solid var(--color-gray-200);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--color-gray-50);
  border-color: var(--color-gray-300);
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
}

.modal {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  padding: 1.75rem 1.5rem 1.5rem;
}

.modal h3 {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-gray-900);
}

.modal p {
  margin: 0.25rem 0 0.75rem;
  color: var(--color-gray-700);
  font-size: 0.95rem;
}

.modal-error {
  color: var(--color-red);
  margin-bottom: 0.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

/* Spinner animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .detail-card {
    padding: 1.25rem 1.25rem 1.5rem;
  }
  .detail-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
