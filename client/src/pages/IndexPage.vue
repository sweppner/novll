<template lang="pug">
q-page( class="")
  div(v-for="(chapter,value) in book")
    h5 {{ chapter.title }}
    h6 {{ chapter.description[0] }}
    p {{ chapter.text }}
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'IndexPage',
  data(){
    return{
      book:null,
    }
  },
  async mounted(){
    let {data} = await this.$axios.get('/api/index')
    this.book =data
  }
})
</script>
