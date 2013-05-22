/*
 * LayerOpacitySlider.js Copyright (C) 2013 This file is part of PersistenceGeo project
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
 * @include GeoExt/widgets/tips/LayerOpacitySliderTip.js
 */

/** api: (define)
 *  module = PersistenceGeo.tree
 *  class = LayerOpacitySlider
 */
Ext.namespace("PersistenceGeo.tree");

/**
 * Class: PersistenceGeo.tree.LayerOpacitySlider
 * 
 * Layer opacity slider
 * 
 */
PersistenceGeo.tree.LayerOpacitySlider = Ext.extend(gxp.plugins.Tool, {

    /** api: ptype = pgeo_layeropacityslider */
    ptype: "pgeo_layeropacityslider",

    opacityText: "Opacity",
    opacityTooltipText: "Opacity",
    opacityWindowText: "Layer {0} opacity",

    /**
     * private: method[init] :arg target: ``Object`` The object initializing
     * this plugin.
     */
    init: function(target) {
        PersistenceGeo.tree.LayerOpacitySlider.superclass.init.apply(this, arguments);
        this.target.on('beforerender', this.addActions, this);

    },

    /** api: method[addActions]
     */
    addActions: function() {     

        var actions = PersistenceGeo.tree.LayerOpacitySlider.superclass.addActions.apply(this, [{
                menuText: this.opacityText,
                iconCls: "gxp-opacity-slider",
                disabled: false,
                tooltip: this.opacityTooltipText,
                handler: function() {
                    var record = this._selectedLayer;
                    if (record) {
                        //this.checkIfStyleable(record);
                        this.showWindow(record);
                    }
                },
                scope: this
            }
        ]); 

        this.launchAction = actions[0];

        this.target.on("layerselectionchange", function(record) {
            this._selectedLayer = record;
            this.checkIfStyleable(record);
        }, this);
        var enforceOne = function(store) {
            if(!!this.launchAction){
                this.launchAction.setDisabled(!this._selectedLayer || store.getCount() <= 1);
            }
        };
        this.target.mapPanel.layers.on({
            "add": enforceOne,
            "remove": enforceOne
        });

        return actions;
    },
    /**

     * private: method[showWindow]
     * Show a dialog
     */
    showWindow: function(layerRecord) {
        var layer = layerRecord.getLayer();
        var windowToShow = new Ext.Window({
            title: String.format(this.opacityWindowText, layer.name),
            closeAction: 'hide',
            items:[{
                xtype: "gx_opacityslider",
                name: "opacity",
                anchor: "99%",
                isFormField: true,
                fieldLabel: this.opacityText,
                listeners: {
                    change: function() {
                        this.fireEvent("change");
                    },
                    scope: this
                },
                layer: layer
            }]
        });
        windowToShow.show();
    },

    /** private: method[checkIfStyleable]
     *  :arg layerRec: ``GeoExt.data.LayerRecord``
     *  :arg describeRec: ``Ext.data.Record`` Record from a 
     *      `GeoExt.data.DescribeLayerStore``.
     *
     *  Given a layer record and the corresponding describe layer record, 
     *  determine if the target layer can be styled.  If so, enable the launch 
     *  action.
     */
    checkIfStyleable: function(layerRec, describeRec) {
        if (describeRec) {
            var owsTypes = ["WFS"];
            if (this.rasterStyling === true) {
                owsTypes.push("WCS");
            }
        }
        if (describeRec ? owsTypes.indexOf(describeRec.get("owsType")) !== -1 : !this.requireDescribeLayer) {
            var editableStyles = false;
            var source = this.target.getSource(layerRec); // #78426 modify getSource() in composer
            var url;
            // TODO: revisit this
            var restUrl = layerRec.get("restUrl");
            if (restUrl) {
                url = restUrl + "/styles";
            } else if(source){
                url = source.url.split("?")
                    .shift().replace(/\/(wms|ows)\/?$/, "/rest/styles");
            }else{
                url = layerRec.getLayer().url.split("?")
                    .shift().replace(/\/(wms|ows)\/?$/, "/rest/styles");
            }
            if (this.sameOriginStyling) {
                // this could be made more robust
                // for now, only style for sources with relative url
                editableStyles = url.charAt(0) === "/";
                // and assume that local sources are GeoServer instances with
                // styling capabilities
                if (this.target.authenticate && editableStyles) {
                    // we'll do on-demand authentication when the button is
                    // pressed.
                    this.launchAction.enable();
                    return;
                }
            } else {
                editableStyles = true;
            }
            if (editableStyles) {
                if (this.target.isAuthorized()) {
                    // check if service is available
                    this.disableActionIfAvailable(url);
                }
            }
        }
    },
    
    /** private: method[enableActionIfAvailable]
     *  :arg url: ``String`` URL of style service
     * 
     *  Enable the launch action if the service is available.
     */
    disableActionIfAvailable: function(url) {
        // ovewrite url with app.proxy
        if(url.indexOf(app.proxy) < 0){
            url = app.proxy + url;
        }
        Ext.Ajax.request({
            method: "PUT",
            url: url,
            callback: function(options, success, response) {
                this.launchAction.setDisabled(response.status === 200); // 200 proxy!!
            },
            scope: this
        });
    }

});

Ext.preg(PersistenceGeo.tree.LayerOpacitySlider.prototype.ptype, PersistenceGeo.tree.LayerOpacitySlider);