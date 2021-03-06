import BasePresenter from './presenter';
import { BikeM } from '../models/export-models'; // Using the BikeModel class because an AddBikeModel class would have the same purpose
import ImageUtil from '../../util/imageutility';

const NO_DATA = 'NO-DATA';
const BIKE_TYPE = ImageUtil.getTypes().BIKE;

/**
 * Class for the AddBike presenter and view
 * @extends BasePresenter
 */
class AddBikePresenter extends BasePresenter {
	/**
	 * Creates an instance of AddBikePresenter
	 *
	 * @constructor
	 * @param {Object} view - An instance of a view class
	 */
	constructor(view) {
		super();
		this.view = view;
		this.currentPhotos = Object.assign(ImageUtil.getPhotoEntries(BIKE_TYPE));
		// this.currentPhotos = Object.assign(ImageUtil.getPhotoEntries());
		BikeM.subscribe(this);
	}

	/**
	 * Updates the bike model with new data.
	 *
	 * @param {Object} newData - New data to update the model's data with.
	 * @param {Function} callback - A function that will execute a callback when accessing is complete
	 */
	update = (newData, callback) => {
		const builtData = this._buildDataFromView(newData);

		// TODO : Proper checking to see if it was uploaded. Consider adding callback to onUpdated
		BikeM.setCallback(callback);

		BikeM.update(builtData);
	}

	/**
	 * Delete a bike from the database
	 *
	 * @param {string} id - A bike id to delete
	 * @param {Function} callback - A function to call when remove succeeds or fails
	 */
	deleteBike = (id, callback) => {
		BikeM.deleteBikeByID(id, (dataRemoved) => {
			// Need to do any processing here?
			callback(dataRemoved);
		});
	}

	/**
	 * Build the data obtained from the view and insert it into a new data object.
	 * Current attributes of newData object: 
	 * 			{Object} inputTextData: [{name, multiline, disabled, text}]
	 * 			{List} selectedColours
	 * 			{Object} picture: uri
	 *		
	 *
	 * @param {Object} newData - The new data from the view. 
	 * @return {Object} The built data of the object. Attributes: data
	 */
	_buildDataFromView = (newData) => {
		const inputTextData = newData.inputTextData;
		const selectedColours = newData.selectedColours;
		const pictureSource = newData.picture;
		const currentID = newData.currentID;

		// Just add the data into an object. More concise way to do this?
		let builtData = {
			data: {
				id: currentID,
				name: inputTextData[inputDataList.index.name].text,
				model: inputTextData[inputDataList.index.model].text,
				brand: inputTextData[inputDataList.index.brand].text,
				colour: selectedColours,
				serial_number: inputTextData[inputDataList.index.serial_number].text,
				wheel_size: inputTextData[inputDataList.index.wheel_size].text,
				frame_size: inputTextData[inputDataList.index.frame_size].text,
				notable_features: inputTextData[inputDataList.index.notable_features].text,
				thumbnail: pictureSource != null ? pictureSource : [{illustration: ImageUtil.getDefaultImage(BIKE_TYPE)}],
			}
		}

		return builtData;
	}


	/**
	 * Called when the model is updated with new data. Refreshes the state of the view.
	 * Method is supplied with the data to add.
	 * Better way to refresh the state?
	 *
	 * @param {Object} newData - New data to add.
	 */
	onUpdated = (newData) => {
		// Do something with the new data or let the view auto update?
		// console.log(newData)
		this.view.refreshState();
	};

	/**
	 * Gets the data from the model and returns it to the caller.
	 *
	 * @return {Object} Data from the model.
	 */
	getData = () => {
		return JSON.parse(JSON.stringify(BikeM.get().data));
	};

	/**
	 * If the view or presenter is destroyed, unsubscribe the presenter from the model.
	 */
	onDestroy = () => {
		BikeM.unsubscribe(this);
	};


	/**
	 * Checks the editing state of the view and calls one of its passed in functions.
	 *
	 * @param {Boolean} editingState - The editing state of the view
	 * @param {Function} success - A function to call on a true value of the editing state
	 * @param {Function} failure - A function to call on a false value of the editing state
	 */
	checkEditingState = (editingState, success, failure) => {
		// Do any checks on the editing state
		if (editingState) {
			success();
		} else {
			failure();
		}
	}

	
	/**
	 * Open the image picker. Set the editing option to true.
	 *
	 * @param {Object} imagePicker - The ImagePicker class from react-native-image-picker
	 * @param {Function} setEditing - A function so the presenter can set the editing value
	 * @param {Number} id - The index of the photo to change
	 * @param {List} photos - A list of photos as strings
	 */
	selectPhotoTapped(imagePicker, setEditing, id, photos) {
		const options = {
			quality: 1.0,
			maxWidth: 500,
			maxHeight: 500,
			storageOptions: {
				skipBackup: true,
			},
		};

		 // Set the editing state to true by calling a passed in function where the view can do what it needs to
		setEditing(true);

		imagePicker.showImagePicker(options, (response) => {
			console.log('Response = ', response);

			if (response.didCancel) {
				console.log('User cancelled photo picker');
			} else if (response.error) {
				console.log('ImagePicker Error: ', response.error);
			} else if (response.customButton) {
				console.log('User tapped custom button: ', response.customButton);
			} else {
				let source = { uri: response.uri };

				// You can also display the image using data:
				// let source = { uri: 'data:image/jpeg;base64,' + response.data };

				photos[id].illustration = source;
				this.currentPhotos = photos;

				console.log(id, photos);

				this.view.setState({
					photoEntries: JSON.parse(JSON.stringify(this.currentPhotos)),
				});

				this.view.refreshState();
			}
		});
	}


