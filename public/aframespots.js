AFRAME.registerComponent('raylisten', {
    init: function () {
        var debugInfo=document.querySelector('#debuginfo');
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

function AppendSpot (point) {
    //Creating ball entity.
    var ball = document.createElement('a-sphere'),
        scene = document.querySelector('a-scene');;
    ball.setAttribute('class', 'hotspot');
    ball.setAttribute('class', 'collidable');
    ball.setAttribute('scale', '0.5 0.5 0.5');
    ball.setAttribute('opacity', 0.2);
    ball.setAttribute('color', '#c75252');
    ball.setAttribute('position', point);
    //Instantiate ball entity in a-scene
    scene.appendChild(ball);
}

AFRAME.registerComponent('input-listen', {
    init:
        function () {
            //Declaration and initialization of flag
            //which exprains grip button is pressed or not.
            //"this.el" reffers ctlR or L in this function
            this.el.grip = false;

            //Called when trigger is pressed
            this.el.addEventListener('triggerdown', function (e) {
                //"this" reffers ctlR or L in this function
                var point = document.querySelector('#spacecurs').object3D.getWorldPosition();


                console.log('create spot', point);
                RemoteSpotAdd({point : point});
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
                this.selectedObj = e.detail.els[0];
            });
            //Raycaster intersection is finished.
            this.el.addEventListener('raycaster-intersection-cleared', function (e) {
                //Clear information of selectedObj
                this.selectedObj = null;
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