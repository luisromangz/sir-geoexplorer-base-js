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
 * @required  persistenceGeo/widgets/GeoNetworkMetadataPublisher.js
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
PersistenceGeo.tree.MakeLayerPublic = Ext.extend(PersistenceGeo.tree.GeoNetworkMetadataPublisher, {

    /** api: ptype = pgeo_makelayerpublic */
    ptype: "pgeo_makelayerpublic",

    /** Save url for the layer publish request **/
    saveUrl: '/persistenceGeo/saveLayerPublishRequest',

    savingRequestError: "An error was found while saving the publication request.",
    savingRequestSuccessMsg: "The publication request was registered successfully. It will be attended by an admin as soon as possible.",

    /** private: method[checkIfEnable]
     *  :arg layerRec: ``GeoExt.data.LayerRecord``
     *
     *  Only enabled when the selected layer have metadata UUID and the user logged is admin
     */
    checkIfEnable: function(record) {

        var disable = true;

        if(record && record.getLayer()){
          var layer = record.getLayer();

          var tmpLayer = typeof(layer.layerID) == "undefined" && layer.metadata && layer.metadata.temporal;
          
          var userInfo = this.target.persistenceGeoContext.userInfo;
          var layerOwned =  !tmpLayer &&  !!userInfo && !userInfo.admin && !!layer.authId && userInfo.authorityId == layer.authId;

          if(layerOwned){
              this.layerSelected = record;
              if(layer.metadata && layer.metadata.json
                    && layer.metadata.json.properties){
                  this.layerUuid = layer.metadata.metadataUuid;
                  var metadataId = layer.metadata.json.properties.metadataId;
                  disable = !!metadataId;
              }else{
                disable = false;
              }
          }
        }

        this.launchAction.setDisabled(disable); 
    },

    /** api: method[onEditorPanelAction]
     *  :param action: ``String`` action called in editor panel
     *  :param arg1: ``Object`` optional parameter from the panel (UUID, for example)
     *
     *  Called when an action is pressed in the editor panel. 
     *  For this widget we need to save the layer changes in a gis_layer_publish_request entry
     *  calling to this.saveUrl
     */
    onEditorPanelAction: function (action, arg1){
        if(action =="publicationRequest"){
            // Action 'validate' is perused so we can create the publication request.
            var targetFolder = this.jsonData.activeAction == this.KNOWN_ACTIONS.NEW_LAYER ?
                this.jsonData.selectedTargetId : null;
            var targetLayer = this.jsonData.activeAction == this.KNOWN_ACTIONS.UPDATE_LAYER ?
                this.jsonData.selectedTargetId : null;
            this.jsonData.metadataUuid = arg1.metadataUuid;
            this.jsonData.metadataId = arg1.metadataId;
            Ext.Ajax.request({
                url : this.target.defaultRestUrl + this.saveUrl,
                params:{
                    layerId: this.jsonData.layerSelected.getLayer().layerID,
                    layerName: this.jsonData.name,
                    metadataUrl: this.jsonData.metadataUuid,
                    metadataId: this.jsonData.metadataId,
                    targetFolder: targetFolder,
                    targetLayer: targetLayer
                },
                method: 'POST',
                success : this.handleSuccess,
                failure : this.handleFailure,
                scope : this
            });
        }else if(action =="cancel"){
            // Action 'cancel' -->  TODO: We need to remove the layer_request?!
        }else if(action =="reset"){
            // something todo if action is 'reset'
        }
    },

    handleSuccess: function(response){
        if(response.responseText){
            var jsonData = Ext.decode(response.responseText);
            if(!jsonData.success){
                this.handleFailure(jsonData);
            }else{
                var layer = this.jsonData.layerSelected.getLayer();
                if(!layer.metadata){
                    layer.metadata = {};
                }
                layer.metadata.metadataUuid = this.jsonData.metadataUuid;
                layer.metadata.metadataId = this.jsonData.metadataId;
                //TODO: Change condition

                Ext.Msg.alert("", this.savingRequestSuccessMsg);
                this.launchAction.setDisabled(true); 

                this.editorWindow.destroy();
            }
        }
    },

    handleFailure: function(response){

        Ext.Msg.alert("", this.savingRequestError);
    }

});

Ext.preg(PersistenceGeo.tree.MakeLayerPublic.prototype.ptype, PersistenceGeo.tree.MakeLayerPublic);