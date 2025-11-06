<template>
  <div class="v-select-wrapper">
    <label v-if="label" :for="selectId" class="v-select-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>

    <div class="v-select-container">
      <select
        :id="selectId"
        ref="selectRef"
        :value="boundValue"
        :disabled="disabled"
        :class="[
          'v-select',
          size,
          { error: hasError, disabled }
        ]"
        @change="onChange"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="String(option.value)"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>

      <div class="select-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>
    </div>

    <div v-if="hint || hasError" class="v-select-hint">
      <span v-if="hasError" class="error-text">{{ errorMessage }}</span>
      <span v-else-if="hint" class="hint-text">{{ hint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface Props {
  modelValue: string | number
  options: SelectOption[]
  label?: string
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  disabled: false,
  required: false,
  options: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _emit = emit

const selectRef = ref<HTMLSelectElement>()
const selectId = computed(() => `select-${Math.random().toString(36).substr(2, 9)}`)

const hasError = computed(() => Boolean(props.error))
const errorMessage = computed(() => props.error || '')

// Coerce types so that selects with numeric option values emit numbers,
// and the bound value is always compared as a string for proper rendering.
const isNumericOptions = computed(() => props.options.some(o => typeof o.value === 'number'))
const boundValue = computed(() => (props.modelValue === null || props.modelValue === undefined) ? '' : String(props.modelValue))
function onChange(e: Event) {
  const raw = (e.target as HTMLSelectElement).value
  const next = isNumericOptions.value ? Number(raw) : raw
  emit('update:modelValue', next as string | number)
}

defineExpose({
  focus: () => selectRef.value?.focus(),
  blur: () => selectRef.value?.blur(),
})
</script>

<style scoped>
.v-select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.v-select-label {
  font-weight: 600;
  color: var(--color-gray-700);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.required {
  color: var(--color-red);
  font-weight: bold;
}

.v-select-container {
  position: relative;
}

.v-select {
  width: 100%;
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  background: var(--color-white);
  color: var(--color-gray-800);
  cursor: pointer;
  appearance: none;
  position: relative;
  overflow: hidden;
}

.v-select::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.05), transparent);
  transition: left 0.6s;
}

.v-select:focus::before {
  left: 100%;
}

.v-select:focus {
  outline: none;
  border-color: var(--color-pink);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
  transform: translateY(-1px);
}

.v-select.error {
  border-color: var(--color-red);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.v-select.error:focus {
  border-color: var(--color-red);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.v-select.disabled {
  background: var(--color-gray-50);
  border-color: var(--color-gray-300);
  color: var(--color-gray-500);
  cursor: not-allowed;
}

.v-select:disabled {
  cursor: not-allowed;
}

/* Sizes */
.sm {
  padding: 0.5rem 2.5rem 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.md {
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  font-size: 1rem;
}

.lg {
  padding: 1rem 2.5rem 1rem 1.25rem;
  font-size: 1.125rem;
}

.select-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-400);
  pointer-events: none;
  transition: color 0.3s ease;
}

.v-select:focus + .select-icon {
  color: var(--color-pink);
}

.v-select.error + .select-icon {
  color: var(--color-red);
}

.v-select-hint {
  font-size: 0.875rem;
  min-height: 1.25rem;
  display: flex;
  align-items: center;
}

.error-text {
  color: var(--color-red);
  font-weight: 500;
}

.hint-text {
  color: var(--color-gray-500);
}

/* Custom option styling */
.v-select option {
  padding: 0.5rem;
  background: var(--color-white);
  color: var(--color-gray-800);
}

.v-select option:disabled {
  color: var(--color-gray-400);
  font-style: italic;
}
</style>