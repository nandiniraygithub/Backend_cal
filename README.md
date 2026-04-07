# AI Math Calculator - Architecture Guide

## 🏗️ Project Structure

```
backend-cal/
├── backend/                    # Backend Node.js API
│   ├── src/
│   │   ├── controllers/        # Route controllers
│   │   │   ├── imageController.js
│   │   │   └── analysisController.js
│   │   ├── middleware/         # Custom middleware
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── validation.js
│   │   ├── models/            # Database models
│   │   │   └── ImageModel.js
│   │   ├── routes/            # API routes
│   │   │   ├── image.js
│   │   │   └── analysis.js
│   │   ├── services/          # Business logic
│   │   │   ├── ollamaService.js
│   │   │   ├── imageProcessor.js
│   │   │   └── cacheService.js
│   │   ├── utils/             # Utility functions
│   │   │   ├── logger.js
│   │   │   └── helpers.js
│   │   └── config/            # Configuration
│   │       ├── database.js
│   │       └── ollama.js
│   ├── tests/                 # Test files
│   ├── uploads/               # File uploads
│   ├── package.json
│   └── server.js              # Entry point
├── frontend/                   # Frontend React App
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── ui/            # Basic UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   └── index.ts
│   │   │   ├── canvas/        # Canvas-related components
│   │   │   │   ├── FabricCanvas.tsx
│   │   │   │   ├── Toolbar.tsx
│   │   │   │   └── index.ts
│   │   │   ├── analysis/      # Analysis components
│   │   │   │   ├── ResultDisplay.tsx
│   │   │   │   ├── LoadingState.tsx
│   │   │   │   └── index.ts
│   │   │   └── layout/        # Layout components
│   │   │       ├── Navbar.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       └── index.ts
│   │   ├── screens/           # Page components
│   │   │   ├── Home/
│   │   │   │   ├── index.tsx
│   │   │   │   └── Home.styles.ts
│   │   │   └── About/
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useCanvas.ts
│   │   │   ├── useAnalysis.ts
│   │   │   └── useLocalStorage.ts
│   │   ├── services/          # API services
│   │   │   ├── api.ts
│   │   │   ├── imageService.ts
│   │   │   └── analysisService.ts
│   │   ├── store/             # State management
│   │   │   ├── context/
│   │   │   │   ├── AppContext.tsx
│   │   │   │   └── CanvasContext.tsx
│   │   │   └── slices/
│   │   │       ├── canvasSlice.ts
│   │   │       └── analysisSlice.ts
│   │   ├── types/             # TypeScript types
│   │   │   ├── canvas.ts
│   │   │   ├── analysis.ts
│   │   │   └── api.ts
│   │   ├── utils/             # Utility functions
│   │   │   ├── constants.ts
│   │   │   ├── helpers.ts
│   │   │   └── validators.ts
│   │   ├── styles/            # Global styles
│   │   │   ├── globals.css
│   │   │   └── components.css
│   │   └── config/            # Configuration
│   │       ├── api.ts
│   │       └── env.ts
│   ├── public/
│   └── package.json
├── shared/                     # Shared types and utilities
│   ├── types/
│   │   ├── analysis.ts
│   │   └── api.ts
│   └── constants/
│       └── errors.ts
├── docs/                      # Documentation
├── scripts/                   # Build and deployment scripts
└── README.md
```

## 🔄 How It Works - Architecture Flow

### Backend Architecture (Node.js + Express)

```
Client Request → Express Server → Middleware → Controller → Service → Ollama AI → Response
                                     ↓
                              MongoDB (Image Storage)
                                     ↓
                              In-Memory Cache
```

**Key Components:**

1. **Express Server** (`server.js`)
   - Main entry point
   - Sets up middleware and routes
   - Handles error management

2. **Controllers** (`controllers/`)
   - Handle HTTP requests/responses
   - Validate input data
   - Call appropriate services

3. **Services** (`services/`)
   - **OllamaService**: Communicates with Ollama AI model
   - **ImageProcessor**: Optimizes and processes images
   - **CacheService**: Manages in-memory caching

4. **Models** (`models/`)
   - **ImageModel**: MongoDB schema for image storage

### Frontend Architecture (React + TypeScript)

```
User Interaction → Component → Hook/Context → API Service → Backend API → Response → State Update → UI Re-render
```

**Key Components:**

1. **Components** (`src/components/`)
   - **Canvas Components**: Drawing and canvas management
   - **Analysis Components**: Results and loading states
   - **UI Components**: Reusable UI elements

2. **Hooks** (`src/hooks/`)
   - **useCanvas**: Canvas drawing logic
   - **useAnalysis**: Analysis state management
   - **useLocalStorage**: Local storage operations

3. **Services** (`src/services/`)
   - **API Service**: HTTP client for backend communication
   - **Image Service**: Image upload and processing
   - **Analysis Service**: Analysis requests and responses

4. **State Management** (`src/store/`)
   - **Context API**: Global state management
   - **Local State**: Component-specific state

## 🚀 Data Flow

### 1. Drawing Flow
```
User draws on canvas → Fabric.js captures drawing → Canvas state saved → Ready state shown
```

### 2. Analysis Flow
```
User clicks calculate → Loading state shown → Image sent to backend → 
Backend processes image → Ollama AI analyzes → Results returned → 
Frontend displays results with explanations
```

### 3. State Management
```
Canvas State → Drawing history → Undo/Redo functionality
Analysis State → Loading/Ready/Result states → UI updates
```

## 🔧 Key Technologies

### Backend
- **Node.js + Express**: Server framework
- **MongoDB**: Image storage
- **Ollama**: AI model (Qwen2.5-VL)
- **Sharp**: Image processing
- **Axios**: HTTP client

### Frontend
- **React 19**: UI framework
- **TypeScript**: Type safety
- **Fabric.js**: Canvas manipulation
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **Vite**: Build tool

## 📊 API Endpoints

### POST /api/image/upload
- Uploads canvas image
- Returns image ID
- Stores in MongoDB

### POST /api/analysis/calculate
- Analyzes image with AI
- Returns mathematical results
- Includes explanations and steps

### GET /api/analysis/cache-status
- Returns cache statistics
- For monitoring and debugging

## 🎯 Best Practices

### Backend
1. **Error Handling**: Centralized error management
2. **Validation**: Input validation for all endpoints
3. **Caching**: In-memory caching for performance
4. **Logging**: Comprehensive logging for debugging

### Frontend
1. **Type Safety**: Strict TypeScript usage
2. **Component Reusability**: Modular component design
3. **State Management**: Proper state separation
4. **Performance**: Optimized rendering and caching

## 🔒 Security Considerations

1. **Input Validation**: All user inputs validated
2. **File Uploads**: Size and type restrictions
3. **Error Messages**: No sensitive information leaked
4. **Rate Limiting**: Prevent API abuse

## 📈 Performance Optimizations

1. **Image Optimization**: Sharp for image compression
2. **Caching**: In-memory cache for repeated requests
3. **Lazy Loading**: Components loaded as needed
4. **Code Splitting**: Frontend bundle optimization

## 🧪 Testing Strategy

1. **Unit Tests**: Individual function testing
2. **Integration Tests**: API endpoint testing
3. **E2E Tests**: Full user flow testing
4. **Performance Tests**: Load and stress testing

This architecture ensures scalability, maintainability, and performance for the AI Math Calculator application.

