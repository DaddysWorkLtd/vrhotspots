<template>
  <textarea class="langBox" :placeholder="lang" :value="boxText" @input="(event)=> $emit ('update:boxText',event.target.value)" @change="translate"></textarea>
</template>

<script>
//import {ref,watch,watchEffect} from 'vue'
export default {
name: "LanguageBox",
  props: {lang: String,
      boxText:String,
      code:String},
  emits: ['translate','update:boxText'],
  methods: {
    translate() {
      this.$emit('translate', {from: this.lang, text: this.boxText, code: this.code})
    }
  },
}
</script>

<style>
  .langBox {
    width: 49%;
    font-size: 24pt;
    border-radius: 25px;
    padding: 5px 15px 5px 15px;
    min-height: 350px;
  }
  .langBox:focus {
    outline: none !important;
    border:2px solid black;
    box-shadow: 0 0 10px black;
  }
</style>