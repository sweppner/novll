<template lang="pug">
q-page
  .row.flex.flex-center
    .col-4.q-mt-xl
      q-card.q-pa-md
        q-card-section
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
      email:'',
      password:'',
    }
  },
  methods:{
    async submit(){
      let valid = await this.v$.$validate()
      if(valid){
        try{
          let {data} = await this.$axios.post('/api/login',{email:this.email, password:this.password})
          this.$q.notify({type:'positive',message:"Success"})
        }catch(err){
          if(err.response.data.msg) this.$q.notify({type:'negative',message:err.response.data.msg})
          else this.$q.notify(err)
        }
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
