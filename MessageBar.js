/**
 * Name: MessageBar
 * Description: A Message Bar Component displayed at the top of screen
 * https://github.com/talor-a/react-native-message-bar
 */
'use strict'

import React, { Component } from 'react'
import {
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image
} from 'react-native'

let windowWidth = Dimensions.get('window').width
let windowHeight = Dimensions.get('window').height

class MessageBar extends Component {
  constructor (props) {
    super(props)

    this.animatedValue = new Animated.Value(0)
    this.notifyAlertHiddenCallback = null
    this.alertShown = false
    this.timeoutHide = null

    this.state = this.getStateByProps(props)
    this.defaultState = this.getStateByProps(props)
  }

  componentDidMount () {
    // Configure the offsets prior to recieving updated props or recieving the first alert
    // This ensures the offsets are set properly at the outset based on the initial position.
    // This prevents the bar from appearing  and covering half of the screen when the
    // device is started in landscape and then rotated to portrait.
    // This does not happen after the first alert appears, as setNewState() is called on each
    // alert and calls _changeOffsetByPosition()
    let tempState = {position: this.state.position};

    this.setState(this._changeOffsetByPosition(tempState));
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    if (nextProps && Object.keys(nextProps).length > 0) {
      this.setNewState(nextProps)
    }
  }

  setNewState (state) {
    // Set the new state, this is triggered when the props of this MessageBar changed
    let newState = state;
    newState = this.getStateByProps(state);

    // Apply the colors of the alert depending on its alertType
    newState = this._applyAlertStylesheet(newState);//.alertType);

    // Override the opposition style position regarding the state position in order to have the alert sticks that position
    newState = this._changeOffsetByPosition(newState);//.position)
    this.setState(newState);
  }

  getStateByProps (props) {
    const def = this.defaultState || {}
    let state = {
      // Default values, will be overridden
      backgroundColor: '#007bff', // default value : blue
      strokeColor: '#006acd', // default value : blue
      titleColor: '#ffffff', // default value : white
      messageColor: '#ffffff', // default value : white
      animationTypeTransform: 'SlideFromTop', // default value

      /* Cusomisation of the alert: Title, Message, Icon URL, Alert alertType (error, success, warning, info), Duration for Alert keep shown */
      title: props.title,
      message: props.message,
      children: props.children,
      avatar: props.avatar,
      alertType: props.alertType || 'info',
      duration: props.duration || def.duration || 3000,

      /* Hide setters */
      get shouldHideAfterDelay () {
        if (props.shouldHideAfterDelay != undefined) { return props.shouldHideAfterDelay }
        if (def.shouldHideAfterDelay != undefined) { return def.shouldHideAfterDelay }
        return true
      },
      shouldHideOnTap: props.shouldHideOnTap == undefined &&
        def.shouldHideOnTap == undefined
          ? true
          : props.shouldHideOnTap || def.shouldHideOnTap,

      /* Callbacks method on Alert Tapped, on Alert Show, on Alert Hide */
      onTapped: props.onTapped || def.onTapped,
      onShow: props.onShow || def.onShow,
      onHide: props.onHide || def.onHide,

      /* Stylesheets */
      stylesheetInfo: props.stylesheetInfo ||
      def.stylesheetInfo || {
        backgroundColor: '#007bff',
        strokeColor: '#006acd',
        titleColor: '#ffffff',
        messageColor: '#ffffff'
      }, // Default are blue colors
      stylesheetSuccess: props.stylesheetSuccess ||
      def.stylesheetSuccess || {
        backgroundColor: 'darkgreen',
        strokeColor: 'darkgreen',
        titleColor: '#ffffff',
        messageColor: '#ffffff'
      }, // Default are Green colors
      stylesheetWarning: props.stylesheetWarning ||
      def.stylesheetWarning || {
        backgroundColor: '#ff9c00',
        strokeColor: '#f29400',
        titleColor: '#ffffff',
        messageColor: '#ffffff'
      }, // Default are orange colors
      stylesheetError: props.stylesheetError ||
      def.stylesheetError || {
        backgroundColor: '#ff3232',
        strokeColor: '#FF0000',
        titleColor: '#ffffff',
        messageColor: '#ffffff'
      }, // Default are red colors
      stylesheetExtra: props.stylesheetExtra ||
      def.stylesheetExtra || {
        backgroundColor: '#007bff',
        strokeColor: '#006acd',
        titleColor: '#ffffff',
        messageColor: '#ffffff'
      }, // Default are blue colors, same as info

      /* Duration of the animation */
      durationToShow: props.durationToShow || def.durationToShow || 350,
      durationToHide: props.durationToHide || def.durationToHide || 350,

      /* Offset of the View, useful if you have a navigation bar or if you want the alert be shown below another component instead of the top of the screen */
      viewTopOffset: props.viewTopOffset || def.viewTopOffset || 0,
      viewBottomOffset: props.viewBottomOffset || def.viewBottomOffset || 0,
      viewLeftOffset: props.viewLeftOffset || def.viewLeftOffset || 0,
      viewRightOffset: props.viewRightOffset || def.viewRightOffset || 0,

      /* Inset of the view, useful if you want to apply a padding at your alert content */
      viewTopInset: props.viewTopInset || def.viewTopInset || 0,
      viewBottomInset: props.viewBottomInset || def.viewBottomInset || 0,
      viewLeftInset: props.viewLeftInset || def.viewLeftInset || 0,
      viewRightInset: props.viewRightInset || def.viewRightInset || 0,

      /* Padding around the content, useful if you want a tiny message bar */
      messageBarPadding: props.messageBarPadding || def.messageBarPadding || 10,

      /* Number of Lines for Title and Message */
      titleNumberOfLines:
        props.titleNumberOfLines == undefined &&
        def.titleNumberOfLines == undefined
          ? 1
          : props.titleNumberOfLines || def.titleNumberOfLines,
      messageNumberOfLines:
        props.messageNumberOfLines == undefined &&
        def.titleNumberOfLines == undefined
          ? 2
          : props.messageNumberOfLines || def.messageNumberOfLines,

      /* Style for the text elements and the avatar */
      titleStyle: props.titleStyle || def.titleStyle || {
        fontSize: 18,
        fontWeight: 'bold'
      },
      messageStyle: props.messageStyle || def.messageStyle || {
        fontSize: 16
      },
      avatarStyle: props.avatarStyle || def.avatarStyle || {
        height: 40,
        width: 40,
        borderRadius: 20
      },

      /* Position of the alert and Animation Type the alert is shown */
      position: props.position || def.position || 'top',
      animationType: props.animationType || def.animationType
    }
    return state;
  }

