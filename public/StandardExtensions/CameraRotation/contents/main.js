///////////////////////////////////////////////////////////////////////////////
// TurnTable extension illustrating camera rotation around the model
// by Denis Grigor, November 2018
//
///////////////////////////////////////////////////////////////////////////////

class TurnTableExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this.viewer = viewer;

        this.customize = this.customize.bind(this);
    }

    load() {
        console.log('TurnTableExtension is loaded!');
        this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT,
            this.customize);

        return true;
    }
    unload() {
        console.log('TurnTableExtension is now unloaded!');

        return true;
    }

    customize() {
        this.viewer.removeEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT,
            this.customize);

        //Start coding here ...

        let viewer = this.viewer;
        viewer.hide(370);

        let turnTableToolbarButton = new Autodesk.Viewing.UI.Button('turnTableButton');
        turnTableToolbarButton.addClass('toolbarCameraRotation');
        turnTableToolbarButton.setToolTip('Start/Stop Camera rotation');

        // SubToolbar
        this.subToolbar = new Autodesk.Viewing.UI.ControlGroup('CameraRotateToolbar');
        this.subToolbar.addControl(turnTableToolbarButton);
        this.viewer.toolbar.addControl(this.subToolbar);

        let started = false;

        let rotateCamera = () => {
            if (started) {
                requestAnimationFrame(rotateCamera);
            }

            const nav = viewer.navigation;
            const up = nav.getCameraUpVector();
            const axis = new THREE.Vector3(0, 0, 1);
            const speed = 10.0 * Math.PI / 180;
            const matrix = new THREE.Matrix4().makeRotationAxis(axis, speed * 0.1);

            let pos = nav.getPosition();
            pos.applyMatrix4(matrix);
            up.applyMatrix4(matrix);
            nav.setView(pos, new THREE.Vector3(0, 0, 0));
            nav.setCameraUpVector(up);
            var viewState = viewer.getState();
            // viewer.restoreState(viewState);

        };

        turnTableToolbarButton.onClick = function (e) {
            started = !started;
            if (started) rotateCamera()
        };

    }

}

Autodesk.Viewing.theExtensionManager.registerExtension('CameraRotation',
    TurnTableExtension);