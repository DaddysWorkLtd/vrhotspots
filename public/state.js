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

      },
    utils: {
      // picks the next option in an array / if current not set then returns first, needs an array
      nextOption (options, current) {
        let currI = options.findIndex( (deze) => { return deze == current });
        if ( currI === options.length-1 ) currI = -1;
        return options[currI + 1];
      }
    }
  },
  stateHandler = {
    nonBindedStateKeys: ['fbToken','scEl', 'uiText'],
    // Initial state of our application. We have the current environment and the active menu.
    initialState: {
      location: 'home',
      lang: 'nl',
      gameMode: 'Testing',
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
      uiText: {welcome: 'Welcome to VR Vocab!\n\nThe goal in every room is to find the items requested. Select an object by pointing the gaze cursor at an orange hotspot. Find all the items to unlock the next level....'}
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
          let options = ['Learning','Testing','Practice'];
          if (state.adminUser) options.push('Editing');
          state.gameMode = vrVocabConfig.utils.nextOption(options,state.gameMode)
        },
        changeWordsPerGame: (state) => {
          const options = ['5','15','25',"Unlimited"]
          state.wordsPerGame = vrVocabConfig.utils.nextOption(options,state.wordsPerGame);
        },
        changeUser: (state) => {
          state.userName = "Paul Cook";
          state.adminUser = true;
        }
      },
      // save state to local storage
      computeState: (newState,payload) => {
        var _newState = newState;
        if (payload === '@@INIT') {
          let oldState = gState.db.get('state').value();
          _.forEach(oldState, (value,key) => {
            _newState[key] = value;
          });
          // need to set home or not set it - location in app needs to reset
        } else if (payload !== 'changeHudText') {
          const saveState = _.omit(newState,['location','sceneEl','uiText','homeFusable','targetWords','attempt']);
           gState.db.set('state',saveState).write();
           console.log('computeState', newState, payload,saveState);
        }
      }
  }

// aframe-state-component definition.
AFRAME.registerState( stateHandler);

// where do I integrate with google translate - just in admin interface?
// need connection to store history
// can people play from local storage
// can you show / hide the enter VR button