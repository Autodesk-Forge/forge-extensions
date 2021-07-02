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

class AecGrid {
    constructor(viewer, options) {
        this.viewer = viewer;
        this.modelBuilder = null;
        this.idPrefix = 100;

        this.options = options || {};
    }

    async init() {
        const modelBuilderExt = await this.viewer.loadExtension('Autodesk.Viewing.SceneBuilder');
        const modelBuilder = await modelBuilderExt.addNewModel({
            conserveMemory: false,
            modelNameOverride: 'Grids'
        });

        this.modelBuilder = modelBuilder;

        const matName = 'grid-line-mat';
        const linesMaterial = new THREE.LineBasicMaterial({
            color: 0xff0000,
            linewidth: 2
        });
        this.modelBuilder.addMaterial(matName, linesMaterial);
        this.linesMaterial = this.modelBuilder.findMaterial(matName);
    }

    createLabel(params) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 256;
        canvas.width = canvas.height = size;

        // draw/fill the circle
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, 2 * Math.PI);
        ctx.fillStyle = 'yellow';
        ctx.fill();

        // draw the number
        const fontSize = size / 2;
        ctx.fillStyle = 'black';
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(params.text, canvas.width / 2, canvas.height / 2);
        const labelBlobUrl = canvas.toDataURL();

        const image = new Image();
        const texture = new THREE.Texture();

        texture.image = image;
        image.src = labelBlobUrl;
        image.onload = function () {
            texture.needsUpdate = true;
        };

        const labelDbId = this.idPrefix++;
        const matName = `label-mat-${labelDbId}`;
        const material = new THREE.MeshPhongMaterial({ map: texture, side: THREE.DoubleSide, opacity: 0.8, transparent: true });
        this.modelBuilder.addMaterial(matName, material);
        const labelMat = this.modelBuilder.findMaterial(matName);

        const circleGeo = new THREE.BufferGeometry().fromGeometry(new THREE.CircleGeometry(3, 32));
        const circle = new THREE.Mesh(circleGeo, labelMat);

        circle.matrix = new THREE.Matrix4().compose(
            params.circlePos,
            new THREE.Quaternion(0, 0, 0, 1),
            new THREE.Vector3(1, 1, 1)
        );
        circle.dbId = labelDbId;
        this.modelBuilder.addMesh(circle);
    }

    createGrid(grid) {
        //draw each segment one by one
        const segments = grid.segments;
        const offsetMatrix = this.viewer.model.getModelToViewerTransform() || new THREE.Matrix4().identity();

        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            //start and end point
            const { start, end } = seg.points;
            const startPoint = new THREE.Vector3(start[0], start[1], start[2]).applyMatrix4(offsetMatrix);
            const endPoint = new THREE.Vector3(end[0], end[1], end[2]).applyMatrix4(offsetMatrix);

            if (this.options.hasOwnProperty('heightOverride') && !isNaN(this.options.heightOverride)) {
                startPoint.setZ(this.options.heightOverride);
                endPoint.setZ(this.options.heightOverride);
            }

            //grid line
            const lineGeo = new THREE.BufferGeometry();

            const lineIndices = [];
            const lineVertices = [];
            lineVertices.push(...startPoint.toArray());
            lineVertices.push(...endPoint.toArray());
            lineIndices.push(0, 1);

            lineGeo.addAttribute('index', new THREE.BufferAttribute(new Uint32Array(lineIndices), 1));
            lineGeo.addAttribute('position', new THREE.BufferAttribute(new Float32Array(lineVertices), 3));
            lineGeo.isLines = true;

            var line = new THREE.Mesh(lineGeo, this.linesMaterial);
            line.dbId = this.idPrefix++;
            this.modelBuilder.addMesh(line);

            let lineDir = endPoint.clone().sub(startPoint.clone()).normalize();
            let circlePos = endPoint.clone().add(lineDir.clone().multiplyScalar(3));

            this.createLabel({
                circlePos,
                text: grid.label
            });
        }
    }

    async build() {
        await this.init();

        let aecdata = this.viewer.model.getDocumentNode().getAecModelData();
        if (!aecdata) {
            aecdata = await Autodesk.Viewing.Document.getAecModelData(this.viewer.model.getDocumentNode());
            if (!aecdata)
                throw new Error('AEC model data not found');
        }

        const grids = aecdata.grids;

        if (!grids || grids.length <= 0)
            throw new Error('No Grid data found in this model\'s AEC model data.');

        for (let i = 0; i < grids.length; i++) {
            const grid = grids[i];
            this.createGrid(grid);
        }

        return true;
    }

    destroy() {
        this.viewer.impl.unloadModel(this.modelBuilder.model);

        delete this.linesMaterial;
        this.linesMaterial = null;

        return true;
    }

    lockSelection() {
        const dbIds = this.modelBuilder.model.getFragmentList().fragments.fragId2dbId;
        const model = this.modelBuilder.model;
        this.viewer.lockSelection(dbIds, true, model);
    }

    unlockSelection() {
        const dbIds = this.modelBuilder.model.getFragmentList().fragments.fragId2dbId;
        const model = this.modelBuilder.model;
        this.viewer.unlockSelection(dbIds, model);
    }
}

