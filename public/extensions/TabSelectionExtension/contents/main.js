class TabSelectionExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this.viewer = viewer;
        this.keyDownEventBinder = this.keyDownEvent.bind(this);
        this.selectionChangedEventBinder = this.selectionChangedEvent.bind(this);
        this.initialSelection = [];
    }

    load() {
        // track tabs on the document level
        document.addEventListener('keydown', this.keyDownEventBinder);
        // and viewer selection event
        this.viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this.selectionChangedEventBinder);
        return true;
    }

    unload() {
        document.removeEventListener('keydown', this.keyDownEventBinder);
        this.viewer.removeEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this.selectionChangedEventBinder);
        return true;
    }

    keyDownEvent(e) {
        // key to track
        let rotateKey = 9; // TAB
        if (e.keyCode == rotateKey) {
            // just start the rotate if something is select
            if (this.viewer.getSelectionCount() > 0) {
                // prevent the default TAB behavior
                e.preventDefault();
                this.rotate();
            }
        }
    }

    selectionChangedEvent() {
        // clear the initial selection if user unselect
        if (this.viewer.getSelectionCount() === 0) this.initialSelection = [];
    }

    rotate() {
        // get current selection
        let dbIds = this.viewer.getSelection();
        // if first time, let's store the initial dbId
        if (this.initialSelection.length == 0) this.initialSelection = dbIds;
        // this gives the model tree
        let tree = this.viewer.model.getInstanceTree();
        // prepare to store the parent nodes
        let newSelection = [];
        // let's check the selection...
        dbIds.forEach(dbId => {
            // get the parent of each selected dbId
            let parentId = tree.getNodeParentId(dbId);
            // if we reach the root, stop
            if (parentId === tree.getRootId()) return;
            // store the parent for selection
            newSelection.push(parentId);
        });
        // any parent to select?
        if (newSelection.length > 0)
            this.viewer.select(newSelection);
        else {
            // otherwise return to the initial selection
            this.viewer.select(this.initialSelection);
            this.initialSelection = [];
        }
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('TabSelectionExtension', TabSelectionExtension);