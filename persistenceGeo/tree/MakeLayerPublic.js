/*
 * MakeLayerPublic.js Copyright (C) 2013 This file is part of PersistenceGeo project
 * 
 * This software is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 * 
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * As a special exception, if you link this library with other files to
 * produce an executable, this library does not by itself cause the
 * resulting executable to be covered by the GNU General Public License.
 * This exception does not however invalidate any other reasons why the
 * executable file might be covered by the GNU General Public License.
 * 
 * Authors: Alejandro Diaz Torres (mailto:adiaz@emergya.com)
 */

/**
 * @required  persistenceGeo/widgets/GeoNetworkTool.js
 */

/** api: (define)
 *  module = PersistenceGeo.tree
 *  class = MakeLayerPublic
 */
Ext.namespace("PersistenceGeo.tree");

/**
 * Class: PersistenceGeo.tree.MakeLayerPublic
 * 
 * Make a layer public. See #87022
 * 
 */
PersistenceGeo.tree.MakeLayerPublic = Ext.extend(PersistenceGeo.widgets.GeoNetworkTool, {

    /** api: ptype = pgeo_makelayerpublic */
    ptype: "pgeo_makelayerpublic",

    /** i18n **/
    toolText: "Publish",
    toolTooltipText: "Make a publish request",
    toolWindowText: "Layer {0} publish request",
    toolIconCls: 'gxp-icon-savelayers',
    formActionFieldText: "Target action",
    formActionFieldValueText: "Publish as new layer",
    formNameFieldText: "Target name",
    formNameFieldValueText: "Name of the layer",
    formTemplateFieldText: "Template",
    formTemplateFieldValueText: "ISO 19119",
    metadataWindowText: "Metadata for layer {0} publish request",
    targetWindowTitleText: "Target folder/layer",

    /** Window sizes **/
    windowWidth: 400,
    windowHeight: 200,
    metadataWindowWidth: 800,
    metadataWindowHeight: 600,

    /**
     * private: method[showWindow]
     * Show a dialog
     */
    showWindow: function(layerRecord) {
        var layer = layerRecord.getLayer();

        // Create and show windows
        var publishRequestWindow = this.getPublishRequestWindow(layerRecord);
        var metadataWindow = this.getMetadataWindow(layerRecord);
        var targetWindow = this.getTargetWindow(layerRecord);
        publishRequestWindow.show();
        metadataWindow.show();
        targetWindow.show();

        // Position of the windows
        var position = publishRequestWindow.getPosition();
        var offset = publishRequestWindow.getWidth() + 20;
        var offsetY = (this.metadataWindowHeight - this.windowHeight) / 2;
        publishRequestWindow.setPosition(position[0] - this.windowWidth, position[1]);
        metadataWindow.setPosition(position[0] - this.windowWidth + offset, position[1] - offsetY);
    },

    /**
     * private: method[getPublishRequestWindow]
     * Obtain publish request window
     */
    getPublishRequestWindow: function(layerRecord) {
        var layer = layerRecord.getLayer();

        // Create a window to choose the template and the group
        if (!this.publishRequestWindow) {
            
            this.publishRequestWindow = new Ext.Window({
                title:  String.format(this.toolWindowText, layer.name),
                width: this.windowWidth,
                height: this.windowHeight,
                layout: 'fit',
                modal: false,
                items: this.getPanel(),
                closeAction: 'hide',
                constrain: true
            });
        }

        return this.publishRequestWindow;
    },

    /**
     * private: method[getMetadataWindow]
     * Obtain metadata window
     */
    getMetadataWindow: function(layerRecord) {
        var layer = layerRecord.getLayer();

        // Create a window to choose the template and the group
        if (!this.newMetadataWindow) {
            var newMetadataPanel = new GeoNetwork.editor.NewMetadataPanel({
                        getGroupUrl: catalogue.services.getGroups,
                        catalogue: catalogue
                    });
            
            this.newMetadataWindow = new Ext.Window({
                title:  String.format(this.metadataWindowText, layer.name),
                width: this.metadataWindowWidth,
                height: this.metadataWindowHeight,
                layout: 'fit',
                modal: false,
                items: newMetadataPanel,
                closeAction: 'hide',
                constrain: true
            });
        }

        return this.newMetadataWindow;
    },

    /**
     * private: method[getTargetWindow]
     * Obtain folder tree panel window to select a layer
     */
    getTargetWindow: function(layerRecord) {
        var layer = layerRecord.getLayer();

        // Create a window to choose the template and the group
        if (!this.targetWindow) {
            var mapPanel = Viewer.getMapPanel();
            this.targetWindow = new Viewer.dialog.ChannelTools({
                mapPanel: mapPanel,
                title: this.targetWindowTitleText,
                map: mapPanel.map,
                showLayers: true,
                modal: false,
                persistenceGeoContext: this.target.persistenceGeoContext,
                cls: 'additional-layers-window'
            });
        }

        return this.targetWindow;
    },


    /**
     * private: method[getPanel]
     * Obtain default form panel initialized.
     * TODO: Make all fields as select fields localized
     */
    getPanel: function(layer){

        this.actionField = new Ext.form.TextField({
            fieldLabel: this.formActionFieldText,
            allowBlank: false,
            width: 250,
            msgTarget: "under",
            //validator: this.urlValidator.createDelegate(this),
            value: this.formActionFieldValueText
        });

        this.nameField = new Ext.form.TextField({
            fieldLabel: this.formNameFieldText,
            allowBlank: false,
            width: 250,
            msgTarget: "under",
            //validator: this.urlValidator.createDelegate(this),
            value: this.formNameFieldValueText
        });

        this.templateField = new Ext.form.TextField({
            fieldLabel: this.formTemplateFieldText,
            allowBlank: false,
            width: 250,
            msgTarget: "under",
            //validator: this.urlValidator.createDelegate(this),
            value: this.formTemplateFieldValueText
        });

        var items = [this.actionField, this.nameField, this.templateField];

        this.form = new Ext.form.FormPanel({
            items: items,
            border: false,
            labelWidth: 50,
            bodyStyle: "padding: 15px",
            autoWidth: true,
            height: 400
        });

        return this.form;
    }

});

Ext.preg(PersistenceGeo.tree.MakeLayerPublic.prototype.ptype, PersistenceGeo.tree.MakeLayerPublic);