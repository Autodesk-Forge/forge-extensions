/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Forge Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

// *******************************************
// Custom Property Panel
// *******************************************
class CustomPropertyPanel extends Autodesk.Viewing.Extensions.ViewerPropertyPanel {
    constructor (viewer, options) {
        super(viewer, options);
        this.properties = options.properties || {};
    }

    setAggregatedProperties(propertySet) {
        Autodesk.Viewing.Extensions.ViewerPropertyPanel.prototype.setAggregatedProperties.call(this, propertySet);

        // add your custom properties here
        const dbids = propertySet.getDbIds();
        dbids.forEach(id => {
            var propsForObject = this.properties[id.toString()];
            if (propsForObject) {
                for (const groupName in propsForObject) {
                    const group = propsForObject[groupName];
                    for (const propName in group) {
                        const prop = group[propName];
                        this.addProperty(propName, prop, groupName);
                    }
                }
            }
        });
    }
};

// *******************************************
// Custom Properties Extension
// *******************************************
class CustomPropertiesExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
       
        this.panel = new CustomPropertyPanel(viewer, options);
    }

    async load() {
        var ext = await this.viewer.getExtension('Autodesk.PropertiesManager');
        ext.setPanel(this.panel);

        return true;
    }

    async unload() {
        var ext = await this.viewer.getExtension('Autodesk.PropertiesManager');
        ext.setDefaultPanel();

        return true;
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('CustomPropertiesExtension', CustomPropertiesExtension);