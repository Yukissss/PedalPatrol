import React, {Component} from 'react';
import { Platform, AsyncStorage } from 'react-native';
import { createAppContainer } from 'react-navigation';

import { createRootNavigator } from './config/navigation';
import NavigatorService from './config/navigationservice';
import SideDrawer from './components/views/helpers/sidedrawer';

import NotificationMethod from './util/notification';
import firebase from 'react-native-firebase';
import config from './config/config.json';
import MapView from './components/views/home-view';
import AuthState from './util/authenticationstate';
import Database from './util/database';

export default class App extends Component {



async componentDidMount() {

    //getInitialNotification get the notification that triggers app open
        Database.getCurrentUser((userID) => {
        const hasPermission = NotificationMethod.checkPermission();
        });
        const notificationOpen: NotificationOpen = await firebase.notifications().getInitialNotification();
        if (notificationOpen) {
            const action = notificationOpen.action;
            const notification: Notification = notificationOpen.notification;
        }
    // Create the channel
        const channel = NotificationMethod.createChannel();
        firebase.notifications().android.createChannel(channel);

    // This listener is called when the app displays a notification
        this.notificationDisplayedListener = firebase.notifications().onNotificationDisplayed((notification: Notification) => {
            console.log('displayed');
            console.log(AuthState.currentUserID);
        });

    // This listener is called when the app receives a notification
        this.notificationListener = firebase.notifications().onNotification((notification: Notification) => {

            // If the platform is Android, there must be a channel (Android feature)
            notification
                .android.setChannelId('test-channel');
            firebase.notifications()
                .displayNotification(notification);

        });

    // This listener is called when the user opens a notification
        this.notificationOpenedListener = firebase.notifications().onNotificationOpened((notificationOpen: NotificationOpen) => {
            const action = notificationOpen.action;
            console.log('noOpend');
            const notification: Notification = notificationOpen.notification;
            firebase.notifications().removeAllDeliveredNotifications();

            // code for getting data from notification

            //test bike id
            const bikeID = "-LaaRyLnovrtxlh5WUu-";
            const params ={
                id: bikeID,
                from: 'Map'
            }
            NavigatorService.navigate('BikeDetails',params);
        });
    }
    componentWillUnmount() {
        this.notificationDisplayedListener();
        this.notificationListener();
        this.notificationOpenedListener();
    }


	render() {
		const Navigator = createAppContainer(createRootNavigator());
		// Wrap the navigator in the side drawer otherwise it won't work.
		// Need to add a top level navigator reference to be able to call other components from the drawer
		return <SideDrawer renderMainContent={() => {
			return (
				<Navigator 
					ref={(navigatorRef) => {
						NavigatorService.setTopLevelNavigator(navigatorRef);
					}} 
				/>
			)}
		}/>
	}
}
