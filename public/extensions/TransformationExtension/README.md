# Transform

Allows moving elements on the model.

![thumbnail](extension.gif)

## Usage

Enable the extension, click on the model element, use the `gizmo` to move the element.

## Setup

Include the CSS & JS file on your page. This CDN is compatible with the lastest Viewer version (v7).

```xml
<link rel="stylesheet" href="http://cdn.jsdelivr.net/gh/autodesk-forge/forge-extensions/public/extensions/transform/contents/main.css">
<script src="http://cdn.jsdelivr.net/gh/autodesk-forge/forge-extensions/public/extensions/transform/contents/main.js"></script>
```

After Viewer is ready, preferable inside `onDocumentLoadSuccess`, load the extension

```javascript
viewer.loadExtension("TransformationExtension")
```

## How it works


