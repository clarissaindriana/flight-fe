<template>
  <div class="bill-list-view">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-content">
        <h1>Billing Center</h1>
        <p v-if="isSuperadmin">
          Review and manage all customer bills across services with powerful filters.
        </p>
        <p v-else-if="isCustomer">
          View and manage your unpaid and paid bills in one place.
        </p>
        <p v-else-if="isServiceRole">
          Monitor bills generated for your service customers.
        </p>
        <p v-else>
          View billing information according to your role.
        </p>
      </div>
    </section>

    <!-- Superadmin: Get All Bill -->
    <section v-if="isSuperadmin" class="filters-card">
      <div class="section-title-row">
        <h2>All Bills (Superadmin)</h2>
      </div>

      <div class="filters-grid">
        <div class="field">
          <label class="field-label">Customer ID</label>
          <input
            v-model="adminCustomerId"
            class="text-input"
            type="text"
            placeholder="Search by customerId..."
          />
        </div>

        <div class="field">
          <label class="field-label">Service Name</label>
          <select v-model="adminServiceName" class="select-input">
            <option value="">All Services</option>
            <option v-for="opt in serviceOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="field">
          <label class="field-label">Status</label>
          <select v-model="adminStatus" class="select-input">
            <option value="">All</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      <div class="filter-actions">
        <button class="btn btn-secondary" type="button" @click="resetAdminFilters">⟳ Reset</button>
        <button class="btn btn-primary" type="button" @click="reloadAdmin">Apply Filters</button>
      </div>

      <div v-if="storeError" class="alert error">{{ storeError }}</div>

      <div class="table-wrapper" v-if="adminBills.length">
        <table class="bill-table">
          <thead>
            <tr>
              <th>ID Tagihan</th>
              <th>ID Pelanggan</th>
              <th>Layanan</th>
              <th>Jumlah</th>
              <th>Status</th>
              <th>Tanggal Dibuat</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in adminBills" :key="b.id">
              <td>{{ b.id }}</td>
              <td>{{ b.customerId }}</td>
              <td>{{ b.serviceName }}</td>
              <td>{{ formatAmount(b.amount) }}</td>
              <td>
                <span :class="['status-badge', statusClass(b.status)]">
                  {{ billStore.getBillStatusText(b.status) }}
                </span>
              </td>
              <td>{{ formatDate(b.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="!loading" class="empty-state">
        No bills found for current filters.
      </div>
    </section>

    <!-- Customer: My Bills -->
    <section v-if="isCustomer" class="filters-card">
      <div class="section-title-row">
        <h2>My Bills</h2>
      </div>

      <div class="filters-grid">
        <div class="field">
          <label class="field-label">Status Pembayaran</label>
          <select v-model="custStatus" class="select-input">
            <option value="">Semua</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
          </select>
        </div>

        <div class="field">
          <label class="field-label">Urutkan Berdasarkan</label>
          <select v-model="custSortBy" class="select-input">
            <option value="createdAt">Tanggal Dibuat</option>
            <option value="serviceName">Nama Layanan</option>
            <option value="dueDate">Batas Waktu</option>
          </select>
        </div>

        <div class="field">
          <label class="field-label">Urutan</label>
          <select v-model="custOrder" class="select-input">
            <option value="asc">Naik (ASC)</option>
            <option value="desc">Turun (DESC)</option>
          </select>
        </div>
      </div>

      <div class="filter-actions">
        <button class="btn btn-secondary" type="button" @click="resetCustomerFilters">⟳ Reset</button>
        <button class="btn btn-primary" type="button" @click="reloadCustomer">Apply Filters</button>
      </div>

      <div v-if="storeError" class="alert error">{{ storeError }}</div>
      <div v-if="storeSuccess" class="alert success">{{ storeSuccess }}</div>

      <div class="table-wrapper" v-if="customerRows.length">
        <table class="bill-table">
          <thead>
            <tr>
              <th>ID Tagihan</th>
              <th>Deskripsi</th>
              <th>Layanan</th>
              <th>Batas Waktu</th>
              <th>Jumlah</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in customerRows" :key="row.bill.id">
              <td>{{ row.bill.id }}</td>
              <td>{{ row.bill.description }}</td>
              <td>{{ row.bill.serviceName }}</td>
              <td>{{ formatDate(row.dueDate) }}</td>
              <td>{{ formatAmount(row.bill.amount) }}</td>
              <td>
                <span :class="['status-badge', statusClass(row.bill.status)]">
                  {{ billStore.getBillStatusText(row.bill.status) }}
                </span>
              </td>
              <td>
                <button
                  class="btn btn-secondary btn-sm"
                  type="button"
                  @click="goDetail(row.bill.id)"
                >
                  Lihat Detail
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="!loading" class="empty-state">
        Tidak ada tagihan untuk akun Anda.
      </div>
    </section>

    <!-- Service Bills (Service roles + Superadmin) -->
    <section v-if="isServiceRole || isSuperadmin" class="filters-card">
      <div class="section-title-row">
        <h2>Service Bills</h2>
      </div>

      <div class="filters-grid">
        <div class="field">
          <label class="field-label">Customer ID</label>
          <input
            v-model="serviceCustomerId"
            class="text-input"
            type="text"
            placeholder="Filter by customerId..."
          />
        </div>

        <div class="field">
          <label class="field-label">Status</label>
          <select v-model="serviceStatus" class="select-input">
            <option value="">All</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      <div class="filter-actions">
        <button class="btn btn-secondary" type="button" @click="resetServiceFilters">⟳ Reset</button>
        <button class="btn btn-primary" type="button" @click="reloadService">Apply Filters</button>
      </div>

      <div v-if="storeError" class="alert error">{{ storeError }}</div>

      <div class="table-wrapper" v-if="serviceBills.length">
        <table class="bill-table">
          <thead>
            <tr>
              <th>ID Tagihan</th>
              <th>ID Pelanggan</th>
              <th>Layanan</th>
              <th>Jumlah</th>
              <th>Status</th>
              <th>Tanggal Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in serviceBills" :key="b.id">
              <td>{{ b.id }}</td>
              <td>{{ b.customerId }}</td>
              <td>{{ b.serviceName }}</td>
              <td>{{ formatAmount(b.amount) }}</td>
              <td>
                <span :class="['status-badge', statusClass(b.status)]">
                  {{ billStore.getBillStatusText(b.status) }}
                </span>
              </td>
              <td>{{ formatDate(b.createdAt) }}</td>
              <td>
                <button
                  class="btn btn-secondary btn-sm"
                  type="button"
                  @click="goDetail(b.id)"
                >
                  Lihat Detail
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="!loading" class="empty-state">
        No service bills found for current filters.
      </div>
    </section>

    <!-- Global loading state -->
    <div v-if="loading" class="global-loading">
      <div class="spinner"></div>
      <p>Loading bills...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useBillStore } from '@/stores/bill/bill';
import { getUserRole } from '@/lib/rbac';
import type { Bill } from '@/interfaces/bill.interface';

const router = useRouter();
const billStore = useBillStore();

// Role flags based on current user
const role = getUserRole();
const isCustomer = role === 'Customer';
const isSuperadmin = role === 'Superadmin';
const isServiceFlight = role === 'Flight Airline';

// Any non-customer, non-superadmin role that is a "service role"
// For now we only explicitly know Flight Airline from FE type,
// but this also makes the logic clearer.
const isServiceRole = isServiceFlight;

// Store bindings
const loading = computed(() => billStore.loading);
const storeError = computed(() => billStore.error);
const storeSuccess = computed(() => billStore.successMessage);

const adminBills = computed(() => billStore.allBills);
const customerBills = computed(() => billStore.customerBills);
const serviceBills = computed(() => billStore.serviceBills);

// --- Superadmin filters ---
const adminCustomerId = ref('');
const adminServiceName = ref('');
const adminStatus = ref('');

// --- Customer filters ---
const custStatus = ref('');
const custSortBy = ref<'createdAt' | 'serviceName' | 'dueDate'>('createdAt');
const custOrder = ref<'asc' | 'desc'>('asc');

// --- Service filters ---
const serviceCustomerId = ref('');
const serviceStatus = ref('');

// Service options for Superadmin
const serviceOptions = [
  { value: 'Flight', label: 'Flight' },
  { value: 'Accommodation', label: 'Accommodation' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'VehicleRental', label: 'Vehicle Rental' },
  { value: 'TourPackage', label: 'Tour Package' },
];

/**
 * Map current FE role to backend serviceName for /api/bill/{serviceName}.
 * Backend expects exact names like "Flight", "Accommodation", etc. which
 * must match the Bill.serviceName stored in the DB.
 *
 * Currently FE only has explicit role "Flight Airline". When FE gains
 * other roles (Accommodation Owner, Rental Vendor, Insurance Provider,
 * Tour Package Vendor), this mapping can be extended accordingly.
 */
const serviceServiceName = computed<string | null>(() => {
  if (isServiceFlight) return 'Flight';
  // Future roles (when FE Role union is extended):
  // if (role === 'Accommodation Owner') return 'Accommodation';
  // if (role === 'Rental Vendor') return 'VehicleRental';
  // if (role === 'Insurance Provider') return 'Insurance';
  // if (role === 'Tour Package Vendor') return 'TourPackage';
  return null;
});

// Utility: compute due date as createdAt + 7 days (FE only)
const computeDueDate = (bill: Bill): Date => {
  const base = bill.createdAt ? new Date(bill.createdAt) : new Date();
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + 7);
  return d;
};

// Customer rows with computed dueDate and local sort for "Batas Waktu"
const customerRows = computed(() => {
  const rows = customerBills.value.map((b) => ({
    bill: b,
    dueDate: computeDueDate(b),
  }));

  const sortKey = custSortBy.value;
  const order = custOrder.value;

  return rows.slice().sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'createdAt') {
      cmp =
        new Date(a.bill.createdAt).getTime() -
        new Date(b.bill.createdAt).getTime();
    } else if (sortKey === 'serviceName') {
      cmp = a.bill.serviceName.localeCompare(b.bill.serviceName);
    } else if (sortKey === 'dueDate') {
      cmp = a.dueDate.getTime() - b.dueDate.getTime();
    }
    return order === 'asc' ? cmp : -cmp;
  });
});

