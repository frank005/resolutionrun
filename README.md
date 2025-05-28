# Resolution Run

A demonstration application showcasing Agora's custom resolution capabilities for video streaming. This project allows users to test and experiment with different video resolution settings in real-time.

## Features

- Real-time video streaming with customizable resolution settings
- Adjustable video parameters:
  - Width and Height
  - Framerate
  - Bitrate
- Device selection for camera and microphone
- Real-time statistics display for both local and remote streams
- Support for Agora token authentication
- String UID support

## Prerequisites

- Modern web browser with WebRTC support
- Agora account and App ID
- Camera and microphone access

## Setup

1. Clone this repository:
```bash
git clone https://github.com/yourusername/resolutionrun.git
cd resolutionrun
```

2. Open `index.html` in your web browser or serve it using a local web server.

3. Enter your Agora App ID and Channel Name in the settings menu.

4. Configure your desired video settings:
   - Select your camera and microphone
   - Set custom width and height
   - Adjust framerate and bitrate

5. Click "Join" to start streaming.

## Usage

1. **Joining a Channel**
   - Enter your Agora App ID
   - Set a Channel Name
   - (Optional) Add a Token for authentication
   - (Optional) Set a UID or use String UID
   - Click "Join"

2. **Adjusting Video Settings**
   - Modify width and height as needed
   - Set your desired framerate
   - Adjust bitrate
   - Click "Update Config" to apply changes

3. **Monitoring**
   - View local and remote video streams
   - Monitor real-time statistics for both streams
   - Use the "Leave" button to disconnect

## Technologies Used

- Agora RTC SDK
- Tailwind CSS
- HTML5
- JavaScript

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Agora.io](https://www.agora.io/) for providing the RTC SDK
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework 