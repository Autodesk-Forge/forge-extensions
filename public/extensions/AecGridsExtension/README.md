# AEC Grids

[Demo](https://forge-extensions.autodesk.io/?extension=AecGridsExtensionn)

A Forge Viewer extension for loading and rendering Revit Grids by AEC Model Data

![thumbnail](extension.gif)

## Usage

## Setup

Include the JS file on your page. This CDN is compatible with the latest Viewer version (v7).

```xml
<script src="http://cdn.jsdelivr.net/gh/autodesk-forge/forge-extensions/public/extensions/AecGridsExtension/contents/main.js"></script>
```

After Viewer is ready, preferable inside `onDocumentLoadSuccess`, load the extension

```javascript
viewer.loadExtension("AecGridsExtension")
```

## Author  
[Eason Kang](https://twitter.com/yiskang)