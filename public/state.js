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
    nonBindedStateKeys: ['fbToken','scEl', 'uiText','photos'],
    // Initial state of our application. We have the current environment and the active menu.
    initialState: {
      location: 'home',
      lang: 'nl',
      gameMode: 'Play',
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
      photos: gState.db.get('photos').value(), // this needs to computed for the player....
      homeFusable: 'fusable', // class to control fusing of home page objects,
      photoFusable: '',
      uiText: {welcome: 'Welcome to VR Vocab!\n\nThe goal in every room is to locate the requested items. Select an object by pointing the gaze cursor at an orange hotspot. Find all the items to unlock the next level....'}
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
        goHome: (state) => {
          // hide spots? could carry on
          removeSpots();
          state.location='home';
          state.homeFusable = 'fusable';
          state.photoFusable = '';
        },
        // really for setting HUD text and playing animations (animate:true) prop
        changeHudText: (state,what) => {
          state['hudText' + what.target.toUpperCase()] = what.text;
          // play the animation for the middle one
          if (what.animate) {
            const target = document.querySelector('#hud-' + what.target.toLowerCase());
            if (target && target.components && target.components.animation) {
              // clear down the value
              setTimeout(function () {
                //target.setAttribute('text', 'value: ');
                //_this.state.changeHudText({target: what.target, text: ''});
                document.getElementsByTagName('a-scene')[0].emit('changeHudText',{target:what.target, text: '', animate:false});
              }, target.components.animation.data.dur);
              target.components.animation.beginAnimation();
            }
          }
        },
        wordCorrect: (state, word) => {
          console.log('hotpot answered correct but do we need the element?');
          state.hudTextTOP = '';
//          state.hudText='Correct: ' + word.word;
        },
        changeMode: (state) => {
          let options = ['Learn','Play','Practice'];
          if (state.adminUser) options.push('Edit');
          state.gameMode = vrVocabConfig.utils.nextOption(options,state.gameMode);
          gState.gameMode = state.gameMode;
        },
        changeWordsPerGame: (state) => {
          const options = ['5','15','25',"Unlimited"]
          state.wordsPerGame = vrVocabConfig.utils.nextOption(options,state.wordsPerGame);
          // temporary patch, unlimited = 999? What about on init?
          gState.wordsPerGame = (state.wordsPerGame === 'Unlimited' ? 999: state.wordsPerGame) ;
        },
        changeUser: (state) => {
          state.userName = (state.userName === "Paul Cook" ? 'Guest' : 'Paul Cook');
          state.adminUser = !state.adminUser;
        }
      },
      // save state to local storage
      computeState: (newState,payload) => {
        var _newState = newState;
        // on init
        if (payload === '@@INIT') {
          // load old data.... todo: way of resetting ui!
          let oldState = gState.db.get('state').value();
          _.forEach(oldState, (value,key) => {
            _newState[key] = value;
          });
          gState.gameMode = newState.gameMode;
          gState.wordsPerGame = (newState.wordsPerGame === 'Unlimited' ? 999: newState.wordsPerGame) ;
        } else if (payload !== 'changeHudText') {
          const saveState = _.omit(newState,['location','sceneEl','uiText','homeFusable','targetWords','attempt','hudTextTOP', 'hudTextMID','hudTextBOT', 'photos']);
           gState.db.set('state',saveState).write();
        }
      }

  }

// aframe-state-component definition.
AFRAME.registerState( stateHandler);

// where do I integrate with google translate - just in admin interface?
// need connection to store history
// can people play from local storage
// can you show / hide the enter VR button