class ModelSummaryExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this._group = null;
        this._button = null;
    }

    load() {
        console.log('ModelSummaryExtension has been loaded');
        return true;
    }

    unload() {
        // Clean our UI elements if we added any
        if (this._group) {
            this._group.removeControl(this._button);
            if (this._group.getNumberOfControls() === 0) {
                this.viewer.toolbar.removeControl(this._group);
            }
        }
        console.log('ModelSummaryExtension has been unloaded');
        return true;
    }

    onToolbarCreated() {
        // Create a new toolbar group if it doesn't exist
        this._group = this.viewer.toolbar.getControl('ModelSummaryToolbar');
        if (!this._group) {
            this._group = new Autodesk.Viewing.UI.ControlGroup('ModelSummaryToolbar');
            this.viewer.toolbar.addControl(this._group);
        }

        // Add a new button to the toolbar group
        this._button = new Autodesk.Viewing.UI.Button('ModelSummaryExtensionButton');
        this._button.onClick = (ev) => {
            // Execute an action here
            // Check if the panel is created or not
            if (this._panel == null) {
                this._panel = new ModelSummaryPanel(this.viewer, this.viewer.container, 'modelSummaryPanel', 'Model Summary');
            }
            // Show/hide docking panel
            this._panel.setVisible(!this._panel.isVisible());

            // If panel is NOT visible, exit the function
            if (!this._panel.isVisible())
                return;

            // First, the viewer contains all elements on the model, including
            // categories (e.g. families or part definition), so we need to enumerate
            // the leaf nodes, meaning actual instances of the model. The following
            // getAllLeafComponents function is defined at the bottom
            this.getAllLeafComponents((dbIds) => {
                // Now for leaf components, let's get some properties and count occurrences of each value
                const filteredProps = ['Material', 'Design Status', 'Type Name'];
                // Get only the properties we need for the leaf dbIds
                this.viewer.model.getBulkProperties(dbIds, filteredProps, (items) => {
                    // Iterate through the elements we found
                    items.forEach((item) => {
                        // and iterate through each property
                        item.properties.forEach(function (prop) {
                            // Use the filteredProps to store the count as a subarray
                            if (filteredProps[prop.displayName] === undefined)
                                filteredProps[prop.displayName] = {};
                            // Start counting: if first time finding it, set as 1, else +1
                            if (filteredProps[prop.displayName][prop.displayValue] === undefined)
                                filteredProps[prop.displayName][prop.displayValue] = 1;
                            else
                                filteredProps[prop.displayName][prop.displayValue] += 1;
                        });
                    });
                    // Now ready to show!
                    // The PropertyPanel has the .addProperty that receives the name, value
                    // and category, that simple! So just iterate through the list and add them
                    filteredProps.forEach((prop) => {
                        if (filteredProps[prop] === undefined) return;
                        Object.keys(filteredProps[prop]).forEach((val) => {
                            this._panel.addProperty(val, filteredProps[prop][val], prop);
                        });
                    });
                });
            });

        };
        this._button.setToolTip('Model Summary Extension');
        this._button.addClass('modelSummaryExtensionIcon');
        this._group.addControl(this._button);
    }

    getAllLeafComponents(callback) {
        this.viewer.getObjectTree(function (tree) {
            let leaves = [];
            tree.enumNodeChildren(tree.getRootId(), function (dbId) {
                if (tree.getChildCount(dbId) === 0) {
                    leaves.push(dbId);
                }
            }, true);
            callback(leaves);
        });
    }
}
class ModelSummaryPanel extends Autodesk.Viewing.UI.PropertyPanel {
    constructor(viewer, container, id, title, options) {
        super(container, id, title, options);
        this.viewer = viewer;
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('ModelSummaryExtension', ModelSummaryExtension);
