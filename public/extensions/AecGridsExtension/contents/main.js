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

class AecGridsExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);

        this.modelBuilder = null;
        this.idPrefix = 100;
    }

    async load() {
        const modelBuilderExt = await this.viewer.loadExtension('Autodesk.Viewing.SceneBuilder');
        const modelBuilder = await modelBuilderExt.addNewModel({
            conserveMemory: false,
            modelNameOverride: 'Grids'
        });

        this.modelBuilder = modelBuilder;

        if (!this.viewer.isLoadDone()) {
            this.viewer.addEventListener(
                Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
                () => this.createGrids(),
                { once: true }
            );
        } else {
            this.createGrids();
        }

        return true;
    }

    unload() {
        this.viewer.impl.unloadModel(this.modelBuilder.model);

        delete this.linesMaterial;
        this.linesMaterial = null;
        return true;
    }

    createMaterials() {
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
        const material = new THREE.MeshPhongMaterial({ map: texture });
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

    async createGrids() {
        const aecdata = await this.viewer.model.getDocumentNode().getDocument().downloadAecModelData();
        const grids = aecdata.grids;

        this.createMaterials();

        for (let i = 0; i < grids.length; i++) {
            const grid = grids[i];
            this.createGrid(grid);
        }

        // uncomment to prevent selection on grids
        // const dbIds = this.modelBuilder.model.getFragmentList().fragments.fragId2dbId;
        // const model = this.modelBuilder.model;
        // this.viewer.lockSelection(dbIds, true, model);
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('AecGridsExtension', AecGridsExtension);