// --- Navigation ---
const goDetail = (id: string) => {
  router.push(`/bills/${encodeURIComponent(id)}`);
};

// --- Formatting helpers ---
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

// --- Reload sections ---
const reloadAdmin = async () => {
  if (!isSuperadmin) return;
  await billStore.fetchAllBills({
    customerId: adminCustomerId.value || undefined,
    serviceName: adminServiceName.value || undefined,
    status: (adminStatus.value as Bill['status']) || undefined,
  });
};

const reloadCustomer = async () => {
  if (!isCustomer) return;
  // Only pass sortBy to backend when using server-supported fields
  const sortKey = custSortBy.value;
  await billStore.fetchCustomerBills({
    status: (custStatus.value as Bill['status']) || undefined,
    sortBy: sortKey === 'dueDate' ? undefined : sortKey,
    order: custOrder.value,
  });
};

const reloadService = async () => {
  // Service bill section is for service roles + superadmin
  if (!isServiceRole && !isSuperadmin) return;

  // Determine which serviceName to fetch based on role.
  // For now, default Superadmin to "Flight" as well, so they can see
  // flight-related service bills here, while "All Bills" table above
  // already shows everything.
  const name = serviceServiceName.value ?? 'Flight';

  await billStore.fetchServiceBills({
    serviceName: name,
    customerId: serviceCustomerId.value || undefined,
    status: (serviceStatus.value as Bill['status']) || undefined,
  });
};

