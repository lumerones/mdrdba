sap.ui.define([
	"DashboardBuilder/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";
	var _aValidTabKeys = ["Home", "Analyze", "Build"];

	return BaseController.extend("DashboardBuilder.controller.App", {
		onInit: function () {
			var oRouter = this.getRouter();
			this.getView().setModel(new JSONModel(), "view");

			oRouter.getRoute("App").attachMatched(this._onRouteMatched, this);
		},
		_onRouteMatched: function (oEvent) {
			var oArgs, oView, oQuery;

			oArgs = oEvent.getParameter("arguments");
			oView = this.getView();
			oQuery = typeof (oArgs["?query"]) === "undefined" ? "NO VALUE" : oArgs["?query"];

			if (oQuery.hasOwnProperty("analyze") === true) {
				oView.getModel("view").setProperty("/selectedTabKey", "Analyze");
				this.getRouter().getTargets().display("Analyze");

			} else if (oQuery && _aValidTabKeys.indexOf(oQuery.tab) > -1) {
				oView.getModel("view").setProperty("/selectedTabKey", oQuery.tab);

				// support lazy loading for the tabs
				if (oQuery.tab === "Analyze" || oQuery.tab === "Build" || oQuery.tab === "Home") {
					this.getRouter().getTargets().display(oQuery.tab);
				}
			} else {
				// the default query param should be visible at all time
				this.getRouter().navTo("App", {
					query: {
						tab: _aValidTabKeys[0]
					}
				}, true);
			}
		},
		onTabSelect: function (oEvent) {
			this.getRouter().navTo("App", {
				query: {
					tab: oEvent.getParameter("selectedKey")
				}
			}, true);
		},
		openInfoDialog: function () {
			if (!this.infoDialog) {
				this.infoDialog = sap.ui.xmlfragment("DashboardBuilder.view.infoDialog", this);
				this.getView().addDependent(this.infoDialog);
				this.infoDialog.open();
			}
		},
		// when closed, the info dialog gets destroyed
		closeInfoDialog: function () {
			if (this.infoDialog) {
				this.infoDialog.destroy(true);
				delete this.infoDialog;
			}
		}
	});
});