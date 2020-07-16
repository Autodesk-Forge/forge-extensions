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
const BoxDrawToolName = 'box-draw-tool';
const SphereDrawToolName = 'sphere-draw-tool';
const DrawToolOverlay = 'draw-tool-overlay';

// Simple viewer tool for drawing boxes and spheres
class DrawTool extends Autodesk.Viewing.ToolInterface {
    constructor() {
        super();

        // Hack: delete functions defined *on the instance* of the tool.
        // We want the tool controller to call our class methods instead.
        delete this.register;
        delete this.deregister;
        delete this.activate;
        delete this.deactivate;
        delete this.getPriority;
        delete this.handleMouseMove;
        delete this.handleButtonDown;
        delete this.handleButtonUp;
        delete this.handleSingleClick;

        this.state = ''; // '' (inactive), 'xy' (specifying extent in the XY plane), or 'z' (specifying height)
        this.names = [BoxDrawToolName, SphereDrawToolName];
    }

    register() {
        console.log('DrawTool registered.');
    }

    deregister() {
        console.log('DrawTool unregistered.');
    }

    activate(name, viewer) {
        this.viewer = viewer;
        this.state = '';
        this.mode = (name === BoxDrawToolName) ? 'box' : 'sphere';
        console.log('DrawTool', name, 'activated.');
    }

    deactivate(name) {
        this.viewer = null;
        this.state = '';
        console.log('DrawTool', name, 'deactivated.');
    }

    getPriority() {
        return 1; // Use any number higher than 0 (the priority of all default tools)
    }

    handleButtonDown(event, button) {
        // If left button is pressed and we're not drawing already
        if (button === 0 && this.state === '') {
            // Create new geometry and add it to an overlay
            if (this.mode === 'box') {
                const geometry = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(1, 1, 1));
                const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
                this.mesh = new THREE.Mesh(geometry, material);
            } else {
                const geometry = new THREE.BufferGeometry().fromGeometry(new THREE.SphereGeometry(0.5, 16, 16));
                const material = new THREE.MeshPhongMaterial({ color: 0x0000ff });
                this.mesh = new THREE.Mesh(geometry, material);
            }
            this.viewer.impl.addOverlay(DrawToolOverlay, this.mesh);

            // Initialize the 3 values that will control the geometry's size (1st corner in the XY plane, 2nd corner in the XY plane, and height)
            this.corner1 = this.corner2 = this._intersect(event.clientX, event.clientY);
            this.height = 0.1;
            this._update();
            this.state = 'xy'; // Now we're drawing in the XY plane
            return true; // Stop the event from going to other tools in the stack
        }
        // Otherwise let another tool handle the event, and make note that our tool is now bypassed
        this.bypassed = true;
        return false;
    }

    handleButtonUp(event, button) {
        // If left button is released and we're drawing in the XY plane
        if (button === 0 && this.state === 'xy') {
            // Update the 2nd corner in the XY plane and switch to the 'z' state
            this.corner2 = this._intersect(event.clientX, event.clientY);
            this._update();
            this.state = 'z';
            this.lastClientY = event.clientY; // Store the current mouse Y coordinate to compute height later on
            return true; // Stop the event from going to other tools in the stack
        }
        // Otherwise let another tool handle the event, and make note that our tool is no longer bypassed
        this.bypassed = false;
        return false;
    }

    handleMouseMove(event) {
        if (!this.bypassed && this.state === 'xy') {
            // If we're in the "XY plane drawing" state, and not bypassed by another tool
            this.corner2 = this._intersect(event.clientX, event.clientY);
            this._update();
            return true;
        } else if (!this.bypassed && this.state === 'z') {
            // If we're in the "height drawing" state, and not bypassed by another tool
            this.height = this.lastClientY - event.clientY;
            this._update();
            return true;
        }
        // Otherwise let another tool handle the event
        return false;
    }

    handleSingleClick(event, button) {
        // If left button is clicked and we're currently in the "height drawing" state
        if (button === 0 && this.state === 'z') {
            this.state = '';
            return true; // Stop the event from going to other tools in the stack
        }
        // Otherwise let another tool handle the event
        return false;
    }

    _intersect(clientX, clientY) {
        return this.viewer.impl.intersectGround(clientX, clientY);
    }

    _update() {
        const { corner1, corner2, height, mesh } = this;
        const minX = Math.min(corner1.x, corner2.x), maxX = Math.max(corner1.x, corner2.x);
        const minY = Math.min(corner1.y, corner2.y), maxY = Math.max(corner1.y, corner2.y);
        mesh.position.x = minX + 0.5 * (maxX - minX);
        mesh.position.y = minY + 0.5 * (maxY - minY);
        mesh.position.z = corner1.z + 0.5 * height;
        mesh.scale.x = maxX - minX;
        mesh.scale.y = maxY - minY;
        mesh.scale.z = height;
        this.viewer.impl.invalidate(true, true, true);
    }
}

class DrawToolExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this.tool = new DrawTool();
    }

    load() {
        this.viewer.toolController.registerTool(this.tool);
        this.viewer.impl.createOverlayScene(DrawToolOverlay);
        this._createUI();
        console.log('DrawToolExtension loaded.');
        return true;
    }

    unload() {
        this.viewer.toolController.deregisterTool(this.tool);
        this.viewer.impl.removeOverlayScene(DrawToolOverlay);
        this._removeUI();
        console.log('DrawToolExtension unloaded.');
        return true;
    }

    onToolbarCreated() {
        this._createUI();
    }

    _createUI() {
        const toolbar = this.viewer.toolbar;
        if (toolbar && !this.group) {
            const controller = this.viewer.toolController;
            this.button1 = new Autodesk.Viewing.UI.Button('box-draw-tool-button');
            this.button1.onClick = (ev) => {
                if (controller.isToolActivated(BoxDrawToolName)) {
                    controller.deactivateTool(BoxDrawToolName);
                    this.button1.setState(Autodesk.Viewing.UI.Button.State.INACTIVE);
                } else {
                    controller.deactivateTool(SphereDrawToolName);
                    controller.activateTool(BoxDrawToolName);
                    this.button2.setState(Autodesk.Viewing.UI.Button.State.INACTIVE);
                    this.button1.setState(Autodesk.Viewing.UI.Button.State.ACTIVE);
                }
            };
            this.button1.setToolTip('Box Draw Tool');

            this.button2 = new Autodesk.Viewing.UI.Button('sphere-draw-tool-button');
            this.button2.onClick = (ev) => {
                if (controller.isToolActivated(SphereDrawToolName)) {
                    controller.deactivateTool(SphereDrawToolName);
                    this.button2.setState(Autodesk.Viewing.UI.Button.State.INACTIVE);
                } else {
                    controller.deactivateTool(BoxDrawToolName);
                    controller.activateTool(SphereDrawToolName);
                    this.button1.setState(Autodesk.Viewing.UI.Button.State.INACTIVE);
                    this.button2.setState(Autodesk.Viewing.UI.Button.State.ACTIVE);
                }
            };
            this.button2.setToolTip('Sphere Draw Tool');

            this.group = new Autodesk.Viewing.UI.ControlGroup('draw-tool-group');
            this.group.addControl(this.button1);
            this.group.addControl(this.button2);
            toolbar.addControl(this.group);
        }
    }

    _removeUI() {
        if (this.group) {
            this.viewer.toolbar.removeControl(this.group);
            this.group = null;
        }
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('DrawToolExtension', DrawToolExtension);