  /*
  * Show the alert
  */
  showMessageBarAlert () {
    // If an alert is already shonw or doesn't have a title or a message, do nothing
    if (
      this.alertShown ||
      (this.state.title == null && this.state.message == null && this.state.children == null)
    ) {
      return
    }

    // Set the data of the alert in the state
    this.alertShown = true

    // Display the alert by animating it from the top of the screen
    // Auto-Hide it after a delay set in the state
    Animated.timing(this.animatedValue, {
      toValue: 1,
      duration: this.state.durationToShow,
      useNativeDriver: true
    }).start(this._showMessageBarAlertComplete())
  }

  /*
  * Hide the alert after a delay, typically used for auto-hidding
  */
  _showMessageBarAlertComplete () {
    // Execute onShow callback if any
    this._onShow()

    // If the duration is null, do not hide the
    if (this.state.shouldHideAfterDelay) {
      this.timeoutHide = setTimeout(() => {
        this.hideMessageBarAlert()
      }, this.state.duration)
    }
  }

  /*
  * Return true if the MessageBar is currently displayed, otherwise false
  */
  isMessageBarShown () {
    return this.alertShown
  }

  /*
  * Hide the alert, typically used when user tap the alert
  */
  hideMessageBarAlert () {
    // Hide the alert after a delay set in the state only if the alert is still visible
    if (!this.alertShown) {
      return
    }

    clearTimeout(this.timeoutHide)

    // Animate the alert to hide it to the top of the screen
    Animated.timing(this.animatedValue, {
      toValue: 0,
      duration: this.state.durationToHide,
      useNativeDriver: true
    }).start(this._hideMessageBarAlertComplete())
  }

  _hideMessageBarAlertComplete () {
    // The alert is not shown anymore
    this.alertShown = false

    this._notifyAlertHidden()

    // Execute onHide callback if any
    this._onHide()
  }

  /*
  * Callback executed to tell the observer the alert is hidden
  */
  _notifyAlertHidden () {
    if (this.notifyAlertHiddenCallback) {
      this.notifyAlertHiddenCallback()
    }
  }

  /*
  * Callback executed when the user tap the alert
  */
  _alertTapped () {
    // Hide the alert
    if (this.state.shouldHideOnTap) {
      this.hideMessageBarAlert()
    }

    // Execute the callback passed in parameter
    if (this.state.onTapped) {
      this.state.onTapped()
    }
  }

  /*
  * Callback executed when alert is shown
  */
  _onShow () {
    if (this.state.onShow) {
      this.state.onShow()
    }
  }

  /*
  * Callback executed when alert is hidden
  */
  _onHide () {
    if (this.state.onHide) {
      this.state.onHide()
    }
  }

