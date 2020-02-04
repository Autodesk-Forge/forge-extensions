///////////////////////////////////////////////////////////////////////////////
// Resize extension
// by Denis Grigor, September 2018
//
///////////////////////////////////////////////////////////////////////////////

class viewerResizerExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this.viewer = viewer;

        this.viewWindow = this.viewer.clientContainer;
        this.maxWidth = 1024;
        this.maxHeigh = 768;

        this.prepareUI = this.prepareUI.bind(this);
        this.resizeViewer = this.resizeViewer.bind(this);
    }

    load() {
        console.log('viewerResizerExtension is loaded!');
        this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT,
            this.prepareUI);

        return true;
    }
    unload() {
        console.log('viewerResizerExtension is now unloaded!');
        this.viewer.removeEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT,
            this.prepareUI);

        return true;
    }

    prepareUI() {

        let controlPanel = document.createElement('div');
        controlPanel.id = "controlPanel";
        controlPanel.style.cssText = `
            position: absolute;
            right: 15px;
            bottom: 55px;
            z-index: 2;
            border: 2px solid #ccc;
            background-color: #ffffff;
            border-radius: 5px;
            padding: 10px;`;

        controlPanel.innerHTML = `
        <h4>Resize Viewer</h4>
        `;

        document.body.appendChild(controlPanel);
        let sizeController = document.createElement('input');
        sizeController.type = "range";
        sizeController.value = 100;
        sizeController.min = 10;
        sizeController.id = "sizeController";

        sizeController.oninput = this.resizeViewer;

        controlPanel.appendChild(sizeController);


    }

    resizeViewer(event) {
        let value = event.target.value;

        let newWidth = this.maxWidth*value/100;
        let newHeight = this.maxHeigh*value/100;

        this.viewWindow.style.width = `${(newWidth)}px`;
        this.viewWindow.style.height = `${(newHeight)}px`;


        this.viewer.canvas.width = newWidth;
        this.viewer.canvas.height = newHeight;


        this.viewer.container.style.width = `${(newWidth)}px`;
        this.viewer.container.style.height = `${(newHeight)}px`;
        this.viewer.resize(newWidth, newHeight);
    }

}

Autodesk.Viewing.theExtensionManager.registerExtension('viewerResizerExtension',
    viewerResizerExtension);