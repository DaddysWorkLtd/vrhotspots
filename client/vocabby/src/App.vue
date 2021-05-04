<template>
  <div id="app">
    <h1>Vocab.ly</h1>
    <Translator />
  </div>
</template>

<script>
import Translator from './components/Translator.vue'


export default {
  name: 'app',
  components: {
    Translator
  }
}
</script>

<style>
html,body { height:100%; }
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: left;
  color: #2c3e50;
  margin-top: 60px;
}

</style>