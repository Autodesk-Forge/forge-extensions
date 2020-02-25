class IssuesExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this._group = null;
        this._button = null;
        this._issues = options.issues || [];
    }
    load() {
        this._enabled = false;

        const updateMarkupsCallback = () => {
            if (this._enabled) {
                this._updateMarkups();
            }
        };
        this.viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, updateMarkupsCallback);
        this.viewer.addEventListener(Autodesk.Viewing.EXPLODE_CHANGE_EVENT, updateMarkupsCallback);
        this.viewer.addEventListener(Autodesk.Viewing.ISOLATE_EVENT, updateMarkupsCallback);
        this.viewer.addEventListener(Autodesk.Viewing.HIDE_EVENT, updateMarkupsCallback);
        this.viewer.addEventListener(Autodesk.Viewing.SHOW_EVENT, updateMarkupsCallback);
        return true;
    }

    unload() {
        this.viewer.toolbar.removeControl(this.toolbar);
        this._removeMarkups();
        return true;
    }

    onToolbarCreated() {
        this._createUI();
    }

    _createUI() {
        const viewer = this.viewer;

        this.button = new Autodesk.Viewing.UI.Button('IssuesButton');
        this.button.onClick = () => {
            this._enabled = !this._enabled;
            if (this._enabled) {
                this._createMarkups();
                this.button.setState(0);
            } else {
                this._removeMarkups();
                this.button.setState(1);
            }
        };
        const icon = this.button.container.children[0];
        icon.classList.add('fas', 'fa-flag');
        this.button.setToolTip('Issues');
        this.toolbar = viewer.toolbar.getControl('CustomToolbar') || new Autodesk.Viewing.UI.ControlGroup('CustomToolbar');
        this.toolbar.addControl(this.button);
        viewer.toolbar.addControl(this.toolbar);
    }

    async _createMarkups(partIds) {
        this._explodeExtension = this.viewer.getExtension('Autodesk.Explode');

        const $viewer = $('div.adsk-viewing-viewer');
        $('div.adsk-viewing-viewer label.markup').remove();
        // const query = (partIds && partIds.length > 0) ? '?parts=' + partIds.join(',') : '';
        // const response = await fetch('/api/maintenance/issues' + query);
        // this._issues = await response.json();
        this._issues = [{"_id":"5e20652936692809cc0fd279","createdAt":"2020-01-16T13:29:13.242Z","partId":1469,"author":"Sherbaum Valery","text":"Minor","x":-3.66,"y":-18.08,"z":433.83,"__v":0},{"_id":"5e2065ea36692809cc0fd27a","createdAt":"2020-01-16T13:32:26.252Z","partId":1124,"author":"John Golley","text":"Urgent","x":-89.22,"y":63.68,"z":375.68,"__v":0},{"_id":"5e233abc36692809cc0fd27f","createdAt":"2020-01-18T17:05:00.737Z","partId":1375,"author":"Sherbaum Valery","text":"Major","x":-42.61,"y":53.05,"z":286.09,"__v":0},{"_id":"5e280f1736692809cc0fd281","createdAt":"2020-01-22T09:00:07.116Z","partId":5,"author":"John Golley","text":"Urgent","x":-118.5,"y":71.56,"z":-183.26,"__v":0},{"_id":"5e2a049c36692809cc0fd283","createdAt":"2020-01-23T20:39:56.468Z","partId":5,"author":"Klaus Hünecke","text":"Minor","x":-10,"y":129.41,"z":-382.18,"__v":0},{"_id":"5e32ea3136692809cc0fd28b","createdAt":"2020-01-30T14:37:37.334Z","partId":1124,"author":"Sherbaum Valery","text":"Minor","x":-80,"y":136.54,"z":-250.24,"__v":0},{"_id":"5e32ea7236692809cc0fd28c","createdAt":"2020-01-30T14:38:42.753Z","partId":636,"author":"Sherbaum Valery","text":"Minor","x":-71.58,"y":-127.43,"z":66.73,"__v":0},{"_id":"5e32ea8536692809cc0fd28d","createdAt":"2020-01-30T14:39:01.762Z","partId":636,"author":"Sherbaum Valery","text":"Minor","x":-100,"y":-111.91,"z":354.69,"__v":0},{"_id":"5e38967e25b03409e3b67c22","createdAt":"2020-02-03T21:54:06.522Z","partId":1611,"author":"John Golley","text":"Urgent","x":-56.78,"y":92.21,"z":145.96,"__v":0},{"_id":"5e3896c625b03409e3b67c23","createdAt":"2020-02-03T21:55:18.230Z","partId":570,"author":"Erenburg Vladimir","text":"Minor","x":-98.76,"y":28.43,"z":70.7,"__v":0},{"_id":"5e3896da25b03409e3b67c24","createdAt":"2020-02-03T21:55:38.025Z","partId":570,"author":"Erenburg Vladimir","text":"Minor","x":-120.48,"y":23.23,"z":64.45,"__v":0},{"_id":"5e3896f725b03409e3b67c25","createdAt":"2020-02-03T21:56:07.958Z","partId":1124,"author":"Erenburg Vladimir","text":"Minor","x":-115.18,"y":23.92,"z":376.04,"__v":0},{"_id":"5e38d8be25b03409e3b67c26","createdAt":"2020-02-04T02:36:46.520Z","partId":5,"author":"Wilbert Awdry","text":"Urgent","x":-110.35,"y":69.96,"z":-125.1,"__v":0},{"_id":"5e3d83f125b03409e3b67c2b","createdAt":"2020-02-07T15:36:17.853Z","partId":1587,"author":"Erenburg Vladimir","text":"Critical","x":-108.11,"y":-56.72,"z":337.99,"__v":0},{"_id":"5e43af3125b03409e3b67c2d","createdAt":"2020-02-12T07:54:25.525Z","partId":872,"author":"Sherbaum Valery","text":"Minor","x":138.55,"y":26.6,"z":65.67,"__v":0},{"_id":"5e43dc7a25b03409e3b67c2e","createdAt":"2020-02-12T11:07:38.337Z","partId":1124,"author":"Sherbaum Valery","text":"Minor","x":-55.04,"y":96.95,"z":265.82,"__v":0},{"_id":"5e4581c725b03409e3b67c30","createdAt":"2020-02-13T17:05:11.566Z","partId":1124,"author":"Sherbaum Valery","text":"Minor","x":49.79,"y":136.87,"z":-228.72,"__v":0},{"_id":"5e49266725b03409e3b67c31","createdAt":"2020-02-16T11:24:23.372Z","partId":754,"author":"Bill Gunston","text":"Critical","x":50,"y":124.27,"z":57.65,"__v":0},{"_id":"5e4a917925b03409e3b67c33","createdAt":"2020-02-17T13:13:29.018Z","partId":1597,"author":"Klaus Hünecke","text":"Urgent","x":63.42,"y":106.41,"z":342.14,"__v":0},{"_id":"5e4b997525b03409e3b67c34","createdAt":"2020-02-18T07:59:49.627Z","partId":1124,"author":"Bill Gunston","text":"Major","x":-78.52,"y":-128.3,"z":74.73,"__v":0},{"_id":"5e4b997925b03409e3b67c35","createdAt":"2020-02-18T07:59:53.846Z","partId":1375,"author":"Bill Gunston","text":"Major","x":-78.52,"y":-128.3,"z":74.73,"__v":0},{"_id":"5e4b997b25b03409e3b67c36","createdAt":"2020-02-18T07:59:55.012Z","partId":1375,"author":"Bill Gunston","text":"Major","x":-78.52,"y":-128.3,"z":74.73,"__v":0},{"_id":"5e4b998225b03409e3b67c37","createdAt":"2020-02-18T08:00:02.686Z","partId":1469,"author":"Bill Gunston","text":"Major","x":-112.81,"y":3.72,"z":283.94,"__v":0},{"_id":"5e4b999425b03409e3b67c38","createdAt":"2020-02-18T08:00:20.474Z","partId":1375,"author":"Erenburg Vladimir","text":"Major","x":-112.81,"y":3.72,"z":283.94,"__v":0},{"_id":"5e4b9cec25b03409e3b67c3c","createdAt":"2020-02-18T08:14:36.971Z","partId":1124,"author":"Sherbaum Valery","text":"Minor","x":-70.25,"y":94.23,"z":348.79,"__v":0},{"_id":"5e4b9d3a25b03409e3b67c3d","createdAt":"2020-02-18T08:15:54.673Z","partId":1467,"author":"Sherbaum Valery","text":"Major","x":25.01,"y":45.38,"z":371.76,"__v":0},{"_id":"5e4b9d4525b03409e3b67c3e","createdAt":"2020-02-18T08:16:05.240Z","partId":1467,"author":"Sherbaum Valery","text":"Urgent","x":25.01,"y":45.38,"z":371.76,"__v":0}];

        const viewer = this.viewer;
        const tree = viewer.model.getInstanceTree();
        for (const issue of this._issues) {
            // Store first fragment of each issue's part
            tree.enumNodeFragments(issue.partId, function(fragId) {
                if (!issue.fragment) {
                    issue.fragment = viewer.impl.getFragmentProxy(viewer.model, fragId);
                }
            });

            // Randomly assign placeholder image to some issues
            if (Math.random() > 0.5) {
                issue.img = 'https://placeimg.com/150/100/tech?' + issue._id
            }
            const pos = this.viewer.worldToClient(this.getModifiedWorldBoundingBox(issue.partId).center());
            const $label = $(`
                <label class="markup" data-id="${issue._id}">
                    <img class="arrow" src="/images/arrow.png" />
                    <a href="#">${issue.author}</a>: ${issue.text}
                    ${issue.img ? `<br><img class="thumbnail" src="${issue.img}" />` : ''}
                </label>
            `);
            $label.css('left', Math.floor(pos.x) + 10 /* arrow image width */ + 'px');
            $label.css('top', Math.floor(pos.y) + 10 /* arrow image height */ + 'px');
            $label.css('display', viewer.isNodeVisible(issue.partId) ? 'block' : 'none');
            $viewer.append($label);
        }
    }

    getModifiedWorldBoundingBox(dbId) {
        var fragList = this.viewer.model.getFragmentList();
        const nodebBox = new THREE.Box3()

        // for each fragId on the list, get the bounding box
        for (const fragId of this._frags['dbId' + dbId]) {
            const fragbBox = new THREE.Box3();
            fragList.getWorldBounds(fragId, fragbBox);
            nodebBox.union(fragbBox); // create a unifed bounding box
        }

        return nodebBox
    }

    _updateMarkups() {
        const viewer = this.viewer;
        for (const label of $('div.adsk-viewing-viewer label.markup')) {
            const $label = $(label);
            const id = $label.data('id');
            const issue = this._issues.find(item => item._id === id);
            const pos = this.viewer.worldToClient(this._getIssuePosition(issue));
            $label.css('left', Math.floor(pos.x) + 10 /* arrow image width */ + 'px');
            $label.css('top', Math.floor(pos.y) + 10 /* arrow image height */ + 'px');
            $label.css('display', viewer.isNodeVisible(issue.partId) ? 'block' : 'none');
        }
    }

    _getIssuePosition(issue) {
        if (this._explodeExtension.isActive()) {
            issue.fragment.getAnimTransform();
            const offset = issue.fragment.position;
            return new THREE.Vector3(issue.x + offset.x, issue.y + offset.y, issue.z + offset.z);
        } else {
            return new THREE.Vector3(issue.x, issue.y, issue.z);
        }
    }

    _removeMarkups() {
        const $viewer = $('div.adsk-viewing-viewer label.markup').remove();
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('IssuesExtension', IssuesExtension);