//UI Code - AFRAME / UI handling
AFRAME.registerComponent('cursor-listen', {
    init: function () {
        //outputting debug info to bottom panel
        const _top=document.querySelector('#hud-top'),
            _mid=document.querySelector('#hud-mid'),
            _bot=document.querySelector('#hud-bot');
        console.log('initialising curor-listen',this);
       // need a style that makes things appear and then fade out!
        this.el.addEventListener('raycaster-intersection-cleared', evt => {
            // clear ingo panel if it is not due to a spot being deleted where we set the sticky bottom flag
            if (!gState.stickyBot) {
                _bot.setAttribute('text', 'value: ');
            }
            gState.stickyBot = false;
        });
        this.el.addEventListener('fusing', evt => {
            // disable for home screen, target object listens
            const word = evt.detail.intersectedEl.getAttribute('word');
            if (word) _bot.setAttribute('text','value: fusing: ' + evt.detail.intersectedEl.getAttribute('word'));
 //           console.log('click',evt);
        });
        this.el.addEventListener('click', evt => {
            //_bot.setAttribute('text','value: click event' + evt.detail.intersectedEl.word);
            //console.log('click',evt.detail.intersectedEl.getAttribute('word'));
            // check if the word matches the target and if so delete
            // find word for this element gState.db
            // this should be a separate function so it can be tested
            const word = evt.detail.intersectedEl.getAttribute('word'),
                el=evt.detail.intersectedEl,
                fusedWord = gState.db
                    .get('words')
                    .value()[word];
            if (!fusedWord) {
                // checking word as getting called by homescreen
                if (word) setHudText('bot',el.getAttribute('word') + ': not found in dictionary');
            } else {
                if (fusedWord[gState.lang].word == gState.word[gState.lang].word) {
                    evt.detail.intersectedEl.remove();
                    //TODOneed to log that it was answered correctly etc, trigger next word
                    gState.correct( fusedWord[gState.lang].word );
                } else {
                    gState.incorrect( fusedWord[gState.lang].word );
                }
            }
        });
    }
});



// this was attached to the left control and deleted spots
AFRAME.registerComponent('raylisten', {
    init: function () {
        //outputting debug info to bottom panel
        var debugInfo=document.querySelector('#hud-bot');
        console.log('initialise raycaster listen',this);
        debugInfo.setAttribute('text','value: initialising raycaster-listen');
        // Use events to figure out what raycaster is listening so we don't have to
        this.el.addEventListener('triggerdown', function (e) {
            console.log('triggerdown',e)
            debugInfo.setAttribute('text','value: trigger down - ' + e.target.id);
            console.log('trigger down');
            var ray = this.getAttribute("raycaster").direction;
            //setting tip of raycaster as 1.1m forward of controller.
            var p = new THREE.Vector3(ray.x, ray.y, ray.z);
            p.normalize();
            p.multiplyScalar(1.2);
            //Convert local position into world coordinate.
        });

        this.el.addEventListener('gripdown', function (e) {
            console.log('grip squeeze',e)
            // the idea is right up left down but for not this is on the right controller
            gState.nextPhoto(-1);
        });
        this.el.addEventListener('raycaster-intersection', evt => {
            this.raycaster = evt.detail.el;
            debugInfo.setAttribute('text','value:intersection');
            console.log('intersected',evt,evt.detail.els[0]);
            console.log('intersection object',evt.detail.intersections[0])
            //remove with left controller
            evt.detail.els[0].remove();
        });
        this.el.addEventListener('raycaster-intersection-cleared', evt => {
            this.raycaster = null;
            debugInfo.setAttribute('text','value: ');
        });

    }
});

