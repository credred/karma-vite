<template>
  <button @click="onClick" :style="{ width: '200px' }">
    <slot>123</slot>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  onClick?: Function;
  forRealUnCoveredProps?: boolean;
}>();

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

// for coverage report some line are not covered
if (props.forRealUnCoveredProps) {
  noop();
} else {
  noop();
}
</script>