// --- Reset helpers ---
const resetAdminFilters = async () => {
  adminCustomerId.value = '';
  adminServiceName.value = '';
  adminStatus.value = '';
  await reloadAdmin();
};

const resetCustomerFilters = async () => {
  custStatus.value = '';
  custSortBy.value = 'createdAt';
  custOrder.value = 'asc';
  await reloadCustomer();
};

const resetServiceFilters = async () => {
  serviceCustomerId.value = '';
  serviceStatus.value = '';
  await reloadService();
};

// --- Initial load ---
onMounted(async () => {
  billStore.clearError();
  billStore.clearSuccess();
  const tasks: Promise<any>[] = [];
  if (isSuperadmin) tasks.push(reloadAdmin());
  if (isCustomer) tasks.push(reloadCustomer());
  if (isServiceRole || isSuperadmin) tasks.push(reloadService());
  await Promise.all(tasks);
});
</script>

<style scoped>
.bill-list-view {
  min-height: 100vh;
  background: #ffffff;
}

/* Hero */
.hero {
  padding: 2.5rem 2rem;
  background: #F9CDD5;
  color: #ffffff;
}
.hero-content h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}
.hero-content p {
  margin: 0.5rem 0 0;
  font-size: 1rem;
  opacity: 0.95;
}

/* Sections */
.filters-card {
  background: #fff;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  margin: 1.5rem 2rem 1rem;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}
.section-title-row h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-gray-900);
}

/* Filters */
.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  align-items: end;
}

.field {
  display: grid;
  gap: 0.35rem;
}

.field-label {
  font-weight: 600;
  color: var(--color-gray-700);
  font-size: 0.9rem;
}

.text-input,
.select-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background: #fff;
}

.text-input:focus,
.select-input:focus {
  outline: none;
  border-color: #F9CDD5;
  box-shadow: 0 0 0 3px rgba(249, 205, 213, 0.1);
}

.filter-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.25rem;
}

/* Buttons (reuse pattern from Flight/Booking views) */
.btn {
  padding: 0.65rem 1.25rem;
  border-radius: var(--radius-md);
  border: none;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}
.btn-sm {
  padding: 0.4rem 0.9rem;
  font-size: 0.8rem;
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

/* Table */
.table-wrapper {
  margin-top: 1.5rem;
  overflow-x: auto;
}

.bill-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.bill-table thead tr {
  background: var(--color-gray-50);
}
.bill-table th,
.bill-table td {
  padding: 0.75rem 0.75rem;
  border-bottom: 1px solid var(--color-gray-200);
  text-align: left;
  white-space: nowrap;
}
.bill-table th {
  font-weight: 700;
  color: var(--color-gray-700);
  text-transform: uppercase;
  font-size: 0.8rem;
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

/* Alerts */
.alert {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 500;
}
.alert.error {
  background: rgba(239, 68, 68, 0.06);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.alert.success {
  background: rgba(16, 185, 129, 0.06);
  color: #047857;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

/* Empty and loading */
.empty-state {
  text-align: center;
  padding: 1.5rem;
  color: var(--color-gray-500);
  font-style: italic;
}

.global-loading {
  margin: 1.5rem auto 2rem;
  max-width: 400px;
  text-align: center;
  color: var(--color-gray-600);
}
.global-loading .spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-gray-200);
  border-top-color: #F9CDD5;
  border-radius: 50%;
  margin: 0 auto 0.75rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .hero {
    padding: 2rem 1rem;
  }
  .filters-card {
    margin-left: 1rem;
    margin-right: 1rem;
  }
}
</style>