AFRAME.registerComponent('input-listen', {
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
                console.log('create spot', point);
                remoteSpotAdd(point);
            });

            //Grip Pressed
            this.el.addEventListener('gripdown', function (e) {
                console.log('grip squeeze',e.id)
                // the idea is right up left down but for not this is on the right controller
                gState.nextPhoto();
                //Setting grip flag as true, this is for gripping to hold on to something
                this.grip = true;
            });
            //Grip Released
            this.el.addEventListener('gripup', function (e) {
                //Setting grip flag as false.
                this.grip = false;
            });

            //Raycaster intersected with something.
            this.el.addEventListener('raycaster-intersection', function (e) {
                //Store first selected object as selectedObj
                console.log('intesection',e);
                // intersecting keyboard makes null appear!
                let word = e.detail.els[0].getAttribute('word') || '';
                setHudText('bot',word);
                // this.selectedObj = e.detail.els[0]; technically its intesected not selected
            });
            //Raycaster intersection is finished.
            this.el.addEventListener('raycaster-intersection-cleared', function (e) {

                //Clear information of selectedObj
                //this.selectedObj = null;
                setHudText('bot','');
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
        },

    //called evry frame.
    tick: function () {

        if (!this.el.selectedObj) { return; }
        if (!this.el.grip) { return; }

        //Getting raycaster component which is attatched to ctlR or L
        //this.el means entity of ctlR or L in this function.
        var ray = this.el.getAttribute("raycaster").direction;
        //setting tip of raycaster as 1.1m forward of controller.
        var p = new THREE.Vector3(ray.x, ray.y, ray.z);
        p.normalize();
        p.multiplyScalar(1.2);
        //Convert local position into world coordinate.
        this.el.object3D.localToWorld(p);
        //Move selected object to follow the tip of raycaster.
        this.el.selectedObj.object3D.position.set(p.x, p.y, p.z);
    }
});
AFRAME.registerComponent('kb-ctrl', {
    init: function() {
        console.log('keyboard init', this);
        var el = this.el,
            hudInfo=document.querySelector('#hud-top'),
            debugInfo=document.querySelector('#hud-bot');

        /* set a custom filter example which doesn't seem to be working for me!
        const kb = this.el.components['super-keyboard'];
        kb.setCustomFilter(function(str) {
            return '*'.repeat(str.length);
        });
         */
        el.addEventListener('superkeyboardchange', function(e) {
            // update the attribute on the keyboard as not sure how to get the value from the component.
            console.log('keypress');
            debugInfo.setAttribute('text','value: ' + e.detail.value);
            el.setAttribute('kbval',e.detail.value);
        });
        //return press set the hud top to the value for now
        this.el.addEventListener('superkeyboardinput', function(e) {
            console.log('keyboard enter', e);
            hudInfo.setAttribute('text','value: ' + e.detail.value);

        });
        //dismiss press
        this.el.addEventListener('superkeyboarddismiss', function(e) {
            console.log('superkeyboarddismiss', e);
        });
    }
});
// just hard coded to the home office
AFRAME.registerComponent('vocab-room', {
    init: function() {
        this.el.addEventListener('fusing', evt => {
            setHudText('bot','fusing: Home Office');
        });
        this.el.addEventListener('click', evt => {
            // transition to 360photo
            document.getElementById('environment').setAttribute('environment', 'active', false);
            _.forEach(document.querySelectorAll('.homeScene'),function (el) {
                el.setAttribute('visible',false);
            });
            // hard coded to photoid 1
            gState.changePhoto(1);
        });

    }
} );

// APPLICATION AFRAME MANIPULATION
function appendSpot (def) {
    //NEED TO CHECK IT DOES NOT ALREADY EXIST
    var spot,scene;
    if ( document.querySelector('#VRH' + def.id) ) {
        console.log('spot alreay appended', def);
    } else {
        spot = document.createElement('a-sphere');
        scene = document.querySelector('a-scene');
        //console.log(appendSpot, def, def.pos, def.word, def.id);
        spot.setAttribute('class', 'wordspot collidable fusable');
        spot.setAttribute('scale', '1 1 1');
        spot.setAttribute('opacity', 0.2);
        spot.setAttribute('color', 'darkorange');
        spot.setAttribute('position', def.pos);
        spot.setAttribute('word', def.word);
        // ids can't start with a number so namespave with VRS - vr spot
        spot.setAttribute('id', 'VRH' + def.id);
        //Instantiate ball entity in a-scene
        scene.appendChild(spot);
    }
}
function setPhoto (photo) {
    // could animate this for a smooth transition
    // we may need to use assets to stop weird 3js errors which leave a blank screen when not cached.
    document.querySelector('#sky').setAttribute('src',photo.src);
    // display the welcome (intro) message.
    if (photo.welcome) {
        setHudText('mid',photo.welcome);
    }
}
// could make objects for this and shoulp use a closure to keep the query selector

function setHudText(place,value){
    var target=document.querySelector('#hud-'+place);
    target.setAttribute('text', 'value: ' + value);
    // if there is an animation then trigger it. Note that this is limited to one item, to support multiple
    // items search the components for anything that starts with animation.
    if ( target.components && target.components.animation) {
        setTimeout(function () {
            target.setAttribute('text', 'value: ');
            // hack mc hackface - repeat current word
            gState.playWord();
        }, target.components.animation.data.dur);

        target.components.animation.beginAnimation();
        // reser the text once animation ends or it ghosts

    }
}

// set opacity to zero
function hideSpots () {
    [].forEach.call(document.querySelectorAll('.wordspot'), function (el) {
        el.setAttribute('opacity',0);
    });
}
// set opacity to zero
function removeSpots () {
    [].forEach.call(document.querySelectorAll('.wordspot'), function (el) {
        el.remove();
    });
}