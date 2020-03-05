# forge.viewer.standard.extensions

[![Node.js](https://img.shields.io/badge/Node.js-4.4.3-blue.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-2.15.1-blue.svg)](https://www.npmjs.com/)
![Platforms](https://img.shields.io/badge/platform-windows%20%7C%20osx%20%7C%20linux-lightgray.svg)
[![License](http://img.shields.io/:license-mit-blue.svg)](http://opensource.org/licenses/MIT)

[![oAuth2](https://img.shields.io/badge/oAuth2-v1-green.svg)](http://developer.autodesk.com/)
[![Data-Management](https://img.shields.io/badge/Data%20Management-v1-green.svg)](http://developer.autodesk.com/)
[![OSS](https://img.shields.io/badge/OSS-v2-green.svg)](http://developer.autodesk.com/)
[![Model-Derivative](https://img.shields.io/badge/Model%20Derivative-v2-green.svg)](http://developer.autodesk.com/)

## Live Demo: https://standard-extensions.herokuapp.com/

# Description

This sample is part of the [Learn Forge](http://learnforge.autodesk.io) tutorials.
Autodesk Forge Viewer Extensions with loose coupling, so that it's easy to plug and play in other projects.
This repo is built on top of [Learn Forge Github repo](https://github.com/Autodesk-Forge/learn.forge.viewmodels/tree/nodejs)

### Run locally

Install [NodeJS](https://nodejs.org).

Clone this project or download it. It's recommended to install [GitHub Desktop](https://desktop.github.com/). To clone it via command line, use the following (**Terminal** on MacOSX/Linux, **Git Shell** on Windows):

    git clone https://github.com/libvarun/StandardExtensions.git

To run it, install the required packages, set the enviroment variables with your client ID & Secret and finally start it. Via command line, navigate to the folder where this repository was cloned to and use the following commands:

Mac OSX/Linux (Terminal)

    npm install
    export FORGE_CLIENT_ID=<<YOUR CLIENT ID FROM DEVELOPER PORTAL>>
    export FORGE_CLIENT_SECRET=<<YOUR CLIENT SECRET>>
    npm start

Windows (use **Node.js command line** from the Start menu)

    npm install
    set FORGE_CLIENT_ID=<<YOUR CLIENT ID FROM DEVELOPER PORTAL>>
    set FORGE_CLIENT_SECRET=<<YOUR CLIENT SECRET>>
    npm start

Open the browser: [http://localhost:5000](http://localhost:5000).

# Setup

To use this sample, you will need Autodesk developer credentials. Visit the [Forge Developer Portal](https://developer.autodesk.com), sign up for an account, then [create an app](https://developer.autodesk.com/myapps/create). For this new app, use **http://localhost:5000/api/forge/callback/oauth** as the Callback URL, although it is not used on a 2-legged flow. Finally, take note of the **Client ID** and **Client Secret**.

### Steps to plug in new extension:

1) Create folder in public/StandardExtensions with same name as extension name.
Structure of the extension folder is as shown below:
<pre>
ExtensionName[Folder]
        | 
        |->contents
        |     |
        |     |->main.js
        |     |->main.css
        |     |->assets[folder]
        |->config.json
</pre>        
Refer the [BasicSkeleton Extension](https://github.com/libvarun/StandardExtensions/tree/master/public/StandardExtensions/BasicSkeleton) for boilerplate code.

2) Add the newly added Extension information in StandardExtensions/config.json
Refer First element in Extensions array in [StandardExtensions/config.json](https://github.com/libvarun/StandardExtensions/blob/master/public/StandardExtensions/config.json) file for congiguration options.

3) Each extension folder should be self-contained code, so that it's easily shareable between projects.
Extension[Folder]/config.json is meant for keeping the config of an extension and for sharing. Config details need to be added in [StandardExtensions/config.json](https://github.com/libvarun/StandardExtensions/blob/master/public/StandardExtensions/config.json) for the new extension to work.

Extension config schema:
<pre>
{
    "name":"extension name registered",
    "displayname": "display name for the extension in list",
    "description": "description for the extension",
    "options":{model specific information array to pass on to extension constructor},
    "viewerversion":"viewer version",
    "loadonstartup": "true or false",
    "filestoload":{
        "cssfiles":["css file(s)"],
        "jsfiles":["js file(s)"]
    },
    "bloglink":"Blog link for working explanation of the extension (optional)",
    "includeinlist":"true or false"
}
</pre>
Example: [IconMarkupExtension config.json](https://github.com/libvarun/StandardExtensions/blob/master/public/StandardExtensions/IconMarkupExtension/config.json)

> Note: If your extension relies on event Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT to load, in load function check if the data is already loaded, if not only then add the event listener, below code shows the structure.
<pre>
class MyExtension extends Autodesk.Viewing.Extension {
    ...
    load() {
        ...
        if (this.viewer.model.getInstanceTree()) {
            this.onTreeReady();
        } else {
            this.viewer.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, this.onTreeReady.bind(this));
        }
        ...
    }
    ...
    onTreeReady() {
        const tree = this.viewer.model.getInstanceTree();
        ...
    }
    ...
}
</pre>
Example: [IconMarkupExtension load function](https://github.com/libvarun/StandardExtensions/blob/master/public/StandardExtensions/IconMarkupExtension/contents/main.js#L10)

### Understanding extensionloader and using it in forge app:

The way loose coupling between extensions and forge app is achived is with custom event, if you want to use extensionloader in your forge app, follow the three steps:

1) Copy paste the [StandardExtensions](https://github.com/libvarun/StandardExtensions/blob/master/public/StandardExtensions) in public folder of your app or in the folder where the index file resides. 

2) Include below script in index.html file
<pre>
<script src="/StandardExtensions/extensionloader.js"></script>
</pre>

3) Here's the linking part between the app and the extensionloader, in viewer [onDocumentLoadSuccess](https://github.com/libvarun/StandardExtensions/blob/master/public/js/ForgeViewer.js#L35) function, emit an event to inform the extensionloader that viewer has loaded the model with the below [code](https://github.com/libvarun/StandardExtensions/blob/master/public/js/ForgeViewer.js#L39):
<pre>
var ViewerInstance = new CustomEvent("viewerinstance", {detail: {viewer: viewer}});      
document.dispatchEvent(ViewerInstance);
</pre>
 To load an extension programmatically, emit the below event.
 <pre>
 var LoadExtensionEvent = new CustomEvent("loadextension", {
              detail: {
                extension: "Extension1",
                viewer: viewer
             }
         });
 document.dispatchEvent(LoadExtensionEvent);
 </pre>

To unload extension:
<pre>
 var UnloadExtensionEvent = new CustomEvent("unloadextension", {
              detail: {
                extension: "Extension1",
                viewer: viewer
             }
         });
 document.dispatchEvent(UnloadExtensionEvent);
</pre>
>Note: If the extension needs additional UI elements, first option we suggest is use the viewer UI [Autodesk.Viewing.UI.DockingPanel](https://forge.autodesk.com/en/docs/viewer/v2/reference/javascript/dockingpanel)

## Packages used

The [Autodesk Forge](https://www.npmjs.com/package/forge-apis) packages are included by default. Some other non-Autodesk packages are used, including [express](https://www.npmjs.com/package/express) and [multer](https://www.npmjs.com/package/multer) for upload.

# Tips & tricks

For local development/ testing, consider using the [nodemon](https://www.npmjs.com/package/nodemon) package, which auto-restarts your node application after any modification to your code. To install it, use:

    sudo npm install -g nodemon

Then, instead of **npm run dev**, use the following:

    npm run nodemon

Which executes **nodemon server.js --ignore www/**, where the **--ignore** parameter indicates that the app should not restart if files under the **www** folder are modified.

## Troubleshooting

After installing GitHub Desktop for Windows, on the Git Shell, if you see the ***error setting certificate verify locations*** error, then use the following command:

    git config --global http.sslverify "false"

# License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT).
Please see the [LICENSE](LICENSE) file for full details.

## Written by

Varun Patil [@VarunPatil578](https://twitter.com/VarunPatil578), [Forge Partner Development](http://forge.autodesk.com)
Augusto Goncalves [@augustomaia](https://twitter.com/augustomaia), [Forge Partner Development](http://forge.autodesk.com)
