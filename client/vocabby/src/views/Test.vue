<template>
  <div class="container">
    <div class="row">
      <div class="options">Testing <span @click="toggleQuestionType">{{questionType}} words</span> <span @click="toggleLanguage">from {{languages}}</span>:</div>
      <div class="question">
        &ldquo;{{ question.word }}&rdquo;
      </div>
      <div class="disable"><button @click="disableQuestion">Delete</button></div>
    </div>
    <div>&nbsp;</div>
    <div class="confidence">
      <button style="color:darkred" @click="setConfidence(0)" :class="confidence==0 ? 'active' : 0">No Scooby</button>
      <button style="color:darkorange" @click="setConfidence(25)" :class="confidence==25 ? 'active' : 0">Tricky Dicky</button>
      <button style="color:goldenrod" @click="setConfidence(50)" :class="confidence==50 ? 'active' : 0">Whatever</button>
      <button style="color:yellowgreen" @click="setConfidence(75)" :class="confidence==75 ? 'active' : 0">Easy Peasy</button>
      <button style="color:seagreen" @click="confidence=100" :class="confidence==100 ? 'active' : 0">Piece of Cake</button>
    </div>
    <div>&nbsp;</div>
    <div class="answers">
      <button v-for="choice in question.choices" :key="choice.wordId"
              v-bind:class="{  backgroundIncorrect: (incorrectTrigger==choice.wordId), backgroundCorrect: (correctTrigger==choice.wordId) }"
              @click="clickAnswer(choice.wordId)">{{choice.word}}</button>
   </div>
    <!-- this should also be a component + all time stats-->
    <div class="score" v-if="questions">
      {{correct}} / {{questions}} = {{Math.round(correct*100/questions)}}%
    </div>
  </div>
</template>
<script>
import axios from "axios";

export default {
  name: "Test",
  data() {
    return {
      question:{},
      confidence: 50,
      correct: 0,
      questions:0,
      correctTrigger:false,
      incorrectTrigger: false,
      clickLatch: false,
      languages: "Dutch to English",
      fromLang: "nl",
      toLang: "en",
      questionType: "new"
    }
  },
  methods: {
    toggleLanguage() {
      if (this.fromLang == "nl") {
        this.fromLang="en"
        this.toLang="nl"
        this.languages="English to Dutch"
      } else {
        this.fromLang="nl"
        this.toLang="en"
        this.languages="Dutch to English"
      }
      this.getQuestion()
    },
    toggleQuestionType() {
      if (this.questionType == "new") {
        this.questionType = "repeat"
      } else {
        this.questionType = "new"
      }
      this.getQuestion()
    },
    setConfidence(level) {
      this.confidence = level
    },
    getQuestion() {
      return axios
          .get( 'https://' + location.hostname + ':3069/api/vocably/question/'+ this.fromLang + '/' + this.toLang + '/' + this.questionType)
          .then(res => {
            this.question = res.data
            this.clickLatch = false
            console.log(res.data, this.question.choices)
          })
    },
    clickAnswer(wordId) {
      if ( this.clickLatch ) return
      this.clickLatch = true
      this.questions++
      // remoce the last one applied, event loop runs before callback from axios
      this.correctTrigger = false;
      this.incorrectTrigger = false;
      axios
          .put( 'https://' + location.hostname + ':3069/api/vocably/answer/' + this.question.questionId, {wordId: wordId})
          .then(res => {
            // call for next question, would this work?
            this.correct++
            //alert( "Je bent een genie! Goed" )
            // set the status of different rows, just do status bar for now
            this.correctTrigger=wordId
            console.log(res)
            setTimeout(this.getQuestion,1500)
          })
          .catch( error => {
            if (error.response.status == 400) {
              //alert("Wat een domoor! Fout")
              this.incorrectTrigger = error.response.data.incorrect
              // todo: we need to indicate correct answer
              console.log("answer should be: ",error.response.data.incorrect)
            } else {
              alert("Oops:", error.data)
            }
            setTimeout(this.getQuestion,2500)
          })
    },
    async disableQuestion() {
      console.log('deleting')
      try {
        var res = await axios.delete( 'https://' + location.hostname + ':3069/api/vocably/question/' + this.question.questionId)
        console.log("deleted question and disabled word", res)
      } catch ( error) {
        alert("Issue.." + error)
        console.log(error.response)
      }
      this.getQuestion()
    }
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
  height:100%
}
.row {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: space-between;
}

.confidence {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}
.confidence button {
  height: 10%;
  border-color:darkgrey;
  border-style: dotted;
}

.confidence button:hover {
  border-style: solid;
}
.active {
  font-weight: bold;
  font-size: 1.1em;
  border: darkgrey;
  border-style: solid !important;
  font-style: italic;
}

.question {
  font-size: 2.5em;
  align-items: flex-start;
}
.disable button {
  width:100%;
  height: 70%;
  color: whitesmoke;
  background: saddlebrown;
  border-style: hidden;
}

.answers {
  align-items: center;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.answers button {
  margin-bottom: 20px;
  background: white;
  font-size: 1.1em;
  width: 90%
}

.answers button:active {
  background: dimgrey;
  color: whitesmoke;
}


button {
  outline: none;
  width: 18%;
  height: 50px;
  border-radius: 15px;
}

.score {
  text-align: center;
  font-size: 2em;
  color: lightgray;
}

@-o-keyframes fadeItRed {
  0%   { background-color: #FFFFFF; }
  50%  { background-color: #cc0000; }
  100% { background-color: #FFFFFF; }
}
@keyframes fadeItRed {
  0%   { background-color: #FFFFFF; }
  50%  { background-color: #cc0000; }
  60% {
    transform: translate3d(4px, 0, 0);
  }
  70% {
    transform: translate3d(-4px, 0, 0);
  }
  80% {
    transform: translate3d(2px, 0, 0);
  }
  90% {
    transform: translate3d(-1px, 0, 0);
  }
  100% { background-color: #FFFFFF; }
}

.backgroundIncorrect {
  background-image:none !important;
  -o-animation: fadeItRed 1.5s ease-in-out;
  animation: fadeItRed 1.5s ease-in-out;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  perspective: 1000px;
}

@-o-keyframes fadeItGreen {
  0%   { background-color: #FFFFFF; }
  50%  { background-color: #cc0000; }
  100% { background-color: #FFFFFF; }
}
@keyframes fadeItGreen {
  0%   { background-color: #FFFFFF; }
  50%  { background-color: #00aa00; }
  100% { background-color: #FFFFFF; }
}

.backgroundCorrect {
  background-image:none !important;
  -o-animation: fadeItGreen 1.5s ease-in-out;
  animation: fadeItGreen 1.5s ease-in-out;
}

</style>