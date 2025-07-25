# ForecastLab - Stock Price Forecasting Application

## Overview

ForecastLab is a full-stack interactive stock price forecasting web application that combines Node.js/Express backend, React frontend, and Python FastAPI backend for machine learning capabilities. The application enables users to collect real stock data via yfinance, engineer features with technical indicators, train multiple ML models (Linear Regression, Random Forest), generate forecasts, and perform backtesting analysis.

**Current Status**: Fully operational with real data integration (January 2025)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and bundling
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Chart.js for data visualizations

### Backend Architecture
- **Primary Backend**: Node.js with Express (TypeScript) - Running on port 5000
- **ML Backend**: Python FastAPI for machine learning operations - Running on port 8000 
- **Database**: PostgreSQL with Drizzle ORM - Fully integrated
- **Session Storage**: PostgreSQL database with Drizzle ORM

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for type safety across frontend/backend
- **Tables**: Users, Stock Analyses, Model Results, Export History
- **Migration Strategy**: Drizzle Kit for schema migrations

## Key Components

### Data Collection Service
- **Stock Data**: yfinance integration for historical prices and fundamentals
- **Macroeconomic Data**: Trading Economics and World Bank APIs
- **Technical Indicators**: TA library for RSI, MACD, Bollinger Bands
- **Validation**: Real-time ticker validation

### Feature Engineering
- **Presets**: Basic, Technical, Macro, Fundamental, Custom
- **Features**: OHLCV data, technical indicators, fundamental ratios, macro indicators
- **Selection**: User-configurable feature combinations

### Machine Learning Models
- **Statistical**: ARIMA for time series analysis
- **Trend-based**: Facebook Prophet for seasonal forecasting
- **Deep Learning**: LSTM neural networks (TensorFlow/Keras)
- **Ensemble**: XGBoost for gradient boosting
- **Optimization**: Optuna for hyperparameter tuning

### Forecasting & Backtesting
- **Horizons**: Configurable forecast periods (7D, 30D, etc.)
- **Validation**: Rolling window backtesting
- **Metrics**: MAE, RMSE, MAPE, Sharpe ratio
- **Visualization**: Interactive charts for results

## Data Flow

1. **Data Collection**: User inputs ticker/country → Node.js proxy → Python FastAPI → yfinance/external APIs
2. **Feature Engineering**: Raw data → Python feature service → Engineered features → Frontend visualization
3. **Model Training**: Features + parameters → Python ML service → Trained models → Results storage
4. **Forecasting**: Trained models → Prediction generation → Confidence intervals → Chart display
5. **Backtesting**: Historical data + models → Rolling validation → Performance metrics → Results export

## External Dependencies

### Python ML Stack
- **Data**: yfinance, pandas, numpy
- **ML/DL**: scikit-learn, tensorflow, xgboost, prophet, statsmodels
- **Optimization**: optuna
- **Technical Analysis**: ta library

### Frontend Dependencies
- **UI**: Radix UI primitives with shadcn/ui components
- **Data Fetching**: TanStack React Query, axios
- **Charts**: Chart.js with react-chartjs-2
- **Forms**: React Hook Form with zod validation
- **Styling**: Tailwind CSS with CSS variables for theming

### Node.js Backend
- **Framework**: Express with TypeScript
- **Database**: Drizzle ORM with @neondatabase/serverless
- **Session**: connect-pg-simple for PostgreSQL sessions
- **Proxy**: Axios for Python backend communication

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution with nodemon-style reloading
- **Python**: uvicorn with auto-reload for FastAPI development
- **Database**: PostgreSQL (local or cloud)

### Production Build
- **Frontend**: Vite build to `dist/public`
- **Backend**: esbuild bundle to `dist/index.js`
- **Python**: Containerized FastAPI service
- **Database**: Managed PostgreSQL (Neon, Supabase, etc.)

### Environment Configuration
- **Database**: `DATABASE_URL` environment variable required
- **Python Backend**: `PYTHON_BACKEND_URL` for service communication
- **APIs**: External API keys for Trading Economics, World Bank

### Scalability Considerations
- **Caching**: In-memory cache for stock data with TTL
- **Background Jobs**: Async model training with job status tracking
- **Database**: Prepared for connection pooling and read replicas
- **Microservices**: Python ML service can be independently scaled

The architecture separates concerns effectively with the Node.js backend handling web requests and user management, while the Python backend specializes in data processing and machine learning workloads. The shared TypeScript schema ensures type safety across the full stack.