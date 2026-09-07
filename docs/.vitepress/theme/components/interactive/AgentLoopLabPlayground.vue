<script setup lang="ts">
import PythonPlayground from "../PythonPlayground.vue";
import code from "../../../../../examples/python/agent_state_lab.py?raw";
</script>
<template><PythonPlayground title="运行等待、批准、拒绝与重试状态机" :code="code" /></template>
