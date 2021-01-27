//UI Code - AFRAME / UI handling
AFRAME.registerComponent('cursor-listen', {
  init: function () {
    // need a style that makes things appear and then fade out!
    this.el.addEventListener('raycaster-intersection-cleared', evt => {
      // chage for state experiment
      // clear ingo panel if it is not due to a spot being deleted where we set the sticky bottom flag
      if (!gState.stickyBot) {
        this.el.sceneEl.emit('changeHudText', {target: 'bot', text: ''});
      }
      gState.stickyBot = false;
    });
    this.el.addEventListener('fusing', evt => {
      // disable for home screen, target object listens
      const word = evt.detail.intersectedEl.getAttribute('word');
      // word implies this is fushing into a hotspot - could just check what location we are in
      if (word) this.el.sceneEl.emit('changeHudText', {
        target: 'bot',
        text: 'fusing: ' + evt.detail.intersectedEl.getAttribute('word')
      });
    });
    this.el.addEventListener('click', evt => {
      //_bot.setAttribute('text','value: click event' + evt.detail.intersectedEl.word);
      //console.log('click',evt.detail.intersectedEl.getAttribute('word'));
      // check if the word matches the target and if so delete
      // find word for this element gState.db
      // this should be a separate function so it can be tested
      const word = evt.detail.intersectedEl.getAttribute('word'),
        el = evt.detail.intersectedEl,
        fusedWord = gState.db
          .get('words')
          .value()[word];
      if (!fusedWord) {
        // checking word as getting called by homescreen
        if (word) this.el.sceneEl.emit('changeHudText', {
          target: 'bot',
          text: el.getAttribute('word') + ': not found in dictionary'
        });
      } else {
        if (gState.gameMode === 'Practice') {
          gState.word = fusedWord;
          gState.playWord(true);
          evt.detail.intersectedEl.remove();
          return;
        }
        if (fusedWord[gState.lang].word == gState.word[gState.lang].word) {
          //remove the element
          evt.detail.intersectedEl.remove();
          //TODOneed to log that it was answered correctly etc, trigger next word
          gState.correct(fusedWord[gState.lang].word);
          this.el.sceneEl.emit('wordCorrect', {word: fusedWord[gState.lang].word});
        } else {
          gState.incorrect(fusedWord[gState.lang].word);
        }
      }
    });
  }
});


// this was attached to the left control and deleted spots
AFRAME.registerComponent('rayleft-ctrl', {
  init: function () {
    this.el.addEventListener('gripdown', function (e) {
//            console.log('grip squeeze left',e)
      // the idea is right up left down but for not this is on the right controller
      gState.nextPhoto(-1);
    });
  }
});

