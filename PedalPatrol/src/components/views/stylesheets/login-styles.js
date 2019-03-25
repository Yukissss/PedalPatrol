import { StyleSheet } from 'react-native';
import { styles, text } from './base-styles';

const login_styles = StyleSheet.create({
	title:{
		color: 'black',
		fontWeight: 'bold',
		fontSize: 50,
	},
	centered:{
		alignItems:'center',
		marginTop:30,
	},
	centerText: {
		textAlign: 'center',
		marginTop:20,
		},
	editGroup: {
		margin: 20,
	},
	username: {
		marginTop: 30,
		height: 48,
		backgroundColor: '#F5FCFF',
		justifyContent: 'center',
		borderTopLeftRadius: 3,
		borderTopRightRadius: 3,
	},
	password: {
		marginTop: 10,
		height: 48,
		backgroundColor: '#F5FCFF',
		justifyContent: 'center',
		borderBottomLeftRadius: 3,
		borderBottomRightRadius: 3,
	},
	edit:{
		height: 40,
		fontSize: 13,
		backgroundColor: '#F5FCFF',
		paddingLeft: 15,
		paddingRight: 15,
	},
});

export { styles, text, login_styles }