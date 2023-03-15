<template>
  <div class="container">
    <div class="console" v-html="console" @click="getTranslation()"></div>
    <div class="row">
      <button style="color:darkred; border-color:darkred; padding: 5px" @click="startRecording()"
              v-bind:class="{ 'flash': isRecording }">Record
      </button>
      <button style="color:darkgreen; border-color:darkgreen" @click="sendRecording()"
              v-bind:class="{ 'flash': isSending }">Send
      </button>
      <span class="loading-spinner" v-show="busy" style="width: 25px"></span>
      <button style="color:darkorange; border-color:darkorange" @click="getStatement()">New</button>
    </div>
    <div class="row">
    </div>
  </div>
  <audio>
    <source ref="success" src="szary_success.mp3" type="audio/mpeg">
  </audio>
</template>

<script>
import axios from "axios"
//import FlacEncoder from 'flac.js';

export default {
  name: "Oral",
  mounted() {
    /*
    const plugin = document.createElement("script");
    plugin.setAttribute(
      "src",
      "../assets/aurora.js"
    );
    document.head.appendChild(plugin);
    const plugin2 = document.createElement("script");
    plugin2.setAttribute(
      "src",
      "../assets/flac.js"
    );
    document.head.appendChild(plugin2);
    */
  },
  data() {
    return {
      prompt: "",
      chunks: [],
      mediaRecorder: null,
      console: "",
      audioUrl: "",
      audioBlob: 0,
      isRecording: false,
      isSending: false,
      seeds: '',
      baseLang: "en",
      lang: "nl",
      seed: "word_learnings",
      busy: true,
      correct: false,
      seedNum: 2
    }
  },
  methods: {
    playSuccess() {
      this.audio.play();
    },
    startRecording() {
      const _this = this
      if (this.isRecording) {
        this.stopRecording()
      }
      navigator.mediaDevices.getUserMedia({audio: true})
          .then(stream => {
            _this.isRecording = true
            // reset old recording
            _this.chunks = []
            _this.mediaRecorder = new MediaRecorder(stream) // {audioBitsPerSecond: 16000}) bits still being igmored
            // had to specify chunks as chrome was losing the last chunk, alway 0 size and only fired on stop
            _this.mediaRecorder.start();
            _this.mediaRecorder.addEventListener("dataavailable", event => {
              _this.chunks.push(event.data);
              console.log('audio captured', event.data.size)
            });
            _this.mediaRecorder?.addEventListener('stop', () => {
              _this.audioBlob = new Blob(this.chunks, {type: "audio/flac; codecs=flac"})//{type: "audio/ogg; codecs=opus"});
              _this.audioUrl = URL.createObjectURL(this.audioBlob)
              _this.isRecording = false
              console.log('blobbed')
            })
            console.log('recording')
          })
          .catch(err => alert(err))
    },
    stopRecording() {
      this.mediaRecorder.stop();
      /*
      const flacEncoder = new FlacEncoder(16000, 1, 16);
      flacEncoder.encode([this.audioBlob], (flacBlob) => {
        this.flacUrl = URL.createObjectURL(flacBlob);
        // Do something with the flacUrl, such as download or play it
      });*/
    },
    playRecording() {
      const audio = new Audio(this.audioUrl);
      audio.play();
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
    sendRecording() {
      function removePunctuation(in_str) {
        var clean_str = in_str.replace(/[.,/#!$%^&*;:{}=\\-_`~()?]/g, "");
        return clean_str.replace(/\s{2,}/g, " ");
      }

      // compares strings including locale characters
      // https://stackoverflow.com/questions/2140627/how-to-do-case-insensitive-string-comparison
      function ciEquals(a, b) {
        return typeof a === 'string' && typeof b === 'string'
            ? a.localeCompare(b, undefined, {sensitivity: 'accent'}) === 0
            : a === b;
      }

      if (this.mediaRecorder.state === 'recording' || this.isRecording) {
        // lets hope this is syncronous :)
        this.stopRecording()
        // its not so call back in abit
        setTimeout(this.sendRecording, 25)
      } else {
        console.log('sending')
        this.isSending = true
        this.playRecording()
        // so far my attempts to change the audio have failed and its webm
        const audioFile = new File([this.audioBlob], "recording.flac",
            {type: "audio/flac"})
        let formData = new FormData();
        formData.append("file", audioFile);
        formData.append('language', "nl-NL")
        axios({
              method: 'POST',
              url: this.$apiHost + "/api/transcribe",
              data: formData,
              headers: {"Content-Type": "multipart/form-data"},
            }
        ).then(response => {
          this.console += "> " + response.data.text + "<br />"
          // check the response, with locales handled
          if (ciEquals(removePunctuation(response.data.text), removePunctuation(this.statement))) {
            this.correct = true
            console.log('pronounciation correct')
            this.playSuccess()
            setTimeout(this.getStatement, 5000)
          }
          this.isSending = false
        }).catch(error => {
          console.error("Error sending audio to API:", error)
          this.isSending = false
        });
      }
    },
    getStatement() {
      this.console = "getting new statement to repeat..."
      this.busy = true
      return axios
          .post(this.$apiHost + '/api/gpt/statement/' + this.lang + '/' + this.baseLang,
              {seed: this.seed, seeds: this.seedNum})
          .then(res => {
            this.statement = res.data.statement
            this.translation = res.data.translation
            this.seeds = res.data.seeds
            this.console = this.statement + "<br />"
            this.prompt = ""
            this.busy = false
            console.log("seeds", this.seeds)
          }).catch(err => {
            // todo need to stop these errors from the api / and or put in a crash check
            console.log('error getting statement trying again', err)
            this.busy = false
            this.getStatement()
          })
    },
    getTranslation() {
      if (this.translation) {
        this.console += "(" + this.translation + ")<br />"
        this.translation = ""
      }
      this.textToSpeech(this.statement, this.lang)
    },
  },
  created: function () {
    const audio = new Audio('szary_success.mp3')
    audio.loop = false;
    this.audio = audio
    this.getStatement()
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