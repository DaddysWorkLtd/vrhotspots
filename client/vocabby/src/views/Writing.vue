<template>
  <div class="container">
    <div class="row" @click="getTranslation()">
      Writing practice, answer question (click for translation).
    </div>
    <div class="console" v-html="console" @click="getTranslation()"></div>
    <div>
      <textarea class="chatbox" ref="chatbox" @keydown.enter="sendAnswer()" v-model="prompt"></textarea>
    </div>
    <div class="row">
      <button style="color:darkgreen; border-color: darkgreen" @click="sendAnswer()" v-bind:disabled="busy">send
      </button>
      <span class="loading-spinner" v-show="busy"></span>
      <button style="color:darkorange; border-color:darkorange" @click="getQuestion()">new</button>
    </div>
    <div class="seed clickable"><span @click="toggleSeed()" class="clickable">seed: {{ seed }}</span></div>

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
      seed: "word_learnings",
      prompt: "",
      console: "",
      busy: true,
      gptScript: ""
    }
  },
  methods: {
    sendAnswer() {
      if (this.prompt == "new") {
        this.getQuestion()
      } else {
        const _chatbox = this.$refs.chatbox
        _chatbox.blur()
        this.busy = true
        return axios
            .post(this.$apiHost + '/api/gpt/answer', {prompt: this.prompt})
            .then(res => {
              this.console += ">>" + this.prompt + "<br />"
              // should check there is no code in the returned text to guard
              // against injection attacks
              this.console += res.data.text + "<br />"
              console.log(res.data.text)
              //call for a new question if correct
              if (res.data.text.indexOf('Yes,') > -1) {
                this.getQuestion()
              }
              _chatbox.focus()
              this.busy = false
            })
      }
    },
    getQuestion() {
      this.prompt = "getting new question, please wait..."
      this.busy = true
      return axios
          .post(this.$apiHost + '/api/gpt/question/' + this.lang + '/' + this.baseLang,
              {seed: this.seed})
          .then(res => {
            this.question = res.data.question
            this.translation = res.data.translation
            this.console = this.question + "<br />"
            console.log(res.data.question, res.data.translation)
            this.prompt = ""
            this.busy = false
          })
    },
    textToSpeech(text, lang) {
      return axios
          .post(this.$apiHost + '/api/tts',
              {
                text: text,
                language: lang
              })
          .then(res => {
            const audio = new Audio(res.data.file);
            audio.play();
          })
    },
    getTranslation() {
      if (this.translation) {
        this.console += "(" + this.translation + ")<br />"
        this.translation = ""
      }
      this.textToSpeech(this.question, this.lang)
    },
    toggleSeed() {
      this.seed = (this.seed === "random") ? "word_learnings" : "random"
      this.getQuestion()
    },


  },
  created: function () {
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
  height: 100%
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

.disable button {
  width: 100%;
  height: 70%;
  color: whitesmoke;
  background: saddlebrown;
  border-style: hidden;
}

button {
  outline: none;
  width: 15%;
  height: 30px;
  border-radius: 10px;
  border-width: 1px;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid darkslategray;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  animation: spin .5s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.console {
  font-family: Courier, monospace;
}

</style>