	/**
	 * Converts a list of colour objects to a list of objects with a component using the renderer function.
	 *
	 * @param {List} colours - A list of colour objects (name, colour)
	 * @param {Function} renderer - A function that will produce the component to render for this colour
	 */
	changeText = (colours, renderer) => {
		let new_colours = []
		let new_item = {}
		let count = 0
		for (const item of colours) {
			const colour = item.colour
			new_item.text_component = renderer(colour, item.name); // Render the component using a callback
			// <Text style={[{color: colour}, styles.colourText]}>{item.name}</Text>
			new_item.name = item.name;
			new_colours.push(new_item);
			new_item = {} // Need to reset the item because sometimes it doesn't clear
		}
		
		// Yeah don't do this, but calling a function in the view doesn't seem to work well either
		this.view.setState({
			colours: new_colours
		});
	}

	/**
	 * @private
	 * Makes sure the object with the key exists.
	 */
	getProp = (object, key) => object && this.check(object[key]);

	/**
	 * @private
	 * Simple regex check
	 * 
	 * return {Boolean}
	 */
	check = (s) => {
		return s.replace(/[\W\[\] ]/g, function (a) {
			return a;
		})
	};

	/**
	 * @private
	 * This function is an adaptation of the filter function used in SectionedMultiSelect.
	 * This one filters on uniqueKey instead of displayKey and ignores accents since it is
	 * a predefined list of colours.
	 *
	 * Link: https://github.com/renrizzolo/react-native-sectioned-multi-select/blob/master/exampleapp/App.js#L337
	 */
	filterItems = (searchTerm, items, { subKey, displayKey, uniqueKey }) => {
		let filteredItems = [];
		let newFilteredItems = [];
		items.forEach((item) => {
			const parts = searchTerm.trim().split(/[[ \][)(\\/?\-:]+/);
			const regex = new RegExp(`(${parts.join('|')})`, 'i');
			if (regex.test(this.getProp(item, uniqueKey))) {
				filteredItems.push(item);
		  	}
			if (item[subKey]) {
				const newItem = Object.assign({}, item);
				newItem[subKey] = [];
				item[subKey].forEach((sub) => {
					if (regex.test(this.getProp(sub, uniqueKey))) {
						newItem[subKey] = [...newItem[subKey], sub];
						newFilteredItems = this.rejectProp(filteredItems, singleItem =>
					  		item[uniqueKey] !== singleItem[uniqueKey]);
						newFilteredItems.push(newItem);
						filteredItems = newFilteredItems;
					}
				})
		  	}
		})
		return filteredItems
	}

	/**
	 * Checks the input data for required inputs and calls an alert function if inputs are missing.
	 *
	 * @param {List} inputData - A list of input data (see inputDataList for structure)
	 * @param {Function} inputRequirementFailure - A function that will define the alert to be displayed.
	 * @return {Boolean} true: some required inputs are blank; false: required inputs are not blank
	 */
	checkInputs = (inputData, inputRequirementFailure) => {
		const all_defaults = ImageUtil.checkPhotosForDefaults(BIKE_TYPE, this.currentPhotos);
		let required = this._getRequiredInputs(inputData);
		let names = [];
		for (let i=0; i < required.length; i++) {
			if (required[i].text === "") { // If it's empty then push
				names.push(required[i].name);
			}
		}

		if (names.length !== 0 || all_defaults) { // If inputs or images were empty, call the callback
			all_defaults ? names.push('Images') : '';
			inputRequirementFailure(names);
			return false;
		} else {
			return !!(true & !all_defaults); // !! converts to boolean because '&' converts to number
		}
	}

	/**
	 * Returns the required inputs based on the required property
	 *
	 * @param {List} inputs - A list of input data
	 * @return {List} A list of required text inputs
	 */
	_getRequiredInputs = (inputs) => {
		return inputs.filter(obj => {return obj.required});
	}


	/**
	 * Return the data for the text inputs.
	 * Object:
	 *		name: the name/label of the text input
	 * 		disabled: true: if the field is disabled; false: otherwise
	 * 		multiline: true: if the input is allowed to span multiple lines; false: otherwise
	 *		text: initial text of the input
	 *
	 * @param {Object} data - type 'Object' if there is data, type 'string' if no data
	 * @param {Boolean} isEditPage - true: If the current page is 'Edit Bike' page; false: If 'Add Bike' page
	 * @return {List} A list of data objects (name, multiline, text)
	 */
	getTextInputData = (data, isEditPage) => {
		// Do something with isEditPage to make sure that data isn't cleared that can't be edited.
		// For example, if we don't want user to edit the Serial Number, it would be disabled and not cleared when the 'Clear' button is clicked
		return data === NO_DATA ? this._deepCopy(inputDataList.data) : this._translateDataToInput(data);
	}


	/**
	 * Translates data input (Bike data) to the text inputs. Could be refactored to be made easier for adaptations.
	 *
	 * @param {Object} data - The data from the view (=== 'NO-DATA' if not set)
	 * @return {List} A copy of the data that is now in the form of the text input
	 */
	_translateDataToInput = (data) => {
		let dataCopy = this._deepCopy(inputDataList.data);

		// To be safe, convert data to string
		dataCopy[inputDataList.index.name].text 				= this._getString(data.name);
		dataCopy[inputDataList.index.serial_number].text 		= this._getString(data.serial_number);
		dataCopy[inputDataList.index.brand].text 				= this._getString(data.brand);
		dataCopy[inputDataList.index.model].text				= this._getString(data.model);
		dataCopy[inputDataList.index.notable_features].text 	= this._getString(data.notable_features);
		dataCopy[inputDataList.index.wheel_size].text			= this._getString(data.wheel_size);
		dataCopy[inputDataList.index.frame_size].text			= this._getString(data.frame_size);

		const thumbnail = ImageUtil.formThumbnail(data.thumbnail);
		this.currentPhotos = ImageUtil.addRemainingDefaults(BIKE_TYPE, thumbnail);
		this.view.setState({ currentID: data.id });

		return this._deepCopy(dataCopy); 
	}

	/**
	 * Checks if the value is valid and if so, convert it to a string.
	 *
	 * @param {Number/string} val - A number or string to check
	 * @return {string} Value converted to a string
	 */
	_getString = (val) => {
		return val == undefined || val == null ? '' : val.toString();
	}

	/**
	 * Resets the current photos to the default photos.
	 */
	clearPhotos = () => {
		this.currentPhotos = ImageUtil.getDefaultPhotos(BIKE_TYPE);
	}

	/**
	 * Returns a deep copy of the current photos.
	 *
	 * @return {List} A list of the current photos
	 */
	getCurrentPhotos = () => {
		return JSON.parse(JSON.stringify(this.currentPhotos));
	}

	/**
	 * Returns a deep copy of the array by reassigning the values. This is to make sure we can clear the data.
	 *
	 * @return {List} A list to copy
	 */
	_deepCopy = (array) => {
		return array.map(a => Object.assign({}, a));
	}


	/**
	 * Toggles the colours from the data if the data is present.
	 *
	 * @param {Object} sectionedMultiSelect - The multi select component from the view
	 * @param {Object} data - The data from the view (=== 'NO-DATA' if not set)
	 * @param {Function} onColoursFound - A function that submits the selected items back to the view
	 * @param {string} UNIQUE_KEY - A unique key that is used to get the data from the item (same one that is used when defining the sectioned select)
	 */
	toggleColours = (sectionedMultiSelect, data, onColoursFound, UNIQUE_KEY) => {
		let selectedItems = [];
		if (data !== NO_DATA) {
			for (const colour of data.colour) {
				item = sectionedMultiSelect._findItem(colour);
				sectionedMultiSelect._itemSelected(item);
				sectionedMultiSelect._toggleItem(item, false);
				selectedItems.push(item[UNIQUE_KEY]); // Unique key corresponding to sectioned list
			}
			onColoursFound(selectedItems);
		}
	}
}

export default AddBikePresenter;


// List of text inputs for adding bike. Items in list appear in this order
/*
 * data:
 *		name: The name/label of the text input
 *		disabled: true: if the user can edit the field; false: otherwise
 *		multiline: true: if the user's text can span multiple lines; false: otherwise
 *		text: The initial text of the name/label
 */
const inputDataList = {
	index: {
		brand: 				0,
		model:				1,
		serial_number: 		2,
		notable_features: 	3,
		wheel_size:			4,
		frame_size:			5,
		name: 				6,
	},
	data: [
		{
			name: 'Brand',
			multiline: false,
			disabled: false,
			required: true,
			text: ''
		},
		{
			name: 'Model',
			multiline: false,
			disabled: false,
			required: true,
			text: ''
		},
		{
			name: 'Serial Number',
			multiline: false,
			disabled: false,
			required: true,
			text: ''
		},
		{
			name: 'Notable Features',
			multiline: true,
			disabled: false,
			required: false,
			text: ''
		},
		{
			name: 'Wheel Size',
			multiline: false,
			disabled: false,
			required: false,
			text: ''
		},
		{
			name: 'Frame Size',
			multiline: false,
			disabled: false,
			required: false,
			text: ''
		},
		{
			name: 'Nickname',
			multiline: false,
			disabled: false,
			required: false,
			text: '',
		}
	]
}