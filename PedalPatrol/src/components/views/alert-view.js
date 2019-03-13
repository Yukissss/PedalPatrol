import React, { Component } from 'react';
import { StyleSheet, FlatList, View, TouchableHighlight, RefreshControl, Alert } from 'react-native';
import { Icon } from 'react-native-elements';
import { HeaderBackButton } from 'react-navigation';

import SafeArea from './helpers/safearea';
import NotificationBikeItemHelper from './helpers/notificationbikeitem';
import SearchBarHelper from './helpers/searchbar';
import BaseView from './view';
import AlertPresenter from '../presenters/alert-presenter';

/**
 * Class for the Home view
 * @extends BaseView
 */
class HomeView extends BaseView {
	/**
	 * Creates an instance of BikeView
	 *
	 * @constructor
	 * @param {Object} props - Component properties
	 */
	constructor(props) {
		super(props);
		this.resetState();
		this._renderItem = this._renderItem.bind(this);
		this._renderSearchBar = this._renderSearchBar.bind(this);
		this.AlertP = new AlertPresenter(this);
	}

	/**
	 * Set the navigation options, change the header to handle a back button.
	 *
	 * @return {Object} Navigation option
	 */
	static navigationOptions = ({navigation, transitioning}) => {
		return {
			headerLeft: (<HeaderBackButton disabled={transitioning} onPress={()=>{navigation.state.params._onBack()}}/>),
			title: navigation.getParam('title', 'Alerts') // Default title is Alerts
		};
	}

	/**
	 * Resets the state 
	 */
	resetState = () => {
		this.state = { refresh: true, data: [], refreshing: false };
	}

	/**
	 * Renders an item from a list to the screen by extracting data.
	 * 
	 * @param {Object} item - An item to be rendered
	 */
	_renderItem = ({item}) => (
		<NotificationBikeItemHelper
			data={item}
			type={'found'}
			navigation={this.props.navigation}/>
	);

	// Temporary alert until filter feature is implemented
	temporaryFilter = () => {
		Alert.alert(
			"The search filter is currently disabled.",
			"Sorry for any inconvenience.",
			[
				{ text: "Ok", style: "ok" },
			],
			{ cancelable: false },
		);
	}

	/**
	 * Renders a search bar as the header including the profile icon and the filter button.
	 * TODO : Get profile picture from profile page
	 */
	_renderSearchBar = () => (
		<SearchBarHelper 
			handleSearchFilter={(text) => this.AlertP.handleSearchFilter(text)}
			handleSearchCancel={this.AlertP.handleSearchCancel}
			handleSearchClear={this.AlertP.handleSearchClear}
			openFilter={this.temporaryFilter}
			profilePicture={'https://i.imgur.com/uWzNO72.jpg'}/>
	);


	/**
	 * Refreshes the state of the component so new data is fetched.
	 */
	refreshState = () => {
		this.setState({ 
			refresh: !this.state.refresh
		});
	};

	/**
	 * Triggers when a component or this component is mounted.
	 */
	componentWillMount = () => {
		// There's a problem with clicking the back button too quickly so need to find a better place to put this
		this.props.navigation.setParams({
			_onBack: this._onBack
		});

		this.setState({
			data: this.AlertP.getData()
		});
	};


	/**
	 * Component is about to unmount, do any cleanup here.
	 * Call viewUnmounting in base class so it can do any cleanup for the view before calling the presenter destroy method
	 */
	componentWillUnmount = () => {
		this.viewUnmounting(this.AlertP);
	}

	/**
	 * When the back button is clicked, check if the user was editing.
	 */
	_onBack = () => {
		this.props.navigation.navigate('Tabs');
	}

	/**
	 * Triggers a force refresh of the view
	 */
	_onRefresh = () => {
		this.AlertP.forceRefresh();
	}

	/**
	 * Extracts the item id as a string.
	 *
	 * @param {Object} item - An item being rendered
	 * @param {Number} index - The index of the item 
	 */
	_keyExtractor = (item, index) => item.dataID.toString();

	/**
	 * Renders the screen
	 */
	render() {
		// RefreshControl (below) allows for the pull down of the list to update it
		return (	
				<View style={styles.container}>
					<SafeArea/>
					<FlatList
						data={this.state.data}
						extraData={this.state.refresh}
						keyExtractor={this._keyExtractor}
						renderItem={this._renderItem}
						refreshControl={
						    <RefreshControl
						        colors={["#9Bd35A", "#689F38"]}
						        refreshing={this.state.refreshing}
						        onRefresh={() => this._onRefresh()}
						    />
						}>
					</FlatList>
				</View>
				);
	};

};

export default HomeView;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F5FCFF',
	}
});