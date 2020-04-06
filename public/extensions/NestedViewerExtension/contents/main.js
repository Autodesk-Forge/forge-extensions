class NestedViewerExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        options = options || {};
        this._filter = options.filter || ['2d', '3d'];
        this._crossSelection = !!options.crossSelection;
        this._group = null;
        this._button = null;
        this._panel = null;
        this._onModelLoaded = this.onModelLoaded.bind(this);
        this._onSelectionChanged = this.onSelectionChanged.bind(this);
    }

    load() {
        this.viewer.addEventListener(Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT, this._onModelLoaded);
        if (this._crossSelection) {
            this.viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this._onSelectionChanged);
        }
        console.log('NestedViewerExtension has been loaded.');
        return true;
    }

    unload() {
        this.viewer.removeEventListener(Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT, this._onModelLoaded);
        if (this._crossSelection) {
            this.viewer.removeEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, this._onSelectionChanged);
        }
        if (this._panel) {
            this._panel.uninitialize();
        }
        // Clean our UI elements if we added any
        if (this._group) {
            this._group.removeControl(this._button);
            if (this._group.getNumberOfControls() === 0) {
                this.viewer.toolbar.removeControl(this._group);
            }
        }
        console.log('NestedViewerExtension has been unloaded.');
        return true;
    }

    onModelLoaded() {
        if (this._panel) {
            this._panel.urn = this.viewer.model.getData().urn;
        }
    }

    onSelectionChanged() {
        if (this._panel) {
            this._panel.select(this.viewer.getSelection());
        }
    }

    onToolbarCreated() {
        this._group = this.viewer.toolbar.getControl('nestedViewerExtensionToolbar');
        if (!this._group) {
            this._group = new Autodesk.Viewing.UI.ControlGroup('nestedViewerExtensionToolbar');
            this.viewer.toolbar.addControl(this._group);
        }
        this._button = new Autodesk.Viewing.UI.Button('nestedViewerExtensionButton');
        this._button.onClick = (ev) => {
            if (!this._panel) {
                this._panel = new NestedViewerPanel(this.viewer, this._filter, this._crossSelection);
                this._panel.urn = this.viewer.model.getData().urn;
            }
            if (this._panel.isVisible()) {
                this._panel.setVisible(false);
                this._button.removeClass('active');
            } else {
                this._panel.setVisible(true);
                this._button.addClass('active');
            }
        };
        this._button.setToolTip('Nested Viewer');
        this._button.addClass('nestedViewerExtensionIcon');
        this._group.addControl(this._button);
    }
}

class NestedViewerPanel extends Autodesk.Viewing.UI.DockingPanel {
    constructor(viewer, filter, crossSelection) {
        super(viewer.container, 'nested-viewer-panel', 'Nested Viewer');
        this._urn = '';
        this._parentViewer = viewer;
        this._filter = filter;
        this._crossSelection = crossSelection;
    }

    get urn() {
        return this._urn;
    }

    set urn(value) {
        if (this._urn !== value) {
            this._urn = value;
            this._updateDropdown();
        }
    }

    initialize() {
        this.container.style.top = '5em';
        this.container.style.right = '5em';
        this.container.style.width = '500px';
        this.container.style.height = '400px';

        this.title = this.createTitleBar(this.titleLabel || this.container.id);
        this.container.appendChild(this.title);

        this._container = document.createElement('div');
        this._container.style.position = 'absolute';
        this._container.style.left = '0';
        this._container.style.top = '50px';
        this._container.style.width = '100%';
        this._container.style.height = '330px'; // 400px - 50px (title bar) - 20px (footer)
        this.container.appendChild(this._container);

        this._overlay = document.createElement('div');
        this._overlay.style.width = '100%';
        this._overlay.style.height = '100%';
        this._overlay.style.display = 'none';
        this._overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this._overlay.style.color = 'white';
        this._overlay.style.zIndex = '101';
        this._overlay.style.justifyContent = 'center';
        this._overlay.style.alignItems = 'center';
        this._container.appendChild(this._overlay);

        this._dropdown = document.createElement('select');
        this._dropdown.style.position = 'absolute';
        this._dropdown.style.left = '1em';
        this._dropdown.style.top = '1em';
        this._dropdown.style.setProperty('z-index', '100');
        this._dropdown.setAttribute('id', 'nestedViewerExtensionDropdown');
        this._dropdown.addEventListener('change', this._onDropdownChanged.bind(this))
        this._dropdown.addEventListener('mousedown', function (ev) { ev.stopPropagation(); }); // prevent DockingPanel from kidnapping clicks on the dropdown
        this._container.appendChild(this._dropdown);

        this.initializeMoveHandlers(this.container);
        this._footer = this.createFooter();
        this.footerInstance.resizeCallback = (width, height) => {
            this._container.style.height = `${height - 50 /* title bar */ - 20 /* footer */}px`;
            if (this._viewer) {
                this._viewer.resize();
            }
        };
        this.container.appendChild(this._footer);
    }

    setVisible(show) {
        super.setVisible(show);
        if (show && !this._viewer) {
            this._viewer = new Autodesk.Viewing.GuiViewer3D(this._container);
            this._viewer.start();
            this._onDropdownChanged();
            if (this._crossSelection) {
                this._viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, () => {
                    this._parentViewer.select(this._viewer.getSelection());
                });
            }
        }
    }

    select(dbids) {
        if (this._viewer) {
            this._viewer.select(dbids);
        }
    }

    _updateDropdown() {
        const onDocumentLoadSuccess = (doc) => {
            this._manifest = doc;
            const filterGeom = (geom) => this._filter.indexOf(geom.data.role) !== -1;
            const geometries = doc.getRoot().search({ type: 'geometry' }).filter(filterGeom);
            if (geometries.length > 0) {
                this._overlay.style.display = 'none';
                this._dropdown.innerHTML = geometries.map(function (geom) {
                    return `<option value="${geom.guid()}">${geom.name()}</option>`;
                }).join('\n');
            } else {
                this._overlay.style.display = 'flex';
                this._overlay.innerText = 'No viewables found';
                this._dropdown.innerHTML = '';
            }
            this._onDropdownChanged();
        };
        const onDocumentLoadFailure = () => {
            console.error('Could not load document.');
        };
        this._dropdown.innerHTML = '';
        Autodesk.Viewing.Document.load('urn:' + this._urn, onDocumentLoadSuccess, onDocumentLoadFailure);
    }

    _onDropdownChanged() {
        const guid = this._dropdown.value;
        if (guid) {
            this._viewer.loadDocumentNode(this._manifest, this._manifest.getRoot().findByGuid(guid));
        }
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('NestedViewerExtension', NestedViewerExtension);