const AEC_GRIDS_CHANGED_EVENT = 'aecGridsChangedEvent';

class AecGridsPanel extends Autodesk.Viewing.UI.DockingPanel {
    constructor(viewer) {
        const options = {};

        //  Height adjustment for scroll container, offset to height of the title bar and footer by default.
        if (!options.heightAdjustment)
            options.heightAdjustment = 70;

        if (!options.marginTop)
            options.marginTop = 0;

        //options.addFooter = false;

        super(viewer.container, viewer.container.id + 'AecGridsPanel', 'Grids', options);

        this.container.classList.add('fpd-docking-panel');
        this.container.classList.add('fpd-aec-grids-panel');
        this.createScrollContainer(options);

        this.viewer = viewer;
        this.options = options;
        this.uiCreated = false;

        this.addVisibilityListener((show) => {
            if (!show) return;

            if (!this.uiCreated)
                this.createUI();
        });
    }

    get levelSelector() {
        const levelExt = this.viewer.getExtension('Autodesk.AEC.LevelsExtension');
        return levelExt && levelExt.floorSelector;
    }

    uninitialize() {
        super.uninitialize();
    }

    createUI() {
        this.uiCreated = true;

        const div = document.createElement('div');

        const treeDiv = document.createElement('div');
        div.appendChild(treeDiv);
        this.treeContainer = treeDiv;
        this.scrollContainer.appendChild(div);

        this.buildTree(this.levelSelector.floorData);
    }

    findLevelByName(name) {
        const levelData = this.levelSelector.floorData;
        return levelData.find(level => level.name.includes(name));
    }

    hoverLevelByName(name) {
        const level = this.findLevelByName(name);
        let levelIdx = level ? level.index : null;
        if (levelIdx === this.levelSelector.currentFloor) {
            levelIdx = Autodesk.AEC.FloorSelector.AllFloors;
        }

        this.levelSelector.rollOverFloor(levelIdx);
    }

    dehoverLevel() {
        //this.levelSelector.rollOverFloor(Autodesk.AEC.FloorSelector.NoFloor);
        this.levelSelector.rollOverFloor();
        this.viewer.impl.invalidate(false, true, true);
    }

