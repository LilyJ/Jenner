import React, { Component } from 'react';
import {
  AppRegistry,
  AlertIOS,
  AsyncStorage,
  StyleSheet,
  Text,
  View,
  ScrollView,
  ListView,
  Navigator,
  TouchableHighlight,
  TouchableOpacity,
  SegmentedControlIOS,
  WebView,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import _ from 'lodash';

var DomParser = require('react-native-html-parser').DOMParser;
var data = undefined;
var fetchGoogleRss = function () {
  /* TODO: make query be user input*/
  var GOOGLE_FEED_API_URL = 'https://news.google.com/news/feeds?cf=all&ned=us&hl=en&q=education&output=rss';
  var url = GOOGLE_FEED_API_URL + encodeURIComponent(url);

  return fetch(url)
    .then((res) => res.text())
    .then((responseText) => {
      let doc = new DomParser().parseFromString(responseText,'text/html');

      items = Object.values(doc.getElementsByTagName('item'));

      data = items.filter( (i) => i.tagName === 'item')
                  .map(function(item) {
                    return ({
                      title: item.childNodes[0].firstChild.data,
                      link: item.childNodes[1].firstChild.data,
                      publishedDate: item.childNodes[3].firstChild.data,
                      description: item.childNodes[4].firstChild.data
                    });
                  });
      data = data;
    })
    .catch((error) => {
      console.log('Error fetching the feed: ', error);
    });
}


class MediaRow extends Component {
  _handleOnPress = () => {
    this.props.showWebContent(this.props.item.link);
  };

  render() {
    return(
      <TouchableHighlight style={mediaRow.container} onPress={this._handleOnPress}>
        <View>
          <Text style={mediaRow.title}>{this.props.item.title}</Text>
          <Text style={mediaRow.publishedDate}>{this.props.item.publishedDate}</Text>
        </View>
      </TouchableHighlight>
    );
  }
}

class MainPage extends Component {
  render() {
    return (
      <View>
        <ScrollView>
          {this.props.data.map( (item) => <MediaRow key={item.link} item={item} showWebContent={this.props.showWebContent} />)}
        </ScrollView>
      </View>
    );
  };
};

class Jenner extends Component {
  state = {
    selectedIndex: 0,
    topics: [],
    webContentLink: undefined,
    showSideNav: false,
    showModal: false
  };
  componentWillMount(){
    fetchGoogleRss();
    this.retriveTopicsFromStorage();
  }

  retriveTopicsFromStorage(){
    AsyncStorage.getItem('TOPICS', (err, topics) => {
      if (topics) {
        this.setState({
          topics: JSON.parse(topics)
        });
      } else {
        AsyncStorage.setItem('TOPICS', JSON.stringify(['Elon Musk']));
      };
    });
  };

  _onTabSwitch = (event) => {
    this.setState({
      selectedIndex: event.nativeEvent.selectedSegmentIndex
    });
  };

  _toggleSideNav = () => {
    currentState = this.state.showSideNav;
    this.setState({
      showSideNav: !currentState
    });
  };

  _showModal = () => {
    this.setState({
      showModal: true
    });
  }

  _showWebContent = (link, navigator) => {
    this.setState({
      webContentLink: link
    });
    navigator.push({
      index: 1,
      title: 'WebView'
    });
  }

  renderContent = (route, navigator) => {
    var showWebContent = (link) => { this._showWebContent(link, navigator)};
    if (this.state.selectedIndex === 0) {
      if (!!data) {
        return (<MainPage
                    data={data}
                    showWebContent={showWebContent}
                />);
      } else {
        return (<Text>Loading...</Text>);
      }
    } else {
      return (<Text>Placeholder</Text>);
    }
  }

  removeTopic(idx) {

    console.log(idx)

  }

  renderTopics() {
    topics = _.map(this.state.topics, (topic, idx) => {
      return(
        <ScrollView
            horizontal={true}
            directionalLockEnabled={true}
            key={idx}
            style={styles.sideNavRow}
            scrollEventThrottle= {100}
            onScroll={() => this.removeTopic(idx)}
        >
          <View style={{width: 200}}>
            <Text>{topic}</Text>
          </View>

          <View style={styles.sideNavRowRemoveButton}>
            <Text style={{fontSize: 10}}>Remove</Text>
          </View>
        </ScrollView>

      );
    });
    return topics;
  };
  addTopic(text){
    updatedTopics = this.state.topics.concat(text);

    this.setState({
      topics: updatedTopics
    });
    AsyncStorage.setItem('TOPICS', JSON.stringify(updatedTopics), (err) =>{
      if (err) {
        console.log('Error setItem to AsyncStorage:', error);
      }
    });
  };


  _renderSideNav = () => {
    renderTopics = this.renderTopics.bind(this);
    addTopic = this.addTopic.bind(this);
    if (this.state.showSideNav === true) {
      return (
        <View style={styles.sideNav}>
          <View>
            {renderTopics()}
          </View>
          <View style={{flex: 1}}>
            <TouchableHighlight
                style={styles.successButton}
                onPress={() => AlertIOS.prompt('Enter a topic', null, addTopic)}>

              <View style={styles.button}>
                <Text>
                  Add
                </Text>
              </View>
            </TouchableHighlight>
          </View>

        </View>
      );
    }
  }

  _renderScene = (route, navigator) => {
    if (route.index === 0) {
      return (
        <View style={styles.container}>
          <SegmentedControlIOS
              style={styles.tabs}
              values={['All', 'Two']}
              selectedIndex={this.state.selectedIndex}
              onChange={this._onTabSwitch}
          />
          {this.renderContent(route, navigator)}
      </View>
      );
    } else {
      return (
        <View style={{flex:1}}>
          <TouchableOpacity style={styles.navButton} onPress={() => navigator.pop()}>
            <Text>
              {'< Back'}
            </Text>
          </TouchableOpacity>
          <WebView
              source={{uri: this.state.webContentLink}}
              style={{marginTop: 40}}
              startInLoadingState={true}
              scalesPageToFit={true}
          />
        </View>
      );
    };
  }
  render() {
    const routes = [
      {title: 'Main', index: 0},
      {title: 'WebView', index: 1},
    ];

    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this._toggleSideNav}>
          <Icon name="menu" size={30} />
        </TouchableOpacity>
        {this._renderSideNav()}
        <Navigator
            initialRoute={routes[0]}
            initialRouteStack={routes}
            renderScene={this._renderScene}
        />
      </View>
    );
  }
}

const mediaRow = StyleSheet.create({
  container: {
    padding: 10,
    borderBottomWidth: 1
  },
  title: {

  },
  publishedDate: {
    fontSize: 11
  }
})

const styles = StyleSheet.create({
  tabs: {
    marginLeft: 20,
    marginRight: 20
  },
  navButton: {
    marginTop: 40
  },
  successButton: {
    backgroundColor: 'mediumspringgreen',
    padding: 1,
    borderRadius: 1,
    width: 50
  },
  sideNav: {
    paddingTop: 40,
    paddingLeft: 5,
    paddingRight: 5,
    borderRightWidth: 1,
    backgroundColor: 'white',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 200,
    zIndex: 1,
    transform: [] // TODO: figure out animation
  },
  sideNavRow: {
    flex: 1,
    alignItems: 'flex-end',
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    paddingLeft: 2,
    paddingRight: 2
  },
  sideNavRowRemoveButton: {
    backgroundColor: 'red',
    width: 50

  },
  container: {
    flex: 1,
    paddingTop: 30,
    paddingBottom: 30,
    paddingLeft: 10,
    paddingRight: 10
  }
});

AppRegistry.registerComponent('Jenner', () => Jenner);
