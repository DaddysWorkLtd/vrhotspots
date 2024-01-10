<template>
  <div class="container">
    <div class="row" @click="getTranslation()">
      Roleplay with...
    </div>
    <input type="text" v-model="who" class="text-center" @keydown.enter="startConversation"/>

    <div class="row">&nbsp;</div>
    <div class="console" v-html="console" @click="getTranslation()"></div>
    <div class="row">&nbsp;
    </div>
    <div class="row">
      <button style="color:darkred; border-color:darkred;" @click="startRecording"
              v-bind:class="{ 'flash': isRecording }">Speak
      </button>
      <button style="color:darkgreen; border-color:darkgreen" @click="sendReply"
              v-bind:class="{ 'flash': isSending }">Send
      </button>
      <span class="loading-spinner" v-show="busy" style="width: 25px"></span>
      <button style="color:darkorange; border-color:darkorange" @click="startConversation">Restart</button>
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
      who: "een matador",
      lang: "es",
      baselang: "nl",
      console: "",
      isSending: false,
      isRecording: false,
      busy: false
    }
  },
  methods: {
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
    },
    startConversation() {
      this.history = []
      this.console = ""
      this.sendPrompt("hello")
    },
    sendPrompt(message) {
      this.busy = true
      return axios
          .post(this.$apiHost + `/api/gpt/roleplay/${this.lang}/${this.baselang}`,
              {
                who: this.who,
                prompt: message,
                history: this.history
              })
          .then(res => {
            this.history.push({role: "user", content: message})
            this.history.push({role: "assistant", content: res.data.message})
            this.textToSpeech(res.data.message, res.data.message_lang)
            console.log(res)
            this.console += res.data.message + "<br />"
            this.busy = false
          })
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
    },
    sendReply() {
      if (this.mediaRecorder.state === 'recording' || this.isRecording) {
        // lets hope this is syncronous :)
        this.stopRecording()
        // its not so call back in abit
        setTimeout(this.sendReply, 25)
      } else {
        console.log('sending')
        this.isSending = true
        // so far my attempts to change the audio have failed and its webm
        const audioFile = new File([this.audioBlob], "recording.flac",
            {type: "audio/flac"})
        let formData = new FormData();
        formData.append("file", audioFile);
        formData.append('language', "nl-NL")
        this.busy = true
        axios({
              method: 'POST',
              url: this.$apiHost + "/api/transcribe",
              data: formData,
              headers: {"Content-Type": "multipart/form-data"},
            }
        ).then(response => {
          this.console += `(${response.data.text})<br />`
          this.isSending = false
          this.busy = false
          this.sendPrompt(response.data.text)
        }).catch(error => {
          console.error("Error sending audio to API:", error)
          this.isSending = false
          this.busy = false
        });
      }
    },
  },
  created: function () {
    this.startConversation()
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