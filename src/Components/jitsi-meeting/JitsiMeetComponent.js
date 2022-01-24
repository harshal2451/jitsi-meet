import React, { Component } from 'react';
import "./JitsiMeetComponent.scss";
import AddToCalendar from '@culturehq/add-to-calendar';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import Button from "@material-ui/core/Button";
import "react-datepicker/dist/react-datepicker.css";
import date from 'date-and-time';

class JitsiMeetComponent extends Component {

  domain = 'beta.meet.jit.si'; // define domain for jitsi meet
  room = 'harshal-patil-room'; // define room name for meet

  api = {};

  constructor(props) {
    super(props);
    this.state = {
      room: this.room, // initialize room name
      calenderEventObject: null, // store calender event object
      enableEdit: false, // enable edit mode
      user: {
        name: 'Harshal Patil' // display user name
      },
      enableNotificationColumn: false, // enable notification column when message detected
      isAudioMuted: false, // handle audio mute operation
      isVideoMuted: false // handle video mute operation
    }
  }

  /*
    This method will start the meeting by creating the jitsi meeting object
  */
  startMeet = () => {
    const options = {
      roomName: this.state.room,
      width: '100%',
      height: 500,
      configOverwrite: { prejoinPageEnabled: false },
      parentNode: document.querySelector('#jitsi-iframe'),
      userInfo: {
        displayName: this.state.user.name
      }
    }

    // create jitsi meeting object
    this.api = new window.JitsiMeetExternalAPI(this.domain, options);

    // add event for incoming message
    this.api.addEventListeners({
      incomingMessage: this.incomingEndpointMessage,
    });
  }

  /*
    This method validate meeting date
    @params meetingDateArray
    @return true or false
  */
  validateMeetingDate(meetingDateArray) {
    let validDate = false

    // check whether the meeting date array length must be 3
    if (meetingDateArray.length === 3) {

      // check for only one digit format date
      if ((meetingDateArray[0].length === 1 && !isNaN(Number(meetingDateArray[0][0])))) {
        console.log("check for only one digit date");
        validDate = true;
      } 
      
      // check for two digit format date
      else if (meetingDateArray[0].length === 2 && !isNaN(Number(meetingDateArray[0][0])) && !isNaN(Number(meetingDateArray[0][1]))) {
        console.log("check for only two digit date");
        validDate = true;
      } 
      
      // check for more than two digit format date
      else if ((meetingDateArray[0].length > 2 && !isNaN(Number(meetingDateArray[0][0])))) {
        console.log("check for only more than two digit date");
        validDate = true;
      }
    }
    return validDate;
  }


  /*
    This method validate meetingtime
    @params meetingTimeArray
    @return true or false and new meeting time
  */
  validateMeetingTime(meetingTimeArray) {
    // check meeting time
    let validMeetingTime = false
    const regexTime = /[0-9]:[0-9]{2}/;
    let newMeetingTime = ""
    if (meetingTimeArray.length === 2) {
      let firstDigitChecked = false;

      // check meeting time for one digit  
      if (meetingTimeArray[0].length === 1 && !isNaN(Number(meetingTimeArray[0]))) {
        console.log("check when time digit is only one");
        validMeetingTime = true;
        firstDigitChecked = true;
        // add :00 for one digit time like 6:30
        newMeetingTime = meetingTimeArray[0] + ":00";
      }
      
      
      // check meeting time for 6:30 or 5:00 something
      else if (meetingTimeArray[0].length > 1 && regexTime.test(meetingTimeArray[0])) {
        console.log("check when time is more than one digit");
        validMeetingTime = true;
        firstDigitChecked = true;
      }

      // after checking the first digit then check the time format
      if (firstDigitChecked) {
        // check am pm
        if (meetingTimeArray[1].slice(0, meetingTimeArray[1].length-2).toLowerCase() === "am" || meetingTimeArray[1].slice(0, meetingTimeArray[1].length-2).toLowerCase() === "pm") {
          newMeetingTime += ` ${meetingTimeArray[1].slice(0, meetingTimeArray[1].length-2).toLowerCase()}`
          validMeetingTime = true;
        }
      }

    }
    return { validMeetingTime, newMeetingTime };
  }

  /*
    This method returns formatted date by removing date with nd, th, (ex 20th, 1st)
    @params meeting date
    @return new formatted date
  */
  getDayFromMeetingDate = (meetingDate) => {

    const dateArray = meetingDate.split(" ");
    let createDate = "";
    for (var date of dateArray[0]) {
      console.log(date);
      if (isNaN(Number(date))) {
        break;
      }
      createDate += date;
    }
    return createDate + " " + dateArray[1] + " " + dateArray[2];
  }

  /*
    This method fetch incoming message and check format of the meesage
    and enable notification column
  */
  incomingEndpointMessage = (e) => {
    try {
      // test the format of the message
      const testString = "can we schedule a call for";
      const regex = /^can we schedule a call for/;
      const { message } = e;
      const messageLowercase = message.toLowerCase().trim();
      if (regex.test(messageLowercase) && messageLowercase.includes("at") && messageLowercase.trim().charAt(message.length - 1) === "?") {
        const meetingDate = messageLowercase.split(testString).pop().split('at').shift().trim();
        // check meeting date
        console.log("meetingDate", meetingDate);
        if (this.validateMeetingDate(meetingDate.split(" "))) {
          const formattedMeetingDate = this.getDayFromMeetingDate(meetingDate);
          const date = new Date(formattedMeetingDate);
          if (date !== "Invalid Date") {
            const meetingTimeArray = messageLowercase.split("at").pop().trim().split(" ");
            // check meeting time if meeting date is valid
            const result = this.validateMeetingTime(meetingTimeArray);
            if (result.validMeetingTime) {
              const newMeetingDate = new Date(formattedMeetingDate + " " + result.newMeetingTime);
              if (newMeetingDate) {
                // add 1 hour to start date
                const startsAt = newMeetingDate.toISOString()
                const endsAt = moment(newMeetingDate).add(1, 'hour').toISOString();

                // create event object and set the state
                const eventObject = {
                  name: 'Follow-Up Meeting',
                  location: `https://${this.domain}/${this.room}`,
                  startsAt,
                  endsAt
                }
                this.setState({
                  calenderEventObject: eventObject,
                  enableNotificationColumn: true
                })
              }
            }
          }

        }

      }
    } catch (error) {
      this.setState({ enableNotificationColumn: false });
    }

  }
  

