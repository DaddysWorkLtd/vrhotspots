var vrVocabConfig = {
    game: {
      "test": {
        WordsPerRound: 1,
        wordsPerGame: 15,
        clues: true,
        laserControls: false,
        sayCorrect: false,
        writeTarget: true,
        writeNewTarget: false,
      },
      "learn": {
        WordsPerRound: 1,
        wordsPerGame: false,
        writeTarget: true,
        writeNewTarget: true,
      },
      "practice": {
        WordsPerRound: 0,
        wordsPerGame: false,
        clues: true,
        laserControls: false,
        sayCorrect: true,
        writeTarget: false,
        sayTarget: false
      },

    }
  },
  stateHandler = {
    nonBindedStateKeys: ['fbToken','scEl', 'uiText'],
    // Initial state of our application. We have the current environment and the active menu.
    initialState: {
      location: 'home',
      lang: 'nl',
      gameMode: 'TEST',
      wordsPerRound: 1,
      wordsPerGame: 15,
      attempt: 1,
      targetWords: [],
      hudTextTOP: '',
      hudTextBOT: '',
      hudTextMID: '',
      editMode: false,
      adminUser: false,
      fbUserId: '',
      fbToken: '',
      userName: 'Guest',
      sceneEl: document.getElementsByTagName('a-scene')[0], // needs to be deferred
      homeFusable: 'fusable', // class to control fusing of home page objects
      uiText: {welcome: 'Welcome to VR Vocab!\n\nThe goal in every room is to find the items for the words given to you. Select an object by aiming the gaze cursor at an orange hotspot for a second. Find all the items to unlock the next level'}
    },


    // State changes are done via events and are handled here.
    handlers:
      {
        enterPhoto: (state) => {
          state.location = 'photo';
          state.homeFusable='';
          //maybe
          state.photoFusable='fusable';
        },
        selectSpot: (state) => {
          console.log('depends on game type');
        },
        // really for setting HUD text and playing animations (animate:true) prop
        changeHudText: (state,what) => {
          var _state = state;
          state['hudText' + what.target.toUpperCase()] = what.text;
          // play the animation for the middle one
          if (what.animate) {
            const target = document.querySelector('#hud-' + what.target.toLowerCase());
            if (target && target.components && target.components.animation) {
              // clear down the value
              setTimeout(function () {
                //target.setAttribute('text', 'value: ');
                //_this.state.changeHudText({target: what.target, text: ''});
                _state.sceneEl.emit('changeHudText',{target:what.target, text: what.text, animate:false});
              }, target.components.animation.data.dur);
              target.components.animation.beginAnimation();
            }
          }
        },
        wordCorrect: (state, word) => {
          console.log('hotpot answered correct but do we need the element?');
          state.hudTextTOP='Correct: ' + word.word;
        },
        changeMode: (state) => {
          state.gameMode = 'PRACTICE';
        },
        changeWordsPerGame: (state) => {
          state.wordsPerGame = "Unlimited";
        },
        changeUser: state => {
          state.userName = "how to log into facebook from vr";
        }
      }
  }

// aframe-state-component definition.
AFRAME.registerState( stateHandler);

// where do I integrate with google translate - just in admin interface?
// need connection to store history
// can people play from local storage
// can you show / hide the enter VR button