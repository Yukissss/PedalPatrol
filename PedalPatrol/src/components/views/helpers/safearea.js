import React, { Component } from 'react';
import {SafeAreaView} from 'react-native';

/**
 * Class to render a safe area on the scren
 */
class SafeArea extends Component {
	render() {
		return (
			<SafeAreaView style={{ flex:0, backgroundColor: this.props.overrideColour ? this.props.overrideColour : '#F5FCFF' }} />
		);
	};
}

export default SafeArea;