# LMS Face Recognition Frontend

A simple Next.js frontend application to test the FastAPI face recognition backend for Learning Management System (LMS) integration.

## Features

- **User Selection**: Choose from demo users to test the system
- **Face Registration**: Register user faces using webcam capture
- **Course Content**: Simple course with educational content
- **Face Verification**: Verify identity before quiz access
- **Quiz System**: Single question quiz with secure access
- **Status Dashboard**: View registration status and verification history
- **Real-time Feedback**: Live webcam preview and instant results

## Prerequisites

Make sure you have the following installed:
- Node.js 18+ 
- npm or yarn
- A webcam/camera for face recognition testing
- The FastAPI backend running on `http://localhost:8000`

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## Backend Integration

The frontend is configured to work with the FastAPI backend at `http://localhost:8000`. Make sure your backend is running before testing the frontend.

### Environment Variables (Optional)

Create a `.env.local` file if you need to customize the API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Application Flow

### 1. Home Page (`/`)
- System status overview
- User selection (demo users 1-4)
- Quick navigation to main features
- Step-by-step instructions

### 2. Face Registration (`/register`)
- Select demo user
- Webcam capture interface
- Real-time face detection feedback
- Registration status and quality metrics

### 3. Course & Quiz (`/course`)
- Educational content about programming variables
- Face verification before quiz access
- Single question quiz
- Results with verification details

### 4. Status Dashboard (`/status`)
- Registration status for selected user
- Verification history with detailed metrics
- System statistics and health
- Historical data visualization

## Testing the System

1. **Select a User**: Choose one of the demo users (1-4) on the home page

2. **Register Face**: 
   - Go to "Register Face"
   - Position your face in the webcam frame
   - Capture a clear photo
   - Check quality score (aim for >70%)

3. **Take Course**:
   - Access the course content
   - Click "Start Quiz" 
   - Complete face verification
   - Answer the quiz question

4. **View Status**:
   - Check registration details
   - Review verification history
   - Monitor system health

## Key Components

### `WebcamCapture`
- React component for camera access
- Real-time preview with guidelines
- Base64 image capture and File conversion

### `Navigation`
- Responsive navigation bar
- Active page highlighting
- Quick access to all features

### API Service (`lib/api.ts`)
- Axios-based HTTP client
- TypeScript interfaces
- Error handling and response typing

## Troubleshooting

### Camera Issues
- **Permission Denied**: Ensure browser has camera permissions
- **No Camera Found**: Check if camera is connected and not used by other apps
- **Poor Quality**: Improve lighting and ensure face is clearly visible

### Backend Connection
- **API Errors**: Verify FastAPI backend is running on port 8000
- **CORS Issues**: Backend includes CORS configuration for `localhost:3000`
- **Authentication**: Demo uses simple token `lms-face-token-123`

### Face Recognition Issues
- **Registration Failed**: Ensure good lighting and clear face visibility
- **Verification Failed**: Use the same lighting conditions as registration
- **Low Quality Score**: Adjust camera angle and lighting

## Development

### Project Structure
```
src/
├── app/                 # Next.js app router pages
│   ├── course/         # Course and quiz page
│   ├── register/       # Face registration page
│   ├── status/         # Status dashboard
│   └── globals.css     # Global styles
├── components/         # Reusable components
│   ├── Navigation.tsx  # Main navigation
│   └── WebcamCapture.tsx # Camera component
└── lib/
    └── api.ts          # API service layer
```

### Technologies Used
- **Next.js 14**: React framework with app router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **React Webcam**: Camera access component
- **Axios**: HTTP client for API calls
- **Lucide React**: Icon library

### API Endpoints Used
- `POST /api/v1/face/register` - Register user face
- `POST /api/v1/face/verify` - Verify user identity
- `GET /api/v1/face/status/{user_id}` - Get registration status
- `GET /api/v1/face/verifications/{user_id}` - Get verification history
- `GET /api/v1/health` - System health check
- `GET /api/v1/stats` - System statistics

## Production Deployment

For production deployment:

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

3. **Update API URL**: Set `NEXT_PUBLIC_API_URL` to your production backend URL

4. **Configure CORS**: Update FastAPI backend CORS settings for your domain

## Security Notes

- This is a demo application with simplified authentication
- In production, implement proper JWT token authentication
- Ensure HTTPS for all face data transmission
- Follow data privacy regulations for biometric data
- Implement rate limiting and proper input validation

## Support

For issues related to:
- **Frontend**: Check browser console for errors
- **Camera**: Verify browser permissions and hardware
- **Backend Integration**: Ensure FastAPI server is accessible
- **Face Recognition**: Check lighting and image quality

## License

This demo application is for testing purposes. Ensure compliance with biometric data regulations in your jurisdiction.