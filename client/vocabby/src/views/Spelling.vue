<template>
  <div class="container">
    <div class="row" @click="getTranslation()">
      Type the word that matches the clue.
      Click the clue to hear the answer.
    </div>
    <div class="row">&nbsp;</div>
    <div class="console" v-html="console" @click="getTranslation()"></div>
    <div class="row">&nbsp;
    </div>
    <!--    <div class="row">
          <input v-for="(input, index) in inputArr" :key="index" v-model="input.value" type="text" />
        </div> -->
    <div class="row">
      <input type="text" :value="guess" class="text-center"
             @input="checkProgress" :placeholder="placeholder" @keydown.enter="newClue()"/>
      <span> Progress: {{ progressStr }} </span>
    </div>
    <div class="row">&nbsp;
    </div>
    <div class="row">
      <span class="loading-spinner" v-show="busy" style="width: 25px"></span>
      <button style="color:darkorange; border-color:darkorange" @click="getClue()">New</button>
    </div>

  </div>
  <audio>
    <source ref="success" src="szary_success.mp3" type="audio/mpeg">
  </audio>
</template>

<script>
import axios from "axios"

export default {
  name: "Dialogue",
  data() {
    return {
      baseLang: "en",
      lang: "nl",
      clue: '',
      translation: '',
      answer: '',
      console: '',
      busy: false,
      placeholder: "",
      progressStr: "",
      guess: "",
      done: false
    }
  },
  methods: {
    getClue() {
      this.prompt = "getting new clue, please wait..."
      this.busy = true
      return axios
          .post(this.$apiHost + '/api/gpt/clue/' + this.lang + '/' + this.baseLang)
          .then(res => {
            this.progressStr = "fetching"
            this.clue = res.data.clue
            this.translation = res.data.translation
            this.answer = res.data.answer
            this.console = this.clue + "<br />"
            this.busy = false
            // am i doing an array of characters?
            this.inputArr = this.answer.split("")
            this.inputArr.fill("")
            // give the first letter as a clue
            this.placeholder = `${this.answer[0]} `
            for (var i = 1; i < this.answer.length; i++) {
              this.placeholder += '_ '
            }
            // reset guess from last word
            this.guess = ""
            this.progressStr = this.answer.length + " letters"
            this.done = false
            console.log(this)
          }).catch(err => {
            this.progressStr = "fetch error"
            this.busy = false
            console.log(err)
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
      this.textToSpeech(this.answer, this.lang)
    },
    checkProgress(e) {
      function compareWords(word1, word2) {
        var count = 0;
        const minLength = Math.min(word1.length, word2.length);

        for (var i = 0; i < minLength; i++) {
          if (word1[i] === word2[i]) {
            count++;
          }
        }

        return count;
      }

      // due to mobile bug have to bind manually
      this.guess = e.target.value

      console.log(this.guess, this.answer, this.guess == this.answer)

      if (!this.answer) return
      // only continue if there is an answer
      if (this.guess.toLowerCase() == this.answer.toLowerCase()) {
        this.progressStr = 'CORRECT'
        this.guess = this.guess.toUpperCase()
        if (!this.done) {
          this.audio.play()
        }
        this.done = true
      } else {
        this.guess = this.guess.toLowerCase()
        this.progressStr = compareWords(this.guess, this.answer) + ' / ' + this.answer.length
      }
      this.progressStr += ' (' + this.guess.length + ')'
    },
    newClue: function () {
      if (this.done) this.getClue()
    },
  },
  created: function () {
    const audio = new Audio('szary_success.mp3')
    audio.loop = false
    this.audio = audio
    this.getClue()
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

.flash {
  animation: flash 1s infinite;
}

@keyframes flash {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.console {
  font-family: Courier, monospace;
}

button {
  outline: none;
  width: 15%;
  height: 30px;
  border-radius: 10px;
  border-width: 1px;
}
</style>