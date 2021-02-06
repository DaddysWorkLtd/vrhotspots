var VRVOCAB = {
    modes: {
      "Play": {
        wordsPerRound: 1,
        clues: true,
        writeTarget: true,
        sayTarget: true,
        gameStats: true
      },
      "Learn": {
        wordsPerRound: 1,
        writeTarget: true,
        sayTarget: true,
        writeTarget: true,
        writeNewTarget: true,
        translateFusing: true
      },
      "Flashcard": { // should maybe give an english target?
        wordsPerRound: 0,
        sayCorrect: true},
      "Edit": {}
    }
    ,
  LANGUAGES: {
      nl: "Dutch",
    fr:"French",
    de:"German",
    it:"Italian",
    sp:"Spanish",
    sv:"Swedish"
  },
    utils: {
      // picks the next option in an array / if current not set then returns first, needs an array
      nextOption (options, current) {
        let currI = options.findIndex( (deze) => { return deze == current });
        if ( currI === options.length-1 ) currI = -1;
        return options[currI + 1];
      }
    },
    setWhiteboardText (state) {
      let wordStats=_.reduce(gState.getWordStats({gameMode: 'Play'}, {lang: state.lang}), (res, row) => {
        if (row.correct) {
          res.correct++;
          if (row.firstTime) res.firstTime++;
          res.attempts += row.attempts.length;
          res.incorrectAttempts += row.attempts.length - row.correct; // when incorrect we double report the word that was the guess
          res.elapsed += (row.elapsed || 0);
        }
        return res;
      }, {correct:0, attempts:0, firstTime:0, incorrectAttempts: 0, languages:[],elapsed: 0 } );
      let roomStats=_.reduce(state.photos, (res,row) => {
        res.stars += (row.stars || 0);
        if (row.enabled) res.enabled++;
        return res;
      }, {stars:0, enable:0});
      // languages
      state.whiteboardText = 'YOUR PROGRESS\n\nWords: ' + wordStats.correct;
      state.whiteboardText += '\nMastered: ' + wordStats.firstTime;
      state.whiteboardText += '\nPlay time: ' + gState.secShow(wordStats.elapsed/1000);
      if (wordStats.attempts) state.whiteboardText += '\nAccuracy: ' + Math.round((wordStats.attempts-wordStats.incorrectAttempts)*100/wordStats.attempts) + '%';
      state.whiteboardText += '\nStars: ' + roomStats.stars;
      state.whiteboardText += '\n\nKeep up the good work!';
    },
  refreshRooms(state) {
    // manuallly update rooms as not worked out how the bindings work
    _.forEach(document.getElementsByTagName('a-vocab-room'), vrRoom => {
      photo=_.find(state.photos,{id: vrRoom.getAttribute('photo-id')*1});
      vrRoom.setAttribute('name', photo.name);
      vrRoom.setAttribute('words', photo.words);
      vrRoom.setAttribute('found', photo.found);
      vrRoom.setAttribute('stars', photo.stars);
      vrRoom.setAttribute('enabled', (photo.enabled || state.gameMode === 'Edit'));
    });
  }
  },
  stateHandler = {
    nonBindedStateKeys: ['fbToken','scEl', 'uiText'],
    // Initial state of our application. We have the current environment and the active menu.
    initialState: {
      location: 'home',
      lang: 'nl',
      language: 'Dutch',
      gameMode: 'Play',
      wordsPerRound: 1,
      wordsPerGame: 15,
      attempt: 1,
      targetWords: [],
      hudTextTOP: '',
      hudTextBOT: '',
      hudTextMID: '',
      adminUser: false,
      fbUserId: '',
      fbToken: '',
      photos: {}, // this needs to computed for the player....
      homeFusable: 'fusable', // class to control fusing of home page objects,
      photoFusable: '',
      uiText: {welcome: 'Welcome to VR Vocab!\n\nThe goal in every room is to locate the requested items. Select an object by pointing the gaze cursor at an orange hotspot. Find all the items to unlock the next level....'},
      whiteBoardText: ''
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
          state.hudTextTOP = '';
          state.hudTextMID = '';
          state.hudTextBOT = '';

          // as this can get changed during game then reset it every time we leave a game
          gState.wordsPerGame = (state.wordsPerGame === 'Unlimited' ? 999: state.wordsPerGame);
          // update user games data
          state.photos=gState.getUserPhotoData();
          VRVOCAB.refreshRooms(state);
          VRVOCAB.setWhiteboardText(state);
          state.photos.__dirty=true;
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
          let options = ['Learn','Play','Flashcard'];
          // todo: hard coded admin user for now
          state.adminUser = true;
          if (state.adminUser) options.push('Edit');
          state.gameMode = VRVOCAB.utils.nextOption(options,state.gameMode);
          if (state.adminUser) VRVOCAB.refreshRooms(state); // admins can change room info in edit mode
          gState.gameMode = state.gameMode;
        },
        changeWordsPerGame: (state) => {
          const options = ['5','15','25',"Unlimited"]
          state.wordsPerGame = VRVOCAB.utils.nextOption(options,state.wordsPerGame);
          // temporary patch, unlimited = 999? What about on init?
          gState.wordsPerGame = (state.wordsPerGame === 'Unlimited' ? 999: state.wordsPerGame) ;
        },
        changeUser: (state) => {
          state.userName = (state.userName === "Paul Cook" ? 'Guest' : 'Paul Cook');
          state.adminUser = !state.adminUser;
        },
        changeLanguage: (state) => {
          state.lang = VRVOCAB.utils.nextOption(_.keys(VRVOCAB.LANGUAGES),state.lang);
          gState.lang = state.lang;
          state.photos=gState.getUserPhotoData();
          VRVOCAB.setWhiteboardText(state);
          // habing to manually refresh the rooms
          VRVOCAB.refreshRooms(state);
          state.photos.__dirty=true;
        },

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
          gState.lang = newState.lang;
          newState.photos=gState.getUserPhotoData();
          VRVOCAB.setWhiteboardText(newState);
          VRVOCAB.refreshRooms(newState); // because edit mode unlocks rooms
          newState.photos.__dirty=true;
        } else if (payload !== 'changeHudText') {
          const saveState = _.omit(newState,['location','sceneEl','uiText','homeFusable','targetWords','attempt','hudTextTOP', 'hudTextMID','hudTextBOT', 'photos']);
           gState.db.set('state',saveState).write();
        }
        newState.language=VRVOCAB.LANGUAGES[newState.lang];
        // need to trigger a refresh when language changes or when just played
      }

  }

// aframe-state-component definition.
AFRAME.registerState( stateHandler);

// where do I integrate with google translate - just in admin interface?
// need connection to store history
// can people play from local storage
// can you show / hide the enter VR button