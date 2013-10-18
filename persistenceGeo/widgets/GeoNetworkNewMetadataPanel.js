/*
 * GeonetworkNewMetadataPanel.js Copyright (C) 2013 This file is part of PersistenceGeo project
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
 * Authors: Luis Román (mailto:lroman@emergya.com)
 */


Ext.namespace("PersistenceGeo.widgets");

/** api: (define)
 *  module = PersistenceGeo.widget
 *  class = GeonetworkNewMetadataPanel
 */
/** api: constructor 
 *  .. class:: GeonetworkNewMetadataPanel(config)
 *
 *     Create a GeoNetwork form for metadata creation
 *
 *
 *     Default metadata store to use could be overriden when setting
 *     GeoNetwork.Settings.mdStore variables. Default is :class:`GeoNetwork.data.MetadataResultsStore`.
 *
 *     Some modifications by Emergya so it plays nicer with SIR-admin.
 *
 */
PersistenceGeo.widgets.GeoNetworkNewMetadataPanel = Ext.extend(GeoNetwork.editor.NewMetadataPanel, {

    ptype: "pgeo_gnnewmetadatapanel",

    initComponent: function() {
        Ext.applyIf(this, this.defaultConfig);
        var checkboxSM, colModel;

        this.addEvents('dataLoaded');

        this.createBt = new Ext.Button({
            text: OpenLayers.i18n('create'),
            iconCls: 'addIcon',
            ctCls: 'gn-bt-main',
            disabled: true,
            handler: function() {
                if (this.ownerCt.controller) {
                    // PersistenceGeo implementation
                    this.controller = this.ownerCt.controller;
                    var validForm = this.controller.validateForm();
                    if (validForm) {
                        this.controller.metadataEdit(this.selectedTpl, true, this.selectedGroup, this.isChild, this.isTemplate, this.selectedSchema);
                    }
                } else {
                    // FIXME could be improved
                    this.catalogue.metadataEdit(this.selectedTpl, true, this.selectedGroup, this.isChild, this.isTemplate, this.selectedSchema);
                    this.ownerCt.hide();
                }
            },
            scope: this
        });

        this.buttons = [this.createBt, {
            text: OpenLayers.i18n('cancel'),
            iconCls: 'cancel',
            handler: function() {
                this.ownerCt.hide();
            },
            scope: this
        }];

        GeoNetwork.editor.NewMetadataPanel.superclass.initComponent.call(this);

        this.groupStore = GeoNetwork.data.GroupStore(this.getGroupUrl + '&profile=Editor');

        var cmp = [];

        // Only add template if not already defined (ie. duplicate action)
        if (!this.selectedTpl) {
            this.tplStore = GeoNetwork.Settings.mdStore ? GeoNetwork.Settings.mdStore() : GeoNetwork.data.MetadataResultsFastStore();
            this.tplStore.setDefaultSort('displayOrder');

            // Create grid with template list
            checkboxSM = new Ext.grid.CheckboxSelectionModel({
                singleSelect: this.singleSelect,
                header: ''
            });

            var tplDescription = function(value, p, record) {
                return String.format(
                    '<span class="tplTitle">{0}</span><div class="tplDesc">{1}</div>',
                    record.data.title, record.data['abstract']);
            };
            var tplType = function(value, p, record) {
                var label = OpenLayers.i18n(record.data.type) || '';

                if (record.data.spatialRepresentationType) {
                    label += " / " + OpenLayers.i18n(record.data.spatialRepresentationType);
                }

                return String.format('{0}', label);
            };

            colModel = new Ext.grid.ColumnModel({
                defaults: {
                    sortable: true
                },
                columns: [
                    checkboxSM, {
                        header: OpenLayers.i18n('metadatatype'),
                        renderer: tplType,
                        dataIndex: 'type'
                    }, {
                        id: 'title',
                        header: OpenLayers.i18n('tplTitle'),
                        renderer: tplDescription,
                        dataIndex: 'title'
                    }, {
                        header: 'Esquema',
                        dataIndex: 'schema'
                    }, {
                        header: 'Order',
                        hidden: true,
                        dataIndex: 'displayOrder'
                    }
                ]
            });

            var grid = new Ext.grid.GridPanel({
                border: false,
                anchor: '100% -30',
                store: this.tplStore,
                colModel: colModel,
                sm: checkboxSM,
                autoExpandColumn: 'title'
            });

            grid.getSelectionModel().on('rowselect', function(sm, rowIndex, r) {
                if (sm.getCount() !== 0) {
                    this.selectedTpl = r.data.id;
                    this.selectedSchema = r.data.schema;
                } else {
                    this.selectedTpl = undefined;
                }
                this.validate();
            }, this);

            // Focus on first row
            grid.getStore().on('load', function(store) {
                grid.getSelectionModel().selectFirstRow();
                grid.getView().focusEl.focus();
                this.manageLoadedEvent();
            }, this);
            cmp.push(grid);
            this.catalogue.search({
                E_template: 'y',
                E_hitsperpage: 150
            }, null, null, 1, true, this.tplStore, null);
        }

        this.combo = new Ext.form.ComboBox({
            name: 'E_group',
            mode: 'local',
            anchor: '100%',
            emptyText: OpenLayers.i18n('chooseGroup'),
            triggerAction: 'all',
            fieldLabel: OpenLayers.i18n('group'),
            store: this.groupStore,
            allowBlank: false,
            valueField: 'id',
            displayField: 'name',
            tpl: '<tpl for="."><div class="x-combo-list-item">{[values.label.' + GeoNetwork.Util.getCatalogueLang(OpenLayers.Lang.getCode()) + ']}</div></tpl>',
            listeners: {
                select: function(field, record, idx) {
                    this.selectedGroup = record.get('id');
                    this.validate();
                },
                scope: this
            }
        });

        cmp.push(this.combo);

        cmp.push({
            xtype: 'textfield',
            name: 'isTemplate',
            hidden: true,
            value: this.isTemplate
        });

        this.add(cmp);

        // Remove special groups and select first group in the list
        this.groupStore.load({
            callback: function() {
                this.groupStore.each(function(record) {
                    if ((record.get('id') == '-1') || (record.get('id') == '0') || (record.get('id') == '1')) {
                        this.remove(record);
                    }
                }, this.groupStore);


                if (this.groupStore.getCount() > 0) {
                    var recordSelected = this.groupStore.getAt(0);
                    if (recordSelected) {
                        this.selectedGroup = recordSelected.get('id');
                        this.combo.setValue(recordSelected.data.label[GeoNetwork.Util.getCatalogueLang(OpenLayers.Lang.getCode())]);
                        this.validate();
                    }
                }
                this.manageLoadedEvent();
            },
            scope: this
        });



        this.on("render", function() {
            // We add a mask in the topmost container
            var w = this;
            do {
                w = w.ownerCt;
            } while (w.ownerCt);

            this.loadMask = new Ext.LoadMask(w.getEl());
            this.loadMask.show();
        }, this);
    },

    /**
     * manageLoadedEvent
     * Check if groupStore and templateStore are loaded. When both are loaded,
     * fires the dataLoaded event with the current template and current group.
     * The event has the following arguments :
     *   - this (newMetadataPnel)
     *   - template store value
     *   - group store value
     */
    manageLoadedEvent: function() {
        this.storeLoaded++;
        if (this.storeLoaded >= this.nbStore) {
            this.fireEvent('dataLoaded', this, this.selectedTpl, this.selectedGroup);

            this.loadMask.hide();
        }
    }
});

Ext.preg(PersistenceGeo.widgets.GeoNetworkNewMetadataPanel.prototype.ptype, PersistenceGeo.widgets.GeoNetworkNewMetadataPanel);