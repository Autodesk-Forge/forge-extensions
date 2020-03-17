# NestedViewerExtension

Forge Viewer extension showing viewables related to the currently loaded model in another instance of the viewer.

## Usage

- Load the extension in the viewer
- Click the <img src="https://img.icons8.com/color/64/000000/picture-in-picture.png" width=16> icon in the toolbar
- New dialog will open, showing a dropdown list of all viewables available for the currently loaded model

## How it works

The extension uses another instance of [GuiViewer3D](https://forge.autodesk.com/en/docs/viewer/v7/reference/Viewing/GuiViewer3D/)
and places it in a custom [DockingPanel](https://forge.autodesk.com/en/docs/viewer/v7/reference/UI/DockingPanel/).
Whenever the "main" viewer loads a different model (observed via the `Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT` event),
the extension collects all viewables available in this model (using `doc.getRoot().search({ type: 'geometry' })`),
and makes them available in the docking panel's dropdown.
