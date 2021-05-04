<template>
  <span>{{baseText}}</span>
  <div class="languageBoxes">
    <LanguageBox v-for="lang in langs" :lang="lang.name" :key="lang.code" :code="lang.code" v-model:box-text="lang.text" @translate="translate"></LanguageBox>
<!--    <LanguageBox lang="English" @translate="translate"/>
    <LanguageBox lang="Dutch" @translate="translate" /> -->
  </div>
</template>

<script>
import LanguageBox from './LanguageBox.vue'
export default {
  name: 'Translator',
  props: {baseText: String},
  data() {
    return {
      langs: [{name: "English", code: "en", text: "Poo"},{name: "Dutch", code:"nl",text:"Pee"}],
    };
  },
  methods: {
    translate(what) {
      // start the timer, tick every 10ms
      console.log('translator translate event', what)
      this.langs.forEach(
          function ( lang ) {
            if ( lang.name !== what.from) {
              console.log('translate ', what.text, ' to ', lang.code)
              lang.text = what.text + " in " + lang.name
            }
          }
      )
    },
  },
  components: {
    LanguageBox
  }
}
</script>

<style scoped>

.languageBoxes {
  display: flex;
  flex-grow: 4;
  flex-basis: auto;
  justify-content: space-around;
  height: 100%;
}

</style>