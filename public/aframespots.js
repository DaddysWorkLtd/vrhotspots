//UI Code - AFRAME / UI handling
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
            setHudText('bot', 'Use the keyboard on left controller to enter word, then enter...\n assigned with right trigger');
            //Called when trigger is pressed
            this.el.addEventListener('triggerdown', function (e) {
                //"this" reffers ctlR or L in this function
                var point = document.querySelector('#rhPoint').object3D.getWorldPosition();
                console.log('create spot', point);
                remoteSpotAdd(point);
            });

            //Grip Pressed
            this.el.addEventListener('gripdown', function (e) {
                //Setting grip flag as true.
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


// APPLICATION AFRAME MANIPULATION
function appendSpot (def) {
    //Creating ball entity.
    var spot = document.createElement('a-sphere'),
        scene = document.querySelector('a-scene');
    console.log (appendSpot,def,def.pos,def.word,def.id);
    spot.setAttribute('class', 'wordspot');
    spot.setAttribute('class', 'collidable');
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
function setPhoto (src) {
    // could animate this for a smooth transition
    // need to
    document.querySelector('#sky').setAttribute('src',src);
}
// could make objects for this and shoulp use a closure to keep the query selector
function setHudText(place,value){
    var target=document.querySelector('#hud-'+place);
    target.setAttribute('text', 'value: ' + value);
}