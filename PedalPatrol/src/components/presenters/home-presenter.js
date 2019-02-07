import BasePresenter from './presenter';
import { HomeM } from '../models/export-models';

export default class HomePresenter extends BasePresenter {
	/**
	 * Creates an instance of HomePresenter
	 *
	 * @constructor
	 * @param {Object} view - An instance of a view class
	 */
	constructor(view) {
		super()
		this.stores = [HomeM];
		this.view = view;
		HomeM.subscribe(this);
	}

	/**
	 * Updates the bike model with new data.
	 *
	 * @param {Object} newData - New data to update the model's data with.
	 */
	update = (newData) => {
		HomeM.update(newData); 
	};


	/**
	 * Called when the model is updated with new data. Refreshes the state of the view.
	 * Method is supplied with the data to add.
	 * Better way to refresh the state?
	 *
	 * @param {Object} newData - New data to add.
	 */
	onUpdated = (newData) => {
		// Do something with the new data or let the view auto update?
		console.log(newData)
		this.view.refreshState();
	};


	/**
	 * Called when the model is updated with new data. Refreshes the state of the view.
	 * Better way to refresh the state?
	 */
	 onUpdated = () => {
	 	this.view.refreshState();
	 };

	/**
	 * Gets the data from the model and returns it to the caller.
	 *
	 * @return {Object} Data from the model.
	 */
	getData = () => {
		return HomeM.get().data;
	};

	/**
	 * If the view or presenter is destroyed, unsubscribe the presenter from the model.
	 */
	onDestroy = () => {
		HomeM.unsubscribe(this);
	};

	
	// Maybe differentiate between cancel and clear
	handleSearchCancel = () => {
		this.view.setState({
			data: this.getData()
		});
	};

	handleSearchClear = () => {
		this.view.setState({
			data: this.getData()
		});
	};

	/**
	 * Filter the items in the list based on the text passed in. Called every time a letter is typed.
	 *
	 * @param {String} text - A word(s) to filter on
	 */
	handleSearchFilter = (text) => {
		console.log(this.getData());
		const newData = this.getData().filter(item => {
			const itemData = `${item.name.toUpperCase()}}`;
			const textData = text.toUpperCase();
			return itemData.indexOf(textData) > -1;
		});
		this.view.setState({
			data: newData
		});
	};
}