AFRAME.registerComponent('rayright-ctl', {
  init:
    function () {
      //Declaration and initialization of flag
      //which exprains grip button is pressed or not.
      //"this.el" reffers ctlR or L in this function
      this.el.grip = false;
//            setHudText('bot', 'Use the keyboard on left controller to enter word, then enter...\n assigned with right trigger');
      // not sure why I need to do this??????? as without it i get a blank page
      //setHudText('top', 'Hello and welcome back');
      //Called when trigger is pressed
      this.el.addEventListener('triggerdown', function (e) {
        //"this" reffers ctlR or L in this function
        var point = document.querySelector('#rhPoint').object3D.getWorldPosition();
//                console.log('create spot', point);
        remoteSpotAdd(point);
      });

      //Grip Pressed
      this.el.addEventListener('gripdown', function (e) {
        console.log('grip squeeze right', e);
        // the idea is right up left down but for not this is on the right controller
        gState.nextPhoto();
        //Setting grip flag as true, this is for gripping to hold on to something
      });
      //Grip Released
      this.el.addEventListener('gripup', function (e) {
        //Setting grip flag as false.
        this.grip = false;
      });

      //Raycaster intersected with something.
      this.el.addEventListener('raycaster-intersection', function (e) {
        //Store first selected object as selectedObj
        //              console.log('intesection',e);
        // intersecting keyboard makes null appear!
        let word = e.detail.els[0].getAttribute('word') || '';
        setHudText('bot', word);
        // this.selectedObj = e.detail.els[0]; technically its intesected not selected
      });
      //Raycaster intersection is finished.
      this.el.addEventListener('raycaster-intersection-cleared', function (e) {

        //Clear information of selectedObj
        //this.selectedObj = null;
        setHudText('bot', '');
      });

      //A-buttorn Pressed
      this.el.addEventListener('abuttondown', function (e) {
        //Aqurire all ball entities which are instantiated in a-scene
        var els = document.querySelectorAll('.ball');
        //Destroy all ball entities
        for (var i = 0; i < els.length; i++) {
          els[i].parentNode.removeChild(els[i]);
        }
      });

      //X-buttorn Pressed
      this.el.addEventListener('xbuttondown', function (e) {
        //Start pointing position to teleport
        this.emit('teleportstart');
      });

      //X-buttorn Released
      this.el.addEventListener('xbuttonup', function (e) {
        //Jump to pointed position
        this.emit('teleportend');
      });

      //console.log(this);
    }
});
AFRAME.registerComponent('kb-ctrl', {
  init: function () {
    console.log('keyboard init', this);
    var el = this.el,
      hudInfo = document.querySelector('#hud-top'),
      debugInfo = document.querySelector('#hud-bot');
    el.addEventListener('superkeyboardchange', function (e) {
      // update the attribute on the keyboard as not sure how to get the value from the component.
      console.log('keypress');
      debugInfo.setAttribute('text', 'value: ' + e.detail.value);
      el.setAttribute('kbval', e.detail.value);
    });
    //return press set the hud top to the value for now
    this.el.addEventListener('superkeyboardinput', function (e) {
      console.log('keyboard enter', e);
      hudInfo.setAttribute('text', 'value: ' + e.detail.value);

    });
    //dismiss press
    this.el.addEventListener('superkeyboarddismiss', function (e) {
      console.log('superkeyboarddismiss', e);
    });
  }
});

