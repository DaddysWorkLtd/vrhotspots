<template>
  <div class="container">
    <div class="row" @click="getTranslation()">
      Writing practice, answer question (click for translation).
    </div>
    <div v-html="console"></div>
    <div>
    <textarea class="chatbox" ref="chatbox" @keydown.enter="sendAnswer()" v-model="prompt"></textarea>
    </div>
    <div class="seed clickable"><span @click="toggleSeed()" class="clickable">seed: {{seed}}</span></div>
   </div>
</template>
<script>
import axios from "axios";

export default {
  name: "Writing",
  data() {
    return {
      baseLang: "en",
      lang: "nl",
      seed: "random",
      prompt:"",
      console:"",
    }
  },
  methods: {
    sendAnswer() {
      if (this.prompt == "new") {
        this.getQuestion()
      } else {
        const _chatbox = this.$refs.chatbox
        _chatbox.blur()
        return axios
            .post(this.$apiHost + '/api/gpt/answer', {prompt: this.prompt})
            .then(res => {
              this.console += ">>" + this.prompt + "<br />"
              // should check there is no code in the returned text to guard
              // against injection attacks
              this.console += res.data.text + "<br />"
              console.log(res.data.text)
              //call for a new question if correct
              if (res.data.text.indexOf('Yes,')) {
                this.getQuestion()
              }
              _chatbox.focus()
            })
      }
    },
    getQuestion() {
      this.prompt = "getting new question, please wait..."
      return axios
          .post(this.$apiHost + '/api/gpt/question/' + this.lang + '/' + this.baseLang,
              {seed: this.seed})
          .then(res => {
            this.question = res.data.question
            this.translation = res.data.translation
            this.console += this.question +"<br />"
            console.log (res.data.question,res.data.translation)
            this.prompt=""
          })
    },
    getTranslation() {
      if (this.translation) {
        this.console += "(" + this.translation +")<br />"
        this.translation=""
      }
    },
    toggleSeed() {
      this.seed = (this.seed === "random") ? "word_learnings" : "random"
      this.getQuestion()
    }
  },
    created: function () {
      console.log('created')
      this.getQuestion()
    }
}
</script>

<style scoped>

.container {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  justify-content: space-between;
  height:100%
}
.row {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: space-between;
}

.seed {
  text-align: center;
  font-size: 2em;
  color: lightgray;
}

.chatbox {
  width: 90%;
}

</style>