  /*
  * Change the background color and the line stroke color depending on the alertType
  * If the alertType is not recognized, the 'info' one (blue colors) is selected for you
  */
  _applyAlertStylesheet (state) {
    // Set the Background color and the line stroke color of the alert depending on its alertType
    // Set to blue-info if no alertType or if the alertType is not recognized

    let backgroundColor
    let strokeColor
    let titleColor
    let messageColor

    switch (state.alertType) {
      case 'success':
        backgroundColor = state.stylesheetSuccess.backgroundColor
        strokeColor = state.stylesheetSuccess.strokeColor
        titleColor = state.stylesheetSuccess.titleColor
        messageColor = state.stylesheetSuccess.messageColor
        break
      case 'error':
        backgroundColor = state.stylesheetError.backgroundColor
        strokeColor = state.stylesheetError.strokeColor
        titleColor = state.stylesheetError.titleColor
        messageColor = state.stylesheetError.messageColor
        break
      case 'warning':
        backgroundColor = state.stylesheetWarning.backgroundColor
        strokeColor = state.stylesheetWarning.strokeColor
        titleColor = state.stylesheetWarning.titleColor
        messageColor = state.stylesheetWarning.messageColor
        break
      case 'info':
        backgroundColor = state.stylesheetInfo.backgroundColor
        strokeColor = state.stylesheetInfo.strokeColor
        titleColor = state.stylesheetInfo.titleColor
        messageColor = state.stylesheetInfo.messageColor
        break
      default:
        backgroundColor = state.stylesheetExtra.backgroundColor
        strokeColor = state.stylesheetExtra.strokeColor
        titleColor = state.stylesheetExtra.titleColor
        messageColor = state.stylesheetExtra.messageColor
        break
    }

    state.backgroundColor = backgroundColor;
    state.strokeColor = strokeColor;
    state.titleColor = titleColor;
    state.messageColor = messageColor;

    return state;
  }

  /*
  * Change view<Position>Offset property depending on the state position
  */
  _changeOffsetByPosition (state) {
    switch (state.position) {
      default:
      case 'top':
        state.viewBottomOffset= null
        break
      case 'bottom':
        state.viewTopOffset= null
        break
    }
    return state;
  }

  /*
  * Set the animation transformation depending on the chosen animationType, or depending on the state's position if animationType is not overridden
  */
  _applyAnimationTypeTransformation () {
    let position = this.state.position
    let animationType = this.state.animationType

    if (animationType === undefined) {
      if (position === 'bottom') {
        animationType = 'SlideFromBottom'
      } else {
        // Top by default
        animationType = 'SlideFromTop'
      }
    }

    switch (animationType) {
      case 'SlideFromTop':
        var animationY = this.animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [-windowHeight, 0]
        })
        this.animationTypeTransform = [{ translateY: animationY }]
        break
      case 'SlideFromBottom':
        var animationY = this.animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [windowHeight, 0]
        })
        this.animationTypeTransform = [{ translateY: animationY }]
        break
      case 'SlideFromLeft':
        var animationX = this.animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [-windowWidth, 0]
        })
        this.animationTypeTransform = [{ translateX: animationX }]
        break
      case 'SlideFromRight':
        var animationX = this.animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [windowWidth, 0]
        })
        this.animationTypeTransform = [{ translateX: animationX }]
        break
      default:
        var animationY = this.animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [-windowHeight, 0]
        })
        this.animationTypeTransform = [{ translateY: animationY }]
        break
    }
  }

  /*
  * Alert Rendering Methods
  */

  render () {
    // Set the animation transformation depending on the chosen animationType, or depending on the state's position if animationType is not overridden
    this._applyAnimationTypeTransformation()

    return (
      <Animated.View
        style={{
          transform: this.animationTypeTransform,
          backgroundColor: this.state.backgroundColor,
          borderColor: this.state.strokeColor,
          borderBottomWidth: 1,
          position: 'absolute',
          top: this.state.viewTopOffset,
          bottom: this.state.viewBottomOffset,
          left: this.state.viewLeftOffset,
          right: this.state.viewRightOffset,
          paddingTop: this.state.viewTopInset,
          paddingBottom: this.state.viewBottomInset,
          paddingLeft: this.state.viewLeftInset,
          paddingRight: this.state.viewRightInset
        }}>
        <TouchableOpacity
          onPress={() => {
            this._alertTapped()
          }}
          style={{ flex: 1 }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'flex-end',
              padding: this.state.messageBarPadding
            }}>
            {this.renderImage()}
            <View
              style={{
                flex: 1,
                flexDirection: 'column',
                alignSelf: 'stretch',
                justifyContent: 'center',
                marginLeft: 10
              }}>
              {this.renderTitle()}
              {this.renderMessage()}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  renderImage () {
    if (this.state.avatar != null) {
      var imageSource
      var avatar = this.state.avatar

      if (typeof avatar === 'string') {
        if (avatar.match(/^https?:/)) {
          // this is a network file
          imageSource = { uri: avatar }
        } else {
          // this is a local file : require('<path/to/my/local/image.extension>')
          imageSource = avatar
        }

        return <Image source={imageSource} style={this.state.avatarStyle} />
      } else if (React.isValidElement(avatar)) {
        // this is a react component
        return avatar
      }
    }
  }

  renderTitle () {
    if (this.state.title != null) {
      return (
        <Text
          numberOfLines={this.state.titleNumberOfLines}
          style={[this.state.titleStyle, (this.state.titleColor?{color: this.state.titleColor}:null)]}>
          {this.state.title}
        </Text>
      )
    }
  }

  renderMessage () {
    var controls = [];
    if (this.state.message != null) {
      controls.push(
        <Text
          key="message"
          numberOfLines={this.state.messageNumberOfLines}
          style={[this.state.messageStyle,  (this.state.messageColor?{color: this.state.messageColor}:null)]}>
          {this.state.message}
        </Text>
      )
    }
    if (this.state.children != null) {
      controls.push(
          this.state.children
      );
    }
    return controls;
  }
}

module.exports = MessageBar