// need the image, number of stars, text for box
AFRAME.registerComponent('vocab-room', {
    schema: {
      photoId: {type: 'number', default: 0},
      src: {type: 'string', default: '#nosrcsupplied'},
      enabled: {type: 'boolean', default: false},
      name: {type: 'string', default: 'BOX NAME'},
      words: {type: 'number', default: 0},
      found: {type: 'number', default: 0},
      stars: {type: 'number', default: 0},
    },
    init: function () {
      const data = this.data,
        el = this.el,
        pel = el.parentElement;

      el.id = 'photo' + data.photoId;
      // first the box
      el.setAttribute('render-order', 'object');
      el.setAttribute('look-at', '#boxfaces');
      el.setAttribute('geometry', 'primitve:box; width:1; height:1.3; depth:.5;');
      el.setAttribute('material', 'src:#cardboard; normal-map: #cardboard-NRM;');

      let sp = document.createElement("a-sphere");
      sp.setAttribute('render-order', 'object');
      sp.setAttribute('radius', .4)
      sp.setAttribute('position', '0 1 0');
      sp.setAttribute('material', 'src: ' + data.src + ' ;')
      el.appendChild(sp);

      //if enabled
      animation__enter = "property: rotation; from: 0 0 0; to: 0 360 0; dur: 15000; easing: linear; loop:false; autoplay: false; startEvents: mouseenter;"


      let tr = document.createElement('a-troika-text');
      tr.setAttribute('render-order', 'text');
      tr.setAttribute('position', '0 0 0.27');
      tr.setAttribute('font', 'assets/font-kit/Signika-Regular.ttf');
      tr.setAttribute('font-size', .1);
      tr.setAttribute('line-height', 1.1);
      tr.setAttribute('baseline', 'bottom');
      tr.setAttribute('align', 'center');
      tr.setAttribute('color', 'black');
      tr.setAttribute('value', data.name.toUpperCase() + '\n\n words: ' + data.words + '\nfound: ' + data.found);
      el.appendChild(tr);

      if (!data.enabled) {
        // another troika text element
        tr = document.createElement('a-troika-text');
        tr.setAttribute('render-order', 'text');
        tr.setAttribute('position', '0 0.2 0.3');
        tr.setAttribute('font', 'assets/font-kit/PermanentMarker-Regular.ttf');
        tr.setAttribute('font-size', .2);
        tr.setAttribute('rotation', '0 0 50');
        tr.setAttribute('color', 'white');
        tr.setAttribute('value', 'LOCKED');
        el.appendChild(tr);
      } else {
        // stars
        let stars = 0;
        _.forEach([-.285, .01, .29], (x) => {
          if (stars < data.stars) {
            let st = document.createElement('a-entity');
            st.setAttribute('position', x + ' -.82 .9');
            st.setAttribute('gltf-model', 'assets/star.glb');
            el.appendChild(st);
            stars += 1;
          }
        });
      }
      this.el.addEventListener('fusing', evt => {
        //scope?
        this.el.sceneEl.emit('changeHudText', {target: 'bot', text: 'fusing: ' + evt.target.getAttribute('name')}); // this.photo.name
      });
      this.el.addEventListener('click', evt => {
        // transition to 360photo
        this.el.sceneEl.emit('enterPhoto');
        gState.changePhoto(evt.target.getAttribute('photo-id'));
      });
      el.setAttribute('bind__class','homeFusable');
      sp.setAttribute('bind__class','homeFusable');
      // needed for the event handler to work... I supose I could put these in a closure
      sp.setAttribute('name', data.name);
      sp.setAttribute('photo-id', data.photoId);
    }
  }
);
AFRAME.registerPrimitive('a-vocab-room', {
  defaultComponents: {
    'vocab-room': {}
  },
  mappings: {
    'photo-id': 'vocab-room.photoId',
    'src': 'vocab-room.src',
    'enabled': 'vocab-room.enabled',
    'name': 'vocab-room.name',
    'words': 'vocab-room.words',
    'found': 'vocab-room.found',
    'stars': 'vocab-room.stars'
  }
});

function appendSpot(def) {
  var spot, scene;
  if (document.querySelector('#VRH' + def.id)) {
    // this could be due to socket reconnects refreshing data etc
    console.log('spot alreay appended', def);
  } else {
    spot = document.createElement('a-sphere');
    scene = document.querySelector('a-scene');
    //console.log(appendSpot, def, def.pos, def.word, def.id);
    spot.setAttribute('class', 'wordspot collidable fusable');
    spot.setAttribute('scale', '1 1 1');
    spot.setAttribute('opacity', 0.2);
    spot.setAttribute('color', 'darkorange');
    spot.setAttribute('emissive', 'darkorange');
    spot.setAttribute('position', def.pos);
    spot.setAttribute('word', def.word);
    // ids can't start with a number so namespave with VRS - vr spot
    spot.setAttribute('id', 'VRH' + def.id);
    //Instantiate ball entity in a-scene
    scene.appendChild(spot);
  }
}

function setPhoto(photo) {
  // could animate this for a smooth transition
  // we may need to use assets to stop weird 3js errors which leave a blank screen when not cached.
  document.querySelector('#sky').setAttribute('src', photo.src);
  // display the welcome (intro) message.
  if (photo.welcome) {
    setHudText('mid', photo.welcome);
  }
}

// could make objects for this and shoulp use a closure to keep the query selector

function setHudText(place, value) {
  // disabled for testing state binding
  document.getElementsByTagName('a-scene')[0].emit('changeHudText', {
    target: place,
    text: value,
    animate: place === 'mid'
  });
  return;
}

// set opacity to zero
function hideSpots() {
  [].forEach.call(document.querySelectorAll('.wordspot'), function (el) {
    el.setAttribute('opacity', 0);
  });
}

// set opacity to zero
function removeSpots() {
  [].forEach.call(document.querySelectorAll('.wordspot'), function (el) {
    el.remove();
  });
}