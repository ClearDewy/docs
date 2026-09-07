<script setup lang="ts">
import PythonPlayground from "../PythonPlayground.vue";
import code from "../../../../../examples/python/bigram_lab.py?raw";
</script>
<template><PythonPlayground title="训练并采样最小 next-token 模型" :code="code" /></template>