    buildTree(data) {
        const nodes = [];

        for (let i = 0; i < data.length; i++) {
            const node = {
                id: data[i].index,
                type: 'levels',
                text: data[i].name
            }
            nodes.push(node);
        }

        console.log(nodes);

        $(this.treeContainer)
            .jstree({
                core: {
                    data: nodes,
                    multiple: true,
                    themes: {
                        icons: false,
                        name: 'default-dark'
                    }
                },
                sort: function (a, b) {
                    const a1 = this.get_node(a);
                    const b1 = this.get_node(b);
                    return (a1.text > b1.text) ? 1 : -1;
                },
                checkbox: {
                    keep_selected_style: false,
                    //three_state: false,
                    deselect_all: true,
                    cascade: 'none'
                },
                types: {
                    levels: {},
                    sheets: {}
                },
                plugins: ['types', 'checkbox', 'sort', 'wholerow'],
            })
            .on('open_node.jstree', (e, data) => {
                const node = data.instance.get_node(data.node, true);
                if (!node) {
                    return;
                }

                node.siblings('.jstree-open').each(function () {
                    data.instance.close_node(this, 0);
                });
            })
            .on('hover_node.jstree', async (e, data) => {
                let level = null;
                if (data.node.type === 'levels') {
                    level = data.node.text;
                } else {
                    level = data.instance.get_node(data.node.parent)?.text;
                }

                this.hoverLevelByName(level);
            })
            .on('dehover_node.jstree', async (e, data) => {
                this.dehoverLevel();
            })
            .on('changed.jstree', async (e, data) => {
                // console.log(e, data);
                if (!data.node || !data.node.type) {
                    return;
                }

                if (data.action === 'select_node') {
                    if (data.node.type === 'levels') {
                        const level = data.node.text;
                        this.viewer.dispatchEvent({
                            type: AEC_GRIDS_CHANGED_EVENT,
                            action: 'attach',
                            level: this.findLevelByName(level)
                        });
                    }
                } else {
                    if (data.node.type === 'levels') {
                        const level = data.node.text;
                        this.viewer.dispatchEvent({
                            type: AEC_GRIDS_CHANGED_EVENT,
                            action: 'detach',
                            level: this.findLevelByName(level)
                        });
                    }
                }
            });
    }
}

/**
 * A Forge Viewer extension for loading and rendering Revit Grids by AEC Model Data
 * @class
 */
class AecGridsExtension extends Autodesk.Viewing.Extension {
    /**
     * @param {Viewer3D} viewer The Forge Viewer instance
     * @param {Object} options The extension options
     * @param {function} [options.onFailureCallback=(error, errorMessage) => { console.warn(`[${error.name}]: ${error.message}`); }] A failure callback that will be called when this model doesn't have AEC Model Data or grids data. By default, it will show warning message in the console.
     * @param {boolean} [options.autoUnloadOnNoAecModelData=true] If false, AecGridsExtension won't be unloaded when this model doesn't have AEC Model Data or grids data.
     * @param {boolean} [options.alertOnDefaultFailure=false] When the {options.onFailureCallback} is using the default one, this option can be used to control if viewer will show error messages with alert().
     */
    constructor(viewer, options) {
        options = options || {};

        if (!options.onFailureCallback || (typeof options.onFailureCallback !== 'function')) {
            options.onFailureCallback = (error) => {
                let msg = `[${error.name}]: ${error.message}`;
                console.warn(msg);

                if (options.alertOnDefaultFailure == true)
                    alert(msg);
            };
        }

        super(viewer, options);

        this.grids = [];
        this.uiCreated = false;
        this.panel = null;

        this.createUI = this.createUI.bind(this);
        this.onToolbarCreated = this.onToolbarCreated.bind(this);
        this.onGridChanged = this.onGridChanged.bind(this);
    }

    createUI() {
        this.uiCreated = true;

        const viewer = this.viewer;

        const aecGridsPanel = new AecGridsPanel(viewer);
        viewer.addPanel(aecGridsPanel);
        this.panel = aecGridsPanel;

        const aecGridsToolButton = new Autodesk.Viewing.UI.Button('toolbar-aecGridsTool');
        aecGridsToolButton.setToolTip('Grids');
        aecGridsToolButton.setIcon('adsk-icon-documentModels');
        aecGridsToolButton.onClick = function () {
            aecGridsPanel.setVisible(!aecGridsPanel.isVisible());
        };

        const subToolbar = new Autodesk.Viewing.UI.ControlGroup('toolbar-fpd-tools');
        subToolbar.addControl(aecGridsToolButton);
        subToolbar.aecGridsToolButton = aecGridsToolButton;
        this.subToolbar = subToolbar;

        viewer.toolbar.addControl(this.subToolbar);

        aecGridsPanel.addVisibilityListener(function (visible) {
            if (visible)
                viewer.onPanelVisible(aecGridsPanel, viewer);

            aecGridsToolButton.setState(visible ? Autodesk.Viewing.UI.Button.State.ACTIVE : Autodesk.Viewing.UI.Button.State.INACTIVE);
        });
    }

    onToolbarCreated() {
        if (!this.uiCreated)
            this.createUI();
    }

