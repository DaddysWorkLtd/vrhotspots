<template>
  <div class="container">
    <div class="row">
      Oral
    </div>
    <div v-html="console"></div>
    <div>
      <a id="record" @click="startRecording()">Record</a> |
      <a id="stop" @click="stopRecording()">Stop</a> |
      <a id="play" @click="playRecording()">Play</a> |
      <a id="send" @click="sendRecording()">Send</a>
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
      console: "Record the phrase, send when happy...",
      audioUrl: "",
      audioBlob: 0
    }
  },
  methods: {
    startRecording() {
      const _this = this
      navigator.mediaDevices.getUserMedia({audio: true})
          .then(stream => {
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
        console.log(response.data.text)
      })
          .catch(error => {
            console.error("Error sending audio to API:", error)
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

.chatbox {
  width: 90%;
}

</style>