  // custom events
  executeCommand(command) {
    this.api.executeCommand(command);;
    if (command === 'hangup') {
      return this.props.history.push('/thank-you');
    }

    if (command === 'toggleAudio') {
      this.setState({ isAudioMuted: !this.state.isAudioMuted });
    }

    if (command === 'toggleVideo') {
      this.setState({ isVideoMuted: !this.state.isVideoMuted });
    }
  }

  componentDidMount() {
    if (window.JitsiMeetExternalAPI) {
      this.startMeet();
    } else {
      alert('JitsiMeetExternalAPI not loaded');
    }
  }

  render() {
    const { isAudioMuted, isVideoMuted } = this.state;
    return (
      <>
        <header className="nav-bar">
          <p className="item-left heading">Jitsi React</p>
        </header>
        <div className="container">
          <div id="jitsi-iframe" className='jitsi-frame'></div>
          {
            this.state.enableNotificationColumn &&
            <div className="notification-column">
              <div className="notification-header">
                <div className="sub-header">
                  <h4>Notifications</h4>
                  <span className="close-btn" onClick={() => this.setState({ enableNotificationColumn: false })}>&times;</span>
                </div>
                <span>Meeting Detected!</span>
              </div>

              <div className="edit-form">
                <div className="modal-body">
                  <form>
                    <table>
                      <tr>
                        <td>
                          <span>Name</span>
                        </td>
                        <td>
                          {
                            !this.state.enableEdit ? <label>{this.state.calenderEventObject.name}</label> : <input className="edit-text" type="text" value={this.state.calenderEventObject.name} onChange={(e) => this.setState({ calenderEventObject: { ...this.state.calenderEventObject, name: e.target.value } })}></input>
                          }
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span>Location</span>
                        </td>
                        <td>
                          {
                            !this.state.enableEdit ? <label>{this.state.calenderEventObject.location}</label> : <input className="edit-text" type="text" value={this.state.calenderEventObject.location} disabled></input>
                          }
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span>Start Time</span>
                        </td>
                        <td>
                          {
                            !this.state.enableEdit ? <label>{moment(this.state.calenderEventObject.startsAt).format("YYYY-MM-DD hh:mm a")}</label> : <DatePicker className="edit-text" minDate={new Date()} maxDate={date.addMonths(new Date(), 5)} dateFormat="yyyy/MM/dd hh:mm a" showTimeSelect selected={new Date(this.state.calenderEventObject.startsAt)} onChange={(date) => this.setState({ calenderEventObject: { ...this.state.calenderEventObject, startsAt: date } })} />
                          }
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span>End Time</span>
                        </td>
                        <td>
                          {
                            !this.state.enableEdit ? <label>{moment(this.state.calenderEventObject.endsAt).format("YYYY-MM-DD hh:mm a")}</label> : <DatePicker className="edit-text endsat" minDate={new Date()} maxDate={date.addMonths(new Date(), 5)} dateFormat="yyyy/MM/dd hh:mm a" showTimeSelect selected={new Date(this.state.calenderEventObject.endsAt)} onChange={(date) => this.setState({ calenderEventObject: { ...this.state.calenderEventObject, endsAt: date } })} />
                          }
                        </td>
                      </tr>
                    </table>
                    <p className='edit-desc'>Do you want to Edit this detail? <a href="#a" className="edit-link" onClick={() => this.setState({ enableEdit: true })}>Click Here</a> </p>
                  </form>
                </div>
                <div className="modal-footer">
                  {
                    !this.state.enableEdit ? <AddToCalendar event={this.state.calenderEventObject} /> : <Button className="save-btn" variant="contained" onClick={() => this.setState({ enableEdit: false })}>Save</Button>
                  }
                </div>
              </div>
            </div>
          }

        </div>

        <div className="item-center">
          <span>Custom Controls</span>
        </div>
        <div className="item-center">
          <span>&nbsp;&nbsp;</span>
          <i onClick={() => this.executeCommand('toggleAudio')} className={`fas fa-2x grey-color ${isAudioMuted ? 'fa-microphone-slash' : 'fa-microphone'}`} aria-hidden="true" title="Mute / Unmute"></i>
          <i onClick={() => this.executeCommand('hangup')} className="fas fa-phone-slash fa-2x red-color" aria-hidden="true" title="Leave"></i>
          <i onClick={() => this.executeCommand('toggleVideo')} className={`fas fa-2x grey-color ${isVideoMuted ? 'fa-video-slash' : 'fa-video'}`} aria-hidden="true" title="Start / Stop camera"></i>
          <i onClick={() => this.executeCommand('toggleShareScreen')} className="fas fa-film fa-2x grey-color" aria-hidden="true" title="Share your screen"></i>
        </div>

      </>
    );
  }
}

export default JitsiMeetComponent;