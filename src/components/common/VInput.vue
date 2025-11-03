<template>
  <div class="v-input-wrapper">
    <label v-if="label" :for="inputId" class="v-input-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>

    <div class="v-input-container">
      <input
        :id="inputId"
        ref="inputRef"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :min="min"
        :max="max"
        :step="step"
        :class="[
          'v-input',
          size,
          { error: hasError, disabled, readonly }
        ]"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
        @change="$emit('change', $event)"
      />

      <div v-if="icon" class="input-icon">
        <slot name="icon">{{ icon }}</slot>
      </div>
    </div>

    <div v-if="hint || hasError" class="v-input-hint">
      <span v-if="hasError" class="error-text">{{ errorMessage }}</span>
      <span v-else-if="hint" class="hint-text">{{ hint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue: string | number
  label?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  error?: string
  hint?: string
  icon?: string
  min?: number | string
  max?: number | string
  step?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
  disabled: false,
  readonly: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  change: [event: Event]
}>()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _emit = emit
 

const inputRef = ref<HTMLInputElement>()
const inputId = computed(() => `input-${Math.random().toString(36).substr(2, 9)}`)

const hasError = computed(() => Boolean(props.error))
const errorMessage = computed(() => props.error || '')

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
})
</script>

<style scoped>
.v-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.v-input-label {
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

.v-input-container {
  position: relative;
}

.v-input {
  width: 100%;
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  background: var(--color-white);
  color: var(--color-gray-800);
  position: relative;
  overflow: hidden;
}

.v-input::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.05), transparent);
  transition: left 0.6s;
}

.v-input:focus::before {
  left: 100%;
}

.v-input:focus {
  outline: none;
  border-color: var(--color-pink);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
  transform: translateY(-1px);
}

.v-input.error {
  border-color: var(--color-red);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.v-input.error:focus {
  border-color: var(--color-red);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.v-input.disabled {
  background: var(--color-gray-50);
  border-color: var(--color-gray-300);
  color: var(--color-gray-500);
  cursor: not-allowed;
}

.v-input.readonly {
  background: var(--color-gray-50);
  cursor: default;
}

.v-input::placeholder {
  color: var(--color-gray-400);
  font-weight: 400;
}

/* Sizes */
.sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.md {
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

.lg {
  padding: 1rem 1.25rem;
  font-size: 1.125rem;
}

.input-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-400);
  pointer-events: none;
}

.v-input-hint {
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

/* Number input specific styles */
.v-input[type="number"] {
  -moz-appearance: textfield;
}

.v-input[type="number"]::-webkit-outer-spin-button,
.v-input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>