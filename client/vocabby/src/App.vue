<template>
  <div id="nav">
    <router-link to="/">Translate</router-link>
    |
    <router-link to="/test">Test</router-link>
    |
    <router-link to="/writing">Writing</router-link>
    |
    <router-link to="/oral">Oral</router-link>
    |
    <router-link to="/dialogue">Dialogue</router-link>
    |
    <router-link to="/spelling">Spelling</router-link>
    |
    <router-link to="/chat">ChatGPT</router-link>
  </div>
  <router-view/>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}

.clickable {
  text-decoration: underline;
}

</style>
