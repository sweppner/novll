<template lang="pug">
q-page.flex.flex-center
  q-card.q-pa-md.row.items-start.q-gutter-md.column
    QCardSection
      .row
        .col-12
          q-input(
            v-model="v$.email.$model"
            label="Email"
            type="email"
            lazy-rules
            :reactive-rules="true"
            :error="v$.email.$error"
            )
          q-input(
            v-model="v$.password.$model"
            lazy-rules
            :reactive-rules="true"
            :error="v$.email.$error"
            type="password"
            label="Password"
          )
      .row
        .col-12.text-right.q-mt-lg
          q-btn( @click="submit" color="primary" label="Login" )
</template>

<script>
import { defineComponent } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import {
  email,
  required,
  minLength
} from '@vuelidate/validators'

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
      let valid = await this.v$.$validate()
      if(valid){
        let {data} = await this.$axios.post('/api/register',{email:this.email, password:this.password})
        if(data) console.log('success')
      }
    }
  },
  validations(){
    return{
      email:{
        email,
        required,
        $autoDirty:true
      },
      password:{
        required,
        minLength:minLength(5),
        $autoDirty:true
      },
    }
  },
  setup(){
    return{
      v$: useVuelidate({}),
    }
  }

})
</script>
