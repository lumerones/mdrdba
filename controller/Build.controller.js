sap.ui.define([
	"DashboardBuilder/controller/BaseController", "sap/m/MessageToast", "sap/ui/model/Filter", "sap/ui/model/FilterOperator"
], function (BaseController, MessageToast, Filter, FilterOperator) {
	"use strict";
	return BaseController.extend("DashboardBuilder.controller.Build", {
		onInit: function () {
			this.itemObj = {};
			this.itemObj.filters = [];
			this.itemObj.params = [];
			this.oModel = new sap.ui.model.json.JSONModel();
			this.oModel.setData(this.itemObj);
			this.tempItemsObj = {};
		},
		clearObjects: function () {
			this.itemObj = {};
			this.itemObj.filters = [];
			this.itemObj.params = [];
			this.tempItemsObj = {};
			this.oModel.setData(this.itemObj);
		},
		onExit: function () {
			if (this.secDialog) {
				this.secDialog.destroy(true);
			}
			if (this.oDialog) {
				this.oDialog.destroy(true);
			}
		},
		onReset: function () {
			this.getView().byId("buildPanel").setExpanded(false);
			this.getView().byId("dashType").setSelectedKey("mdr0");
			this.clearObjects();
		},
		onSearch: function (event) {
			var query = event.getParameter("value");
			var filter = new Filter({
				filters: [
					new Filter("name", FilterOperator.Contains, query),
					new Filter("value", FilterOperator.Contains, query)
				],
				and: false
			});
			event.getSource().getBinding("items").filter([filter]);
		},
		dashSelection: function () {
			this.clearObjects();
			var oView = this.getView();

			// expands the Results panel once a valid URL has been submitted and analyzed
			if (oView.byId("dashType").getSelectedKey() !== "mdr0") {
				oView.byId("buildPanel").setExpanded(true);
			} else {
				oView.byId("buildPanel").setExpanded(false);
			}
		},
		generateUrl: function () {
			// gets the dashboard type selected and stores in mdrType variable. the current selection data is stored inside oData variable
			var mdrType = this.getView().byId("dashType").getSelectedKey();
			var oData = this.oModel.getData();
			var i, j;

			// basic URL string, to be used later
			var urlStringGateway = this.getView().getModel("i18n").getResourceBundle().getText("urlStringGateway").toString().trim();
			var urlStringAfterType = "_f.html?filter=";

			// empty variables to be filled with strings to build the URL, and empty arrays to get the data from oData to the strings
			var urlStringFilters = "",
				urlStringParams = "";

			for (i in oData.filters) {
				if (i > 0) {
					urlStringFilters += " and ";
				}

				if (oData.filters[i].desc.toString() === "Filter") {
					urlStringFilters += oData.filters[i].desc + " eq 'serviceteam(";
					for (var k in oData.filters[i].value) {
						urlStringFilters += oData.filters[i].value[k];
						if (k < oData.filters[i].value.length - 1) {
							urlStringFilters += ";";
						}
					}
					urlStringFilters += ")'";

				} else if (oData.filters[i].value.length > 1) {
					for (j in oData.filters[i].value) {

						if (Number(j) === 0) {
							urlStringFilters = urlStringFilters + "(";
						} else if (j < oData.filters[i].value.length) {
							urlStringFilters = urlStringFilters + " or ";
						}

						urlStringFilters += oData.filters[i].desc + " eq '" + oData.filters[i].value[j] + "'";

						if (Number(j) === oData.filters[i].value.length - 1) {
							urlStringFilters = urlStringFilters + ")";
						}
					}

				} else {
					urlStringFilters = urlStringFilters + oData.filters[i].desc + " eq '" + oData.filters[i].value + "'";
				}
			}

			for (i in oData.params) {
				urlStringParams = urlStringParams + "&" + oData.params[i].desc + "=" + oData.params[i].value;
			}

			// URL is being built here and stored into global variable
			var generatedUrlString = urlStringGateway + mdrType + urlStringAfterType + urlStringFilters + urlStringParams;
			this.generatedUrl = generatedUrlString;

			// if generated url dialog doesn't exists, creates it
			if (!this.genDialog) {
				this.genDialog = sap.ui.xmlfragment("DashboardBuilder.view.generateUrlDialog", this);
			}

			// MAGIC and then dialog opening
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.genDialog);
			this.getView().addDependent(this.genDialog);
			sap.ui.getCore().byId("generatedText").setValue(generatedUrlString);
			this.genDialog.open();
		},
		// handleFilterButtonPress: in "Build" page, this function is called when "Add Filter" button is pressed, filters only dashboard filters for the selected type
		handleFilterButtonPress: function () {
			if (!this.oDialog) {
				this.oDialog = sap.ui.xmlfragment("DashboardBuilder.view.firstSelection", this);
				this.oDialog.setModel(this.getOwnerComponent().getModel("filters"));
			}

			var oComboBox = this.getView().byId("dashType");
			var mdrTypeKey = oComboBox.getSelectedKey();

			this.oDialog.getBinding("items").filter([new Filter("key", "EQ", mdrTypeKey)]);

			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oDialog);
			this.getView().addDependent(this.oDialog);
			this.oDialog.open();
		},
		// handleParameterButtonPress: in "Build" page, this function is called when "Add Parameter" button is pressed
		// filters the parameters from the filters.json file (all parameters use the key "all")
		handleParameterButtonPress: function () {
			if (!this.oDialog) {
				this.oDialog = sap.ui.xmlfragment("DashboardBuilder.view.firstSelection", this);
				this.oDialog.setModel(this.getOwnerComponent().getModel("filters"));
			}

			this.oDialog.getBinding("items").filter([new sap.ui.model.Filter("key", "EQ", "all")]);

			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oDialog);
			this.getView().addDependent(this.oDialog);
			this.oDialog.open();
		},
		openTemplatesDialog: function () {
			if (!this.templatesDialog) {
				this.templatesDialog = sap.ui.xmlfragment("DashboardBuilder.view.templates", this);
				this.getView().addDependent(this.templatesDialog);
				//this.templatesDialog.setModel(this.getOwnerComponent().getModel("templates"));
				this.templatesDialog.open();
			}
		},
		// handleData: handles the selection from the "Filters" and "Parameters" selection dialogs, storing the selection as objects
		// to be inserted into data model AND to be displayed at the "Current Selection" list
		handleData: function () {
			var oData = this.oModel.getData();
			var existsName = 0,
				index = 0,
				i;

			if (this.tempItemsObj.info.toString() === "Filter") {
				for (i in oData.filters) {
					if (oData.filters[i].filter === this.tempItemsObj.filter) {
						existsName = 1;
						index = i;
						break;
					}
				}
				if (existsName === 1) {
					oData.filters.splice(index, 1);
				}
				oData.filters.unshift(this.tempItemsObj);

			} else if (this.tempItemsObj.info.toString() === "Parameter") {
				for (i in oData.params) {
					if (oData.params[i].filter === this.tempItemsObj.filter) {
						existsName = 1;
						index = i;
						break;
					}
				}
				if (existsName === 1) {
					oData.params.splice(index, 1);
				}
				oData.params.unshift(this.tempItemsObj);

			}
			this.oModel.setData(oData);

			var oColumnItemTemplate = new sap.m.ColumnListItem({
				cells: [
					new sap.m.Text({
						text: "{filter}",
						textAlign: "Center"
					}),
					new sap.m.Text({
						text: "{value}",
						textAlign: "Center"
					})
				]
			});

			var oFBindingInfo = {
				path: "/filters",
				template: oColumnItemTemplate
			};
			var oPBindingInfo = {
				path: "/params",
				template: oColumnItemTemplate
			};

			var buildTableFilters = this.byId("buildTableFilters");
			var buildTableParams = this.byId("buildTableParams");
			buildTableFilters.setModel(this.oModel);
			buildTableParams.setModel(this.oModel);
			buildTableFilters.bindItems(oFBindingInfo);
			buildTableParams.bindItems(oPBindingInfo);
		},
		// onDelete: in "Build" page, this function handles the items deleted from the "Results" table, rearranging the stored data and the results table as well
		onDelete: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("listItem");
			var sPath = oSelectedItem.getBindingContext().getPath();
			var iSelectedItemIndex = parseInt(sPath.substring(sPath.lastIndexOf("/") + 1), 1);

			var idTable = oEvent.getSource().getId();
			idTable = idTable.slice(idTable.indexOf("--") + 2);

			var oTable = this.getView().byId(idTable);
			var oData = this.oModel.getData();
			if (idTable === "buildTableFilters") {
				oData.filters.splice(iSelectedItemIndex, 1);
			} else if (idTable === "buildTableParams") {
				oData.params.splice(iSelectedItemIndex, 1);
			}
			this.oModel.setData(oData);
			oTable.setModel(this.oModel);
		},
		// handleClose: this function is called when selection dialogs (filters and parameters) are closed, uses MessageToast to display the selection to the user
		// then, uses handleDialogs function to clarify if the selection needs another selection dialog (i.e. you select the 'category' filter, the second dialog is the list of categories)
		// or an input dialog (user text input, like in the 'title' parameter)
		handleClose: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				MessageToast.show("You have chosen " + aContexts.map(function (oContext) {
					return oContext.getObject().name;
				}).join(", "));

				var selectedItem = oEvent.getParameter("selectedItem");

				// MAGIC HERE
				this.tempItemsObj = {};
				this.tempItemsObj.filter = selectedItem.getTitle(); // i.e. Status
				this.tempItemsObj.desc = selectedItem.getDescription(); // i.e. activity_status
				this.tempItemsObj.info = aContexts.map(function (oContext) {
					return oContext.getObject().info;
				});

				// AND HERE
				var littleObj = {};
				littleObj.name = selectedItem.getTitle();
				littleObj.info = selectedItem.getInfo(); // i.e. select
				littleObj.path = selectedItem.getBindingContext().getPath(); // i.e. /1/something

				oEvent.getSource().getBinding("items").filter([]);

				this.handleDialogs(littleObj);
			} else {
				MessageToast.show("No new item was selected.");
			}
		},
		handleSelectClose: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				MessageToast.show("You have chosen " + aContexts.map(function (oContext) {
					return oContext.getObject().name;
				}).join(", "));
				var tempArray = aContexts.map(function (oContext) {
					return oContext.getObject().value;
				});

				this.tempItemsObj.value = [];
				for (var i in tempArray) {
					this.tempItemsObj.value.push(tempArray[i]);
				}
				this.handleData();
			} else {
				MessageToast.show("No new item was selected.");
			}

			this.secDialog.destroy();
			delete this.secDialog;
		},
		handleGenerationClose: function (oEvent) {
			var target = oEvent.getSource().data("target");
			switch (target) {
			case "browser":
				window.open(this.generatedUrl);
				break;
			case "close":
			default:
				this.genDialog.destroy();
				delete this.genDialog;
				break;
			}
		},
		handleInputClose: function () {
			var input = sap.ui.getCore().byId("userInput").getValue();
			if (input !== "") {
				this.tempItemsObj.value = input.split(",");
				this.handleData();
			}

			this.secDialog.destroy();
			delete this.secDialog;
		},
		handleTemplateClose: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				MessageToast.show("You have chosen " + aContexts.map(function (oContext) {
					return oContext.getObject().name;
				}).join(", "));

				var selectedItem = oEvent.getParameter("selectedItem");
				var itemName = selectedItem.getTitle();

				switch (itemName) {
				case "Title":
					var oModel = this.oModel.getData();
					var data = this.getOwnerComponent().getModel("templates");
					var path = selectedItem.getBindingContext().getPath();
					var prop = data.getProperty(path);
					var sPath = prop.options;

					for (var i = 0; i < sPath.length; i++) {
						oModel.items.unshift(sPath[i]);
					}
					this.oModel.setData(oModel);

					this.tempItemsObj = {};
					this.tempItemsObj.filter = "Title";
					this.tempItemsObj.desc = "&title";

					var obj = {};
					obj.info = "input";
					this.handleDialogs(obj);
					break;
				default:
					break;
				}
			} else {
				MessageToast.show("No new item was selected.");
			}
			this.templatesDialog.destroy();
			delete this.templatesDialog;
		},
		handleDialogs: function (data) {
			if (!this.secDialog) {
				if (data.info === "Multi Select" || data.info === "Single Select") {
					if (data.info === "Multi Select") {
						this.secDialog = sap.ui.xmlfragment("DashboardBuilder.view.secondSelectionMulti", this.getView().getController());
					} // if multi select
					else {
						this.secDialog = sap.ui.xmlfragment("DashboardBuilder.view.secondSelectionMulti", this.getView().getController());
						this.secDialog.setMultiSelect(false);
					} // else it's single select

					var oModel = new sap.ui.model.json.JSONModel();
					var sModel = this.getOwnerComponent().getModel("filters");
					var path = data.path;
					var prop = sModel.getProperty(path);
					var sPath = prop.options;
					oModel.setData(sPath);
					this.secDialog.setModel(oModel);
				} else {
					this.secDialog = sap.ui.xmlfragment("DashboardBuilder.view.secondSelectionInput", this.getView().getController());
				}
			}
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.secDialog);
			this.getView().addDependent(this.secDialog);
			this.secDialog.open();
		}
	});
});
