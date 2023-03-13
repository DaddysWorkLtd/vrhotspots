<template>
  <div class="container">
    <div class="row">
      Oral
    </div>
    <div class="console" v-html="console"></div>
    <div>
      <a id="record" @click="startRecording()" v-bind:class="{ 'flash': isRecording }">Record</a> |
      <a id="stop" @click="stopRecording()">Stop</a> |
      <a id="play" @click="playRecording()">Play</a> |
      <a id="send" @click="sendRecording()" v-bind:class="{ 'flash': isSending }">Send</a>
    </div>
  </div>
</template>
<script>
import axios from "axios";

export default {
  name: "Chat",
  data() {
    return {
      prompt: "",
      chunks: [],
      mediaRecorder: null,
      console: "",
      audioUrl: "",
      audioBlob: 0,
      isRecording: false,
      isSending: false
    }
  },
  methods: {
    startRecording() {
      const _this = this
      navigator.mediaDevices.getUserMedia({audio: true})
          .then(stream => {
            _this.isRecording = true
            // reset old recording
            _this.chunks = []
            _this.mediaRecorder = new MediaRecorder(stream);
            // had to specify chunks as chrome was losing the last chunk, alway 0 size and only fired on stop
            _this.mediaRecorder.start(100);
            _this.mediaRecorder.addEventListener("dataavailable", event => {
              _this.chunks.push(event.data);
              console.log('audio captured')
            });
            console.log('recording')
          })
          .catch(err => alert(err))
    },
    stopRecording() {
      this.isRecording = false
      this.mediaRecorder.stop();
      this.audioBlob = new Blob(this.chunks, {type: "mp3"})//{type: "audio/ogg; codecs=opus"});
      this.audioUrl = URL.createObjectURL(this.audioBlob);
      this.playRecording()
    },
    playRecording() {
      const audio = new Audio(this.audioUrl);
      audio.addEventListener('ended', () => {
        console.log('ended')
      })
      audio.play();
    },
    sendRecording() {
      if (this.mediaRecorder.state === 'recording') {
        // lets hope this is syncronous :)
        this.stopRecording()
      }
      this.isSending = true
      const audioFile = new File([this.audioBlob], "recording.mp3",
          {type: "audio/mpeg"})
      let formData = new FormData();
      formData.append("file", audioFile);
      axios({
            method: 'POST',
            url: this.$apiHost + "/api/transcribe",
            data: formData,
            language: 'nl',
            headers: {"Content-Type": "multipart/form-data"},
          }
      ).then(response => {
        this.console += response.data.text + "<br />"
        this.isSending = false
      }).catch(error => {
        console.error("Error sending audio to API:", error)
        this.isSending = false
      });
    }
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

</style>