<template>
  <span>{{ baseText }}</span>
  <div class="button-bar">
  <button @click="translate">translate</button>
  <button @click="copy">copy</button>
  <button @click="paste">paste</button>
  <button @click="clear">clear</button>
  <button @click="login">login</button>
  </div>
  <div class="languageBoxes">
    <LanguageBox v-for="lang in langs" :lang="lang.name" :key="lang.code" :code="lang.code"
                 v-model:box-text="lang.text" @translate="translate"></LanguageBox>
    <!--    <LanguageBox lang="English" @translate="translate"/>
        <LanguageBox lang="Dutch" @translate="translate" /> -->
  </div>
</template>

<script>
import LanguageBox from './LanguageBox.vue'
import axios from "axios";

export default {
  name: 'Translator',
  props: {baseText: String},
  data() {
    return {
      langs: [{name: "English", code: "en", text: ""}, {name: "Dutch", code: "nl", text: ""}],
    };
  },
  methods: {
    translate(what) {
      // updates every other textbox except the one being translated
      const _that = this
      this.langs.forEach(
          function (lang) {
            if (lang.name !== what.from) {
              console.log('translate ', what.text, ' to ', lang.code)
//              lang.text = what.text + " in " + lang.name
              _that.setTranslation(what.text, what.code, lang.code, lang)
            }
          }
      )
    },
    setTranslation(text, from, to, box) {
      //check cache first
      const data = {
        from: from,
        to: to,
        text: text
      };

      axios.post("https://home.daddyswork.com:3069/api/translate", data)
          .then(response => box.text = response.data);
    }
  },
  components: {
    LanguageBox
  }
}
</script>

<style scoped>

.languageBoxes {
  display: flex;
  justify-content: space-around;
  height: 100%;
}

.button-bar {
  display: flex;
  justify-content: space-around;
  padding: 25px;
}

button {
  width: 19%;
  border-radius: 15px;
}
</style>