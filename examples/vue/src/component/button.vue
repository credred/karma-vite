<template>
  <button @click="onClick">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  onClick?: Function;
  forUnCoverageProps?: boolean;
}>();

if (props.forUnCoverageProps) {
  console.log('the line wall not be covered');
} else {
  console.log('the line will be covered');
}
</script>