    async onGridChanged(event) {
        try {
            let grid = null;
            switch (event.action) {
                case 'attach':
                    grid = new AecGrid(this.viewer, { level: event.level, heightOverride: event.level.zMin });
                    await grid.build();
                    this.grids.push(grid);
                    break;
                case 'detach':
                    const idx = this.grids.findIndex(g => g.options.level.name === event.level.name);
                    if (idx <= -1)
                        return;

                    const removed = this.grids.splice(idx, 1);
                    grid = removed[0];
                    grid.destroy();
                    break;
            }
        } catch (ex) {
            this.handleFailure(ex, ex.message);
        }
    }

    handleFailure(msg) {
        const error = new Error(msg);
        error.name = 'AecGridsExtensionError';

        const { onFailureCallback } = this.options;
        onFailureCallback && onFailureCallback(error, msg);
    }

    async load() {
        await this.viewer.waitForLoadDone();

        // Pre-load level extension 
        const aecdata = await Autodesk.Viewing.Document.getAecModelData(this.viewer.model.getDocumentNode());
        if (!aecdata || !aecdata.grids || aecdata.grids.length <= 0) {
            let errorMsg = 'This model doesn\'t contain AEC Model Data or No Grid data found in this model\'s AEC Model Data.';

            if (this.options.autoUnloadOnNoAecModelData == false) {
                this.handleFailure(errorMsg);
            } else {
                errorMsg += ' Unloading extension ...';
                this.handleFailure(errorMsg);

                const onFailureUnloadExtensionHandler = (event) => {
                    if (event.extensionId != 'AecGridsExtension') return;

                    this.viewer.removeEventListener(
                        Autodesk.Viewing.EXTENSION_LOADED_EVENT,
                        onFailureUnloadExtensionHandler,
                    );

                    console.warn('AecGridsExtension is unloaded since this model doesn\'t contain AEC Model Data.');
                    this.viewer.unloadExtension(event.extensionId);
                };

                this.viewer.addEventListener(
                    Autodesk.Viewing.EXTENSION_LOADED_EVENT,
                    onFailureUnloadExtensionHandler
                );
            }

            return false;
        }

        await this.viewer.loadExtension('Autodesk.AEC.LevelsExtension', { doNotCreateUI: true });

        this.viewer.addEventListener(
            AEC_GRIDS_CHANGED_EVENT,
            this.onGridChanged
        );

        if (this.viewer.toolbar) {
            // Toolbar is already available, create the UI
            this.createUI();
        }

        return true;
    }

    unload() {
        while (this.grids.length > 0) {
            let grid = this.grids.pop();
            grid.destroy();
        }

        if (this.panel) {
            this.viewer.removePanel(this.panel);
            this.panel.uninitialize();
            delete this.panel;
            this.panel = null;
        }

        this.viewer.removeEventListener(
            AEC_GRIDS_CHANGED_EVENT,
            this.onGridChanged
        );

        if (this.subToolbar) {
            this.viewer.toolbar.removeControl(this.subToolbar);
            delete this.subToolbar.adnSheetsBrowserButton;
            this.subToolbar.adnSheetsBrowserButton = null;
            delete this.subToolbar;
            this.subToolbar = null;
        }

        return true;
    }

    // async createGrids() {
    //     const aecdata = await this.viewer.model.getDocumentNode().getDocument().downloadAecModelData();
    //     const levels = aecdata.levels;

    //     const offsetMatrix = this.viewer.model.getModelToViewerTransform() || new THREE.Matrix4().identity();

    //     for (let i = 0; i < levels.length; i++) {
    //         const level = levels[i];
    //         const elevation = new THREE.Vector3(0, 0, level.elevation).applyMatrix4(offsetMatrix);
    //         const grid = new AecGrid(this.viewer, { heightOverride: elevation.z });
    //         await grid.build();

    //         this.grids.push(grid);
    //     }
    // }
}

AutodeskNamespace('AecGridsExtension');
AecGridsExtension.AEC_GRIDS_CHANGED_EVENT = AEC_GRIDS_CHANGED_EVENT;

Autodesk.Viewing.theExtensionManager.registerExtension('AecGridsExtension', AecGridsExtension);