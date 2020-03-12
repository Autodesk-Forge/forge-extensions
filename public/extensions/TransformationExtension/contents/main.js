/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////
// Transform Tool viewer extension
// by Philippe Leefsma, August 2015
//
///////////////////////////////////////////////////////////////////
AutodeskNamespace("Autodesk.ADN.Viewing.Extension");

Autodesk.ADN.Viewing.Extension.TransformTool =  function (viewer, options) {

    ///////////////////////////////////////////////////////////////////////////
    //
    //
    ///////////////////////////////////////////////////////////////////////////
    function TransformTool() {

        var _hitPoint = null;

        var _isDragging = false;

        var _transformMesh = null;

        var _modifiedFragIdMap = {};

        var _selectedFragProxyMap = {};

        var _transformControlTx = null;

        ///////////////////////////////////////////////////////////////////////////
        // Creates a dummy mesh to attach control to
        //
        ///////////////////////////////////////////////////////////////////////////
        function createTransformMesh() {

            var material = new THREE.MeshPhongMaterial(
                { color: 0xff0000 });

            viewer.impl.matman().addMaterial(
                guid(),
                material,
                true);

            var sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.0001, 5),
                material);

            sphere.position.set(0, 0, 0);

            return sphere;
        }

        ///////////////////////////////////////////////////////////////////////////
        // on translation change
        //
        ///////////////////////////////////////////////////////////////////////////
        function onTxChange() {

            for(var fragId in _selectedFragProxyMap) {

                var fragProxy = _selectedFragProxyMap[fragId];

                var position = new THREE.Vector3(
                    _transformMesh.position.x - fragProxy.offset.x,
                    _transformMesh.position.y - fragProxy.offset.y,
                    _transformMesh.position.z - fragProxy.offset.z);

                fragProxy.position = position;

                fragProxy.updateAnimTransform();
            }

            viewer.impl.sceneUpdated(true);
        }

        ///////////////////////////////////////////////////////////////////////////
        // on camera changed
        //
        ///////////////////////////////////////////////////////////////////////////
        function onCameraChanged() {

            _transformControlTx.update();
        }

        ///////////////////////////////////////////////////////////////////////////
        // item selected callback
        //
        ///////////////////////////////////////////////////////////////////////////
        function onItemSelected(event) {

            _selectedFragProxyMap = {};

            //component unselected

            if(!event.fragIdsArray.length) {

                _hitPoint = null;

                _transformControlTx.visible = false;

                _transformControlTx.removeEventListener(
                    'change', onTxChange);

                viewer.removeEventListener(
                    Autodesk.Viewing.CAMERA_CHANGE_EVENT,
                    onCameraChanged);

                return;
            }


            if(_hitPoint) {

                _transformControlTx.visible = true;

                _transformControlTx.setPosition(_hitPoint);

                _transformControlTx.addEventListener(
                    'change', onTxChange);

                viewer.addEventListener(
                    Autodesk.Viewing.CAMERA_CHANGE_EVENT,
                    onCameraChanged);

                event.fragIdsArray.forEach(function (fragId) {

                    var fragProxy = viewer.impl.getFragmentProxy(
                        viewer.model,
                        fragId);

                    fragProxy.getAnimTransform();

                    var offset = {

                        x: _hitPoint.x - fragProxy.position.x,
                        y: _hitPoint.y - fragProxy.position.y,
                        z: _hitPoint.z - fragProxy.position.z
                    };

                    fragProxy.offset = offset;

                    _selectedFragProxyMap[fragId] = fragProxy;

                    _modifiedFragIdMap[fragId] = {};
                });

                _hitPoint = null;
            }
            else {

                _transformControlTx.visible = false;
            }
        }

        ///////////////////////////////////////////////////////////////////////////
        // normalize screen coordinates
        //
        ///////////////////////////////////////////////////////////////////////////
        function normalize(screenPoint) {

            var viewport = viewer.navigation.getScreenViewport();

            var n = {
                x: (screenPoint.x - viewport.left) / viewport.width,
                y: (screenPoint.y - viewport.top) / viewport.height
            };

            return n;
        }

        ///////////////////////////////////////////////////////////////////////////
        // get 3d hit point on mesh
        //
        ///////////////////////////////////////////////////////////////////////////
        function getHitPoint(event) {

            var screenPoint = {
                x: event.clientX,
                y: event.clientY
            };

            var n = normalize(screenPoint);

            var hitPoint = viewer.utilities.getHitPoint(n.x, n.y);

            return hitPoint;
        }

        ///////////////////////////////////////////////////////////////////////////
        // returns all transformed meshes
        //
        ///////////////////////////////////////////////////////////////////////////
        this.getTransformMap = function() {

            var transformMap = {};

            for(var fragId in _modifiedFragIdMap){

                var fragProxy = viewer.impl.getFragmentProxy(
                    viewer.model,
                    fragId);

                fragProxy.getAnimTransform();

                transformMap[fragId] = {
                    position: fragProxy.position
                };

                fragProxy = null;
            }

            return transformMap;
        };

        ///////////////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////////////
        this.getNames = function() {

            return ['Dotty.Viewing.Tool.TransformTool'];
        };

        this.getName = function() {

            return 'Dotty.Viewing.Tool.TransformTool';
        };

        ///////////////////////////////////////////////////////////////////////////
        // activates tool
        //
        ///////////////////////////////////////////////////////////////////////////
        this.activate = function() {

            viewer.select([]);

            var bbox = viewer.model.getBoundingBox();

            viewer.impl.createOverlayScene(
                'Dotty.Viewing.Tool.TransformTool');

            _transformControlTx = new THREE.TransformControls(
                viewer.impl.camera,
                viewer.impl.canvas,
                "translate");

            _transformControlTx.setSize(
                bbox.getBoundingSphere().radius * 5);

            _transformControlTx.visible = false;

            viewer.impl.addOverlay(
                'Dotty.Viewing.Tool.TransformTool',
                _transformControlTx);

            _transformMesh = createTransformMesh();

            _transformControlTx.attach(_transformMesh);

            viewer.addEventListener(
                Autodesk.Viewing.SELECTION_CHANGED_EVENT,
                onItemSelected);
        };

        ///////////////////////////////////////////////////////////////////////////
        // deactivate tool
        //
        ///////////////////////////////////////////////////////////////////////////
        this.deactivate = function() {

            viewer.impl.removeOverlay(
                'Dotty.Viewing.Tool.TransformTool',
                _transformControlTx);

            _transformControlTx.removeEventListener(
                'change',
                onTxChange);

            _transformControlTx = null;

            viewer.impl.removeOverlayScene(
                'Dotty.Viewing.Tool.TransformTool');

            viewer.removeEventListener(
                Autodesk.Viewing.CAMERA_CHANGE_EVENT,
                onCameraChanged);

            viewer.removeEventListener(
                Autodesk.Viewing.SELECTION_CHANGED_EVENT,
                onItemSelected);
        };

        ///////////////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////////////
        this.update = function(t) {

            return false;
        };

        this.handleSingleClick = function(event, button) {


            return false;
        };

        this.handleDoubleClick = function(event, button) {

            return false;
        };


        this.handleSingleTap = function(event) {

            return false;
        };


        this.handleDoubleTap = function(event) {

            return false;
        };

        this.handleKeyDown = function(event, keyCode) {

            return false;
        };

        this.handleKeyUp = function(event, keyCode) {

            return false;
        };

        this.handleWheelInput = function(delta) {

            return false;
        };

        ///////////////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////////////
        this.handleButtonDown = function(event, button) {

            _hitPoint = getHitPoint(event);

            _isDragging = true;

            if (_transformControlTx.onPointerDown(event))
                return true;

            //return _transRotControl.onPointerDown(event);
            return false;
        };

        ///////////////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////////////
        this.handleButtonUp = function(event, button) {

            _isDragging = false;

            if (_transformControlTx.onPointerUp(event))
                return true;

            //return _transRotControl.onPointerUp(event);
            return false;
        };

        ///////////////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////////////
        this.handleMouseMove = function(event) {

            if (_isDragging) {

                if (_transformControlTx.onPointerMove(event) ) {

                    return true;
                }

                return false;
            }

            if (_transformControlTx.onPointerHover(event))
                return true;

            //return _transRotControl.onPointerHover(event);
            return false;
        };

        ///////////////////////////////////////////////////////////////////////////
        //
        //
        ///////////////////////////////////////////////////////////////////////////
        this.handleGesture = function(event) {

            return false;
        };

        this.handleBlur = function(event) {

            return false;
        };

        this.handleResize = function() {

        };
    }

    Autodesk.Viewing.Extension.call(this, viewer, options);

    var _self = this;

    _self.tool = null;

    _self.toolactivated = false;

    ///////////////////////////////////////////////////////
    // extension load callback
    //
    ///////////////////////////////////////////////////////
    _self.load = function () {
       
        console.log('Autodesk.ADN.Viewing.Extension.TransformTool loaded');

        return true;
    };

    _self.onToolbarCreated = function () {
        // Create a new toolbar group if it doesn't exist
        this._group = this.viewer.toolbar.getControl('transformExtensionsToolbar');
        if (!this._group) {
            this._group = new Autodesk.Viewing.UI.ControlGroup('transformExtensionsToolbar');
            this.viewer.toolbar.addControl(this._group);
        }

        // Add a new button to the toolbar group
        this._button = new Autodesk.Viewing.UI.Button('transformExtensionButton');
        this._button.onClick = (ev) => {
            // Execute an action here
            if (!_self.toolactivated) {
                _self.initialize();
                _self.toolactivated = true;
            } else {
                viewer.toolController.deactivateTool(_self.tool.getName());
                _self.toolactivated = false;
            }
        };
        this._button.setToolTip('Transform Extension');
        this._button.addClass('transformextensionicon');
        this._group.addControl(this._button);
    };

    _self.initialize = function () {
        _self.tool = new TransformTool();

        viewer.toolController.registerTool(_self.tool);

        if (this.viewer.model.getInstanceTree()) {
            _self.customize();
        } else {
            this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, _self.customize());
        }
    };

    _self.customize = function (){
        viewer.toolController.activateTool(_self.tool.getName());
    };

    ///////////////////////////////////////////////////////
    // extension unload callback
    //
    ///////////////////////////////////////////////////////
    _self.unload = function () {

        if(_self.tool) viewer.toolController.deactivateTool(_self.tool.getName());
        // Clean our UI elements if we added any
        if (this._group) {
            this._group.removeControl(this._button);
            if (this._group.getNumberOfControls() === 0) {
                this.viewer.toolbar.removeControl(this._group);
            }
        }
        console.log('Autodesk.ADN.Viewing.Extension.TransformTool unloaded');

        return true;
    };

    ///////////////////////////////////////////////////////
    // new random guid
    //
    ///////////////////////////////////////////////////////
    function guid() {

        var d = new Date().getTime();

        var guid = 'xxxx-xxxx-xxxx-xxxx-xxxx'.replace(
            /[xy]/g,
            function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
            });

        return guid;
    };
};

Autodesk.ADN.Viewing.Extension.TransformTool.prototype =
    Object.create(Autodesk.Viewing.Extension.prototype);

Autodesk.ADN.Viewing.Extension.TransformTool.prototype.constructor =
    Autodesk.ADN.Viewing.Extension.TransformTool;

Autodesk.Viewing.theExtensionManager.registerExtension(
    'TransformationExtension',
    Autodesk.ADN.Viewing.Extension.TransformTool);

