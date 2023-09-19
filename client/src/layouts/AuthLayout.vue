<template lang="pug">
q-layout( view="lHh Lpr lFf")
  q-header( elevated)
    q-toolbar
      q-toolbar-title Novll
  q-page-container
    router-view
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "MainLayout",

  components: {},

  setup() {
    return {};
  },
});
</script>
