import Model from './model';
import Database from '../../util/database';
import ImageUtil from '../../util/imageutil';

/**
 * Class for the bike model to be used by the BikePresenter and AddBikePresenter
 * @extends Model
 */
class BikeModel extends Model {
	/**
	 * Creates an instance of BikeModel. Sets the default callback, creates an observerlist,
	 * and registers an on read from the database.
	 *
	 * @constructor
	 */
	constructor() {
		super();
		this._callback = this._defaultCallback;

		this._data = {data: []};
		this._createObserverList();
		this._registerDatabaseRead();		
	}

	/**
	 * Delete a bike from the database
	 *
	 * @param {string} id - A bike id to delete
	 * @param {Function} callback - A function to call when remove succeeds or fails
	 */
	deleteBikeByID(id, callback) {
		const { index } = this._bikeIDExists(id);
		const bike = this._data.data[index];
		Database.removeBikeItem(id, (resultItem) => {
			Database.removeBikeImages(bike.thumbnail, (resultImage) => {
				callback(resultItem && resultImage);
			});
		});
	}

	/**
	 * Default callback
	 */
	_defaultCallback(message) {
		console.log(message);
	}

	/**
	 * Set the model's callback to a new callback. This callback can be used anywhere and is usually passed in from a presenter.
	 *
	 * @param {Function} callback - A callback to run when certain code is executed
	 */
	setCallback(callback) {
		this._callback = callback;
	}

	/**
	 * Register an 'on' read from the database to get updates anytime data changes in the database.
	 */
	_registerDatabaseRead() {
		Database.readBikeDataOn((snapshot) => {
			// console.log(snapshot.val());
			this._insertDataOnRead(snapshot.val());
			this._notifyAll(); // Don't supply data to force a refresh by the presenter
		});
	}

	/**
	 * Get method for presenters to get data.
	 *
	 * @return {Object} data stored in the model
	 */
	get() {
		return {...this._data} // Immutable
	}


	/**
	 * Update method for presenters to update the model's data. Datetime and Owner are handled in database class.
	 *
	 * @param {Object} newData - New data to add
	 */
	update(newData) {
		// Add ID here
		if (newData.data.id === '' || newData.data.id === undefined) {
			console.log('Fetching new ID...');
			newData.data.id = Database.getNewBikeID();
		}

		try {
			const {exists, index} = this._bikeDataExists(newData);
			if (exists && this._checkNewImages(index, newData.data.thumbnail)) {
				newData.data.thumbnail = this._removeIllustrationKey(newData.data.thumbnail);
				this._insertDataOnUpdate(exists, index, newData);
				this._editExistingInDatabase(newData.data, (result) => {this._callback(true); this._notifyAll(this._data);});

			} else {
				// Write to database
				this._writeImageToStorage(newData.data.id, newData.data.thumbnail, (uploaded_images, num_defaults) => {
					newData.data.thumbnail = uploaded_images;

					// Check if there's actually images 
					if (!ImageUtil.checkImageListValid(uploaded_images)) {
						this._callback(false);
						return;
					}

					this._insertDataOnUpdate(exists, index, newData);

					// console.log(result);
					// console.log(this._data.data);

					// If the number of defaults in the original amount is the same 
					const finishCallback = ImageUtil.checkNumDefaults(num_defaults, uploaded_images) ? (result) => {this._callback(result); this._notifyAll(this._data);} : (_) => 'default';

					// variable 'result' - true: ID was found in database so edit it; false: ID not found in database so add it
					// const dbCall = result ? Database.editBikeData : Database.writeBikeData;
					// this._addToDatabase(dbCall, newData.data, finishCallback);
					const funcCall = exists ? this._editExistingInDatabase : this._writeNewInDatabase;
					funcCall(newData.data, finishCallback);

				}, this._callback);
			}
		} catch (error) {
			console.log(error);
			this._callback(false);
		}

		// this._data = {...this._data, ...newData} // Overwrite - Use this if the data is appended to previous data in the presenter
		// this._data.data.push(newData.data); // Appends to the list - Use this if only a single piece of data is passed in 
		// console.log(this._data);
		// this._notifyAll() // Send with no message?
		// this._notifyAll(this._data); // Consider not having a message and forcing the presenter to 'get' the message itself
	}

	_checkNewImages(index, thumbnails) {
		if (index >= 0) {
			const bike = this._data.data[index];
			return JSON.stringify(bike.thumbnail) == JSON.stringify(thumbnails);
		} else {
			return false; // Bike does not exist
		}
	}

	/**
	 * Removes the illustration key from the object and only adds the actual link.
	 *
	 * @param {List} thumbnails - A list of thumbnail objects with the property 'illustration'
	 * @return {List} A list of thumbnails
	 */
	_removeIllustrationKey(thumbnails) {
		let new_thumbnails = [];
		for (let i=0; i < thumbnails.length; i++) {
			new_thumbnails.push(thumbnails[i].illustration);
		}
		return new_thumbnails;
	}

