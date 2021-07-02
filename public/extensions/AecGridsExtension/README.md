# AEC Grids

[Demo](https://forge-extensions.autodesk.io/?extension=AecGridsExtensionn)

A Forge Viewer extension for loading and rendering Revit Grids by AEC Model Data

![thumbnail](extension.gif)

## Limitation

This extension works only for models that has AEC Model Data and have grids extracted inside its AEC Model Data.

**Note.** Currently, only RVT files produced by Revit 2018 and newer versions will have AEC Model Data after translating by Forge Model Derivative API. See [Blog: Consume AEC Data which are from Model Derivative API](https://forge.autodesk.com/blog/consume-aec-data-which-are-model-derivative-api).

## Usage

Enable the extension, click on the Grids button to open AecGridsPanel, and then click on the checkbox to show grids of the level you want to show.

## Setup

Include the JS file on your page. This CDN is compatible with the latest Viewer version (v7).

```xml
<link rel="stylesheet" href="http://cdn.jsdelivr.net/gh/autodesk-forge/forge-extensions/public/extensions/AecGridsExtension/contents/main.css" />
<script src="http://cdn.jsdelivr.net/gh/autodesk-forge/forge-extensions/public/extensions/AecGridsExtension/contents/main.js"></script>
```

After Viewer is ready, preferable inside `onDocumentLoadSuccess`, load the extension

```javascript
viewer.loadExtension("AecGridsExtension")
```

## Author  
[Eason Kang](https://twitter.com/yiskang)