# Pomodoro Day Planner

A comprehensive single-page day planner with drag-and-drop task management, calendar integration, and hourly reminders.

## Features

### Task Management
- **Task List**: Create tasks with custom durations (in 30-minute increments)
- **Drag & Drop**: Drag tasks from the left panel to the day planner on the right
- **Lock/Unlock**: Lock tasks in place to prevent them from being moved by other tasks
- **Smart Scheduling**: Unlocked tasks automatically slide to make room for new tasks

### Day Planner
- **Configurable Hours**: Set your start time (default 6:00 AM) and end time (default 10:00 PM)
- **30-Minute Increments**: All time slots are in 30-minute intervals
- **Current Time Indicator**: A red horizontal line shows the current time
- **Visual Feedback**: Drop zones highlight when dragging tasks

### Calendar Integration
- **Work Calendar Display**: Shows your work calendar events as grayed-out background blocks
- **Google Calendar Support**: Configure your calendar ID in settings (requires API setup)
- **Non-Editable Events**: Calendar events appear in the background and cannot be moved

### Reminders
- **Hourly Chirps**: Optional audio reminders at the top (:00) and bottom (:30) of every hour
- **Sound Selection**: Choose from Beep, Chime, Bell, or Ping sounds
- **Volume Control**: Adjust reminder volume from 0-100%

## How to Use

### Getting Started
1. Open `index.html` in your web browser
2. The planner displays today's date and shows time slots from 6 AM to 10 PM by default

### Adding Tasks
1. Click the **"+ Add Task"** button in the left panel
2. Enter a task name and duration in minutes (must be multiples of 30)
3. Click **"Save"** to add the task to your task list

### Planning Your Day
1. **Drag** a task from the left panel to a time slot on the right
2. The task will snap to the nearest 30-minute increment
3. Tasks show their scheduled time range

### Locking Tasks
1. Click the **🔓** button on a planned task to lock it in place
2. Locked tasks turn orange and won't move when other tasks are added
3. Click **🔒** to unlock

### Moving Tasks
1. Drag a planned task to a new time slot
2. Unlocked tasks will automatically shift to make room
3. Locked tasks and calendar events act as immovable barriers

### Removing Tasks
1. Click the **×** button on any planned task to remove it from the schedule
2. This doesn't delete the task from your task list, only from the schedule

### Settings
1. Click the **⚙️** button in the top-right of the task panel
2. Configure:
   - Start and end times for your day
   - Enable/disable hourly reminders
   - Choose reminder sound and volume
   - Add Google Calendar ID (for calendar integration)

## Data Persistence

All your tasks, planned items, and settings are automatically saved to your browser's local storage. Your schedule will persist between sessions.

## Calendar Integration Setup

To display your Google Calendar events:

1. Set up Google Calendar API access:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one
   - Enable the Google Calendar API
   - Create credentials (API key or OAuth 2.0)

2. Enter your calendar ID in Settings (usually your Gmail address)

3. Note: The current implementation includes a placeholder for calendar events. Full integration requires additional API setup and authentication.

## Keyboard Shortcuts

- Click outside the settings modal to close it
- Press Enter when adding a task to save it
- Press Escape when adding a task to cancel (requires custom implementation)

## Browser Compatibility

Works best in modern browsers that support:
- HTML5 Drag and Drop API
- Web Audio API (for chirp sounds)
- CSS Grid and Flexbox
- LocalStorage

Tested in: Chrome, Firefox, Safari, Edge

## Tips

1. **Lock important meetings** to prevent them from being moved
2. **Start with your fixed commitments** (meetings, appointments) before adding flexible tasks
3. **Use 30-minute increments** for better time management
4. **Enable reminders** to stay on track throughout the day
5. **Adjust start/end times** to match your work schedule

## Technical Details

- **Self-contained**: Single HTML file with embedded CSS and JavaScript
- **No dependencies**: Pure vanilla JavaScript, no frameworks required
- **Audio Generation**: Uses Web Audio API to generate chirp sounds programmatically
- **Responsive Layout**: Adapts to different screen sizes
- **State Management**: Simple JavaScript object-based state management
- **Persistence**: Browser LocalStorage for data persistence

## Future Enhancements

- Full Google Calendar API integration
- Task templates and recurring tasks
- Export schedule to calendar formats (iCal, etc.)
- Statistics and time tracking
- Dark mode
- Mobile-responsive touch interactions
- Keyboard shortcuts
- Undo/redo functionality