	/**
	 * Write the image to the firebase storage and call the callbacks with the urls that were defined.
	 *
	 * @param {Number} id - The id of the bike corresponding to the image
	 * @param {List} images - A list of objects with the property 'illustration'
	 * @param {Function} onSuccess - A callback to call when an image has been successfully uploaded
	 * @param {Function} onError - A callback to call when an image has failed to upload
	 */
	_writeImageToStorage(id, images, onSuccess, onError) {
		const FILE_EXTENSION = '.jpg';
		let uploaded_pictures = [];
		let count_default = 0;

		// If there are no images, return
		if (!ImageUtil.checkImageListValid(images)) {
			onError(false);
			return;
		}

		for (let i=0; i < images.length; i++) {
			// Check if there's a default image, if so, skip it
			if (ImageUtil.isDefaultImage(images[i].illustration)) {
				count_default++;
				continue;
			} else if (ImageUtil.isAlreadyUploaded(images[i].illustration)) {
				uploaded_pictures.push(images[i].illustration);
				continue;
			}

			// Name of file is the current timestamp. 
			const filename = i + ImageUtil.getFileExtension();
			// Write image to database
			Database.writeImage(id, images[i].illustration, filename, (url) => {
				uploaded_pictures.push(url);
				onSuccess(uploaded_pictures, count_default);
				return url;
			}, (error) => {
				console.log(error);
				onError(false);
			});

		}
	}

	// Could generalize _writeNewInDatabase and _editExistingInDatabase into one function

	/**
	 * Write new data in database and call the function callback depending on if it was successful or not.
	 *
	 * @param {Object} newData - Data to be written to the database
	 */
	_writeNewInDatabase(newData, callback) {
		return Database.writeBikeData(newData, (data) => {
			// console.log(data);
			callback(typeof data !== 'undefined' && data !== undefined);
			// return typeof data !== 'undefined' && data !== undefined
			// this._callback(typeof data !== 'undefined' && data !== undefined);
		},(error) => {
			console.log(error);
			callback(false);
			// this._callback(false);
		});
	}

	/**
	 * Overwrite existing data in database and call the function callback depending on if it was successful or not.
	 *
	 * @param {Object} newData - Data to be written to the database
	 */
	_editExistingInDatabase(newData, callback) {
		return Database.editBikeData(newData, (data) => {
			// console.log(data);
			callback(typeof data !== 'undefined' && data !== undefined);
			// return typeof data !== 'undefined' && data !== undefined;
			// this._callback(typeof data !== 'undefined' && data !== undefined);
		},(error) => {
			console.log(error);
			callbacK(false);
			// this._callback(false);
		});
	}

	/**
	 * Insert data into the data object on an update trigger (from Presenter).
	 *
	 * @param {Object} newData - New data passed in, of the form : {data: []}
	 * @param {Boolean} exists - If the bike already exists
	 * @param {Number} index - The index of the bike. Positive if it exists, negative if it doesn't
	 * @return {Boolean} true: Data was an edited value; false: Data was a new value
	 */
	_insertDataOnUpdate(newData, exists, index) {
		let i = 0;

		// If only one piece, just insert it
		if (this._data.data.length === 0) {
			this._data.data.push(newData.data);
			return false;
		}

		if (exists && index >= 0) {
			this._data.data[index] = newData.data;  // Data found, overwrite
			return true;
		} else {
			this._data.data.push(newData.data); // Appends to the list - Use this if only a single piece of data is passed in 
			return false; // Data not found
		}

		// if (i === this._data.data.length) {
		// 	this._data.data.push(newData.data); // Appends to the list - Use this if only a single piece of data is passed in 
		// 	return false; // Data not found
		// } else {
		// 	this._data.data[i] = newData.data;  // Data found, overwrite
		// 	return true;
		// }
	}

	/**
	 * Checks if the bike exists based on the data of the bike.
	 * 
	 * @param {Object} bikeData - The data to check
	 * @return {Boolean, Number} exists: true: If the bike exists; false: otherwise. index - The index of the bike if it exists, -1 if not
	 */
	_bikeDataExists(bikeData) {
		return this._bikeIDExists(bikeData.data.id)
	}

	/**
	 * Checks if the bike exists based on the id.
	 *
	 * @param {string} id - The id of a bike
	 * @return {Boolean, Number} exists: true: If the bike exists; false: otherwise. index - The index of the bike if it exists, -1 if not
	 */
	_bikeIDExists(id) {
		let i = 0;
		// Loop through and see if there's a match, probably a better way to do this with indexOf or filter
		while (i < this._data.data.length && this._data.data[i].id !== id) {
			i++;
		}
		const exists = i !== this._data.data.length;
		const index = exists ? i : -1;
		return { exists, index};
	}

	/**
	 * Checks if an object has a certain property.
	 * 
	 * @param {Object} obj - An object to check
	 * @param {string} property - The name of a property
	 * @return {Boolean} true: if the object has the property; false: otherwise
	 */
	_hasProperty(obj, property) {
		return obj.hasOwnProperty(property);
	}

	/**
	 * Insert data into the data object on a read from the database.
	 *
	 * @param {Object} databaseData - An objects of objects containing data from the database.
	 */
	_insertDataOnRead(databaseData) {
		let tempData = {data:[]};
		let dataID = 0;
		const currentUser = Database.getCurrentUser();

		if (databaseData != null) { // Check if there are objects in the database
			for (val in databaseData) {
				if (!this._hasProperty(databaseData[val], 'id')) { // If it doesn't have an id, skip it because it isn't valid
					continue;
				}

				// Bike page only displays current user
				if (currentUser == null || currentUser != databaseData[val].owner) {
					continue;
				}


				// Arrays don't show up in firebase so we manually have to insert to make sure we don't get errors in the view
				if (!this._hasProperty(databaseData[val], 'colour')) {
					databaseData[val].colour = [];
				}
				if (!this._hasProperty(databaseData[val], 'thumbnail')) {
					databaseData[val].thumbnail = [];
				}

				databaseData[val].dataID = dataID; // Assign a dataID which is just an incremental temporary value
				tempData.data.push(databaseData[val]);
				dataID++;
			}
			this._data = tempData;
		}
		// console.log(this._data);
	}
}

export default BikeModel;