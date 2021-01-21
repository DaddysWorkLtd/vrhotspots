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
    nonBindedStateKeys: ['fbToken','scEl'],
    // Initial state of our application. We have the current environment and the active menu.
    initialState: {
      location: 'home',
      lang: 'nl',
      game: 'test',
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
      sceneEl: '',
      homeFusable: 'fusable'
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
          var _this = this;
          state['hudText' + what.target.toUpperCase()] = what.text;
          // play the animation for the middle one
          if (what.animate) {
            const target = document.querySelector('#hud-' + what.target.toLowerCase());
            if (target && target.components && target.components.animation) {
              // clear down the value
              setTimeout(function () {
                //target.setAttribute('text', 'value: ');
                //_this.state.changeHudText({target: what.target, text: ''});
                document.getElementsByTagName('a-scene')[0].emit('changeHudText',{target:what.target, text: what.text, animate:false});
              }, target.components.animation.data.dur);
              target.components.animation.beginAnimation();
            }
          }
        },
        wordCorrect: (state, word) => {
          console.log('hotpot answered correct but do we need the element?');
          state.hudTextTOP='Correct: ' + word.word;
        }
      }
  }

// aframe-state-component definition.
AFRAME.registerState( stateHandler);

