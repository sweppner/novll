<template lang="pug">
q-page.flex.flex-center
  q-card.q-pa-md.row.items-start.q-gutter-md.column
    QCardSection
      .row
        .col-12
          q-input( v-model="email" label="Email")
          q-input( v-model="password" type="password" label="Password")
      .row
        .col-12.text-right.q-mt-lg
          q-btn( @click="submit" color="primary" label="Login" )
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Auth',
  data(){
    return{
      email:'abc',
      password:'123',
    }
  },
  methods:{
    async submit(){
      let {data} = await this.$axios.post('/api/register',{email:this.email, password:this.password})
      console.log(data)
    }
  }
})
</script>
