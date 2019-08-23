sap.ui.define([
	"DashboardBuilder/controller/BaseController", "sap/m/MessageToast"
], function (BaseController, MessageToast) {
	"use strict";
	return BaseController.extend("DashboardBuilder.controller.Overview", {
		onPress: function (evt) {
			var oTile = evt.getSource(),
				sTileName = oTile.getTooltip(),
				i18nModel = this.getView().getModel("i18n").getResourceBundle();

			switch (sTileName) {
			case "Analyze Guide":
				MessageToast.show("Not available yet.");
				//window.open(i18nModel.getText("something").toString().trim()); // carousel guide here
				break;
			case "Build Guide":
				MessageToast.show("Not available yet.");
				//window.open(i18nModel.getText("something").toString().trim()); // carousel guide here
				break;
			case "MCC Tools Page":
				window.open(i18nModel.getText("mccToolsPage").toString().trim());
				break;
			case "Main Wiki":
				window.open(i18nModel.getText("mainWiki").toString().trim());
				break;
			case "MCC-MDR":
				window.open(i18nModel.getText("mccMdr").toString().trim());
				break;
			case "Best Practices":
				MessageToast.show("Not available yet.");
				//window.open("");
				break;
			default:
				break;
			}
		}
	});
});
