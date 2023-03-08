<template>
  <div class="container">
    <div class="row">
      Chat example
    </div>
    <div v-html="console"></div>
    <div>
    <textarea class="chatbox" ref="chatbox" @keydown.enter="sendPrompt" v-model="prompt"></textarea>
    </div>
   </div>
</template>
<script>
import axios from "axios";

export default {
  name: "Chat",
  data() {
    return {
      prompt:"",
      console:"Hello, type message and press enter to send...",
    }
  },
  methods: {
    sendPrompt() {
      const _chatbox = this.$refs.chatbox
      _chatbox.blur()
      return axios
          .post(this.$apiHost + '/api/gpt/chat/',{prompt:this.prompt})
          .then(res => {
            this.console += "<br /> >>" + this.prompt
            this.prompt = ""
            console.log(res.data)
            // should check there is no code in the returned text to guard
            // against injection attacks
            this.console += "<br />" + res.data.choices[0].message.content
            _chatbox.focus()
          })
    },
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

.chatbox {
  width: 90%;
}

</style>