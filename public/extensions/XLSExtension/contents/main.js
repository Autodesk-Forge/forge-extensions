class XLSExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
      super(viewer, options);
      this._group = null;
      this._button = null;
  }

  load() {
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
      console.log('MyAwesomeExtensions has been unloaded');
      return true;
  }

  onToolbarCreated() {
      // Button 1
    var button1 = new Autodesk.Viewing.UI.Button('toolbarXLS');
    button1.onClick = function (e) {
        ForgeXLS.downloadXLSX(fileName.replace(/\./g, '') + ".xlsx", statusCallback );/*Optional*/
    };
    button1.addClass('toolbarXLSButton');
    button1.setToolTip('Export to .XLSX');

    // SubToolbar
    this.subToolbar = new Autodesk.Viewing.UI.ControlGroup('myAppGroup1');
    this.subToolbar.addControl(button1);

    this.viewer.toolbar.addControl(this.subToolbar);
  }

}
let statusCallback = function(completed, message) {
 $.notify(message, { className: "info", position:"bottom right" });
 $('#downloadExcel').prop("disabled", !completed);
}

Autodesk.Viewing.theExtensionManager.registerExtension('XLSExtension', XLSExtension);
