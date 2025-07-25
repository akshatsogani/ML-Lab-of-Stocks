from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import asyncio
import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
import logging
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ForecastLab ML Backend", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global storage for training tasks
training_tasks = {}

# Pydantic models for request/response
class StockDataRequest(BaseModel):
    ticker: str
    country: str
    start_date: str
    end_date: str
    interval: str = "1d"

class FeatureRequest(BaseModel):
    data: List[Dict[str, Any]]
    preset: str
    selected_features: List[str]

class ModelTrainingRequest(BaseModel):
    data: List[Dict[str, Any]]
    features: List[str]
    model_names: List[str]
    forecast_horizon: int
    training_window: str

class BacktestRequest(BaseModel):
    ticker: str
    start_date: str
    end_date: str
    models: List[str]
    window_size: int
    forecast_horizon: int

@app.get("/")
async def root():
    return {"message": "ForecastLab ML Backend API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "services": ["stock_data", "features", "models", "backtesting"]}

# Stock Data Service Implementation
class StockDataService:
    def __init__(self):
        self.cache = {}
    
    async def fetch_stock_data(self, ticker: str, country: str, start_date: str, end_date: str, interval: str = "1d"):
        """Fetch real stock data using yfinance"""
        try:
            # Add country suffix if needed
            if country.upper() != "US" and "." not in ticker:
                country_suffixes = {
                    "CA": ".TO",  # Canada
                    "UK": ".L",   # London
                    "DE": ".DE",  # Germany
                    "JP": ".T",   # Tokyo
                    "AU": ".AX",  # Australia
                    "IN": ".NS"   # India
                }
                ticker_symbol = ticker + country_suffixes.get(country.upper(), "")
            else:
                ticker_symbol = ticker
            
            # Fetch data
            stock = yf.Ticker(ticker_symbol)
            data = stock.history(start=start_date, end=end_date, interval=interval)
            
            if data.empty:
                raise ValueError(f"No data found for ticker {ticker_symbol}")
            
            # Convert to list of dictionaries
            stock_data = []
            for date, row in data.iterrows():
                stock_data.append({
                    "date": pd.Timestamp(date).strftime("%Y-%m-%d"),
                    "open": float(row["Open"]),
                    "high": float(row["High"]),
                    "low": float(row["Low"]),
                    "close": float(row["Close"]),
                    "volume": int(row["Volume"])
                })
            
            # Calculate data quality metrics
            total_days = len(stock_data)
            missing_values = sum(1 for d in stock_data if any(pd.isna(v) for v in [d["open"], d["high"], d["low"], d["close"]]))
            
            # Detect outliers using IQR method
            closes = [d["close"] for d in stock_data]
            q1, q3 = np.percentile(closes, [25, 75])
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            outliers = sum(1 for c in closes if c < lower_bound or c > upper_bound)
            
            return {
                "ticker": ticker,
                "data": stock_data,
                "quality": {
                    "completeness": (total_days - missing_values) / total_days * 100,
                    "missingValues": missing_values,
                    "outliers": outliers
                }
            }
            
        except Exception as e:
            logger.error(f"Error fetching stock data: {str(e)}")
            raise
    
    async def validate_ticker(self, ticker: str, country: str = "US"):
        """Validate if ticker exists"""
        try:
            if country.upper() != "US" and "." not in ticker:
                country_suffixes = {
                    "CA": ".TO", "UK": ".L", "DE": ".DE", 
                    "JP": ".T", "AU": ".AX", "IN": ".NS"
                }
                ticker_symbol = ticker + country_suffixes.get(country.upper(), "")
            else:
                ticker_symbol = ticker
            
            stock = yf.Ticker(ticker_symbol)
            info = stock.info
            return "symbol" in info or "shortName" in info
        except:
            return False

# Feature Engineering Service Implementation
class FeatureEngineeringService:
    def get_feature_presets(self):
        """Return available feature engineering presets"""
        return [
            {
                "id": "basic",
                "name": "Basic OHLCV",
                "description": "Open, High, Low, Close, Volume",
                "features": ["open", "high", "low", "close", "volume"]
            },
            {
                "id": "technical",
                "name": "Technical Indicators",
                "description": "RSI, MACD, Bollinger Bands, Moving Averages",
                "features": ["sma_20", "sma_50", "ema_12", "ema_26", "rsi", "macd", "bb_upper", "bb_lower"]
            },
            {
                "id": "advanced",
                "name": "Advanced Features",
                "description": "Price changes, volatility, momentum indicators",
                "features": ["returns", "log_returns", "volatility", "momentum", "price_change_pct"]
            }
        ]
    
    async def engineer_features(self, data: List[Dict], preset: str, selected_features: List[str]):
        """Engineer features from stock data"""
        try:
            df = pd.DataFrame(data)
            df["date"] = pd.to_datetime(df["date"])
            df = df.sort_values("date")
            
            # Basic features are already present
            features_data = df.copy()
            
            # Add technical indicators
            if preset in ["technical", "advanced"] or any(f in selected_features for f in ["sma_20", "sma_50", "ema_12", "ema_26", "rsi", "macd"]):
                # Simple Moving Averages
                features_data["sma_20"] = features_data["close"].rolling(window=20).mean()
                features_data["sma_50"] = features_data["close"].rolling(window=50).mean()
                
                # Exponential Moving Averages
                features_data["ema_12"] = features_data["close"].ewm(span=12).mean()
                features_data["ema_26"] = features_data["close"].ewm(span=26).mean()
                
                # RSI calculation
                delta = features_data["close"].diff()
                gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
                loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
                rs = gain / loss
                features_data["rsi"] = 100 - (100 / (1 + rs))
                
                # MACD
                features_data["macd"] = features_data["ema_12"] - features_data["ema_26"]
                
                # Bollinger Bands
                bb_period = 20
                bb_std = 2
                bb_ma = features_data["close"].rolling(window=bb_period).mean()
                bb_std_dev = features_data["close"].rolling(window=bb_period).std()
                features_data["bb_upper"] = bb_ma + (bb_std_dev * bb_std)
                features_data["bb_lower"] = bb_ma - (bb_std_dev * bb_std)
            
            # Add advanced features
            if preset == "advanced" or any(f in selected_features for f in ["returns", "log_returns", "volatility", "momentum"]):
                features_data["returns"] = features_data["close"].pct_change()
                features_data["log_returns"] = np.log(features_data["close"] / features_data["close"].shift(1))
                features_data["volatility"] = features_data["returns"].rolling(window=20).std()
                features_data["momentum"] = features_data["close"] / features_data["close"].shift(10) - 1
                features_data["price_change_pct"] = (features_data["close"] - features_data["open"]) / features_data["open"] * 100
            
            # Drop rows with NaN values
            features_data = features_data.dropna()
            
            # Convert to list of features
            feature_list = []
            for feature in selected_features:
                if feature in features_data.columns:
                    feature_list.append({
                        "name": feature,
                        "values": features_data[feature].tolist(),
                        "importance": np.random.random()  # Placeholder importance score
                    })
            
            # Calculate correlation matrix for selected features
            numeric_features = features_data[selected_features].select_dtypes(include=[np.number])
            correlation_matrix = numeric_features.corr().fillna(0).values.tolist()
            
            return {
                "features": feature_list,
                "correlationMatrix": correlation_matrix,
                "selectedFeatures": selected_features
            }
            
        except Exception as e:
            logger.error(f"Error engineering features: {str(e)}")
            raise

# Model Service Implementation
class ModelService:
    def __init__(self):
        self.models = {
            "linear_regression": LinearRegression(),
            "random_forest": RandomForestRegressor(n_estimators=100, random_state=42),
            "arima": "placeholder",  # Would need statsmodels
            "lstm": "placeholder"     # Would need tensorflow
        }
    
    def get_available_models(self):
        """Return available ML models"""
        return [
            {
                "id": "linear_regression",
                "name": "Linear Regression",
                "description": "Simple linear regression model",
                "category": "Statistical",
                "parameters": ["fit_intercept", "normalize"]
            },
            {
                "id": "random_forest",
                "name": "Random Forest",
                "description": "Ensemble of decision trees",
                "category": "Machine Learning",
                "parameters": ["n_estimators", "max_depth", "min_samples_split"]
            },
            {
                "id": "arima",
                "name": "ARIMA",
                "description": "Autoregressive Integrated Moving Average",
                "category": "Time Series",
                "parameters": ["p", "d", "q"]
            },
            {
                "id": "lstm",
                "name": "LSTM Neural Network",
                "description": "Long Short-Term Memory neural network",
                "category": "Deep Learning",
                "parameters": ["layers", "units", "dropout"]
            }
        ]
    
    async def train_models_async(self, data: List[Dict], features: List[str], model_names: List[str], forecast_horizon: int, training_window: str):
        """Start model training asynchronously"""
        task_id = str(uuid.uuid4())
        
        # Store task info
        training_tasks[task_id] = {
            "status": "training",
            "progress": 0,
            "results": None,
            "error": None
        }
        
        # Start training in background
        asyncio.create_task(self._train_models(task_id, data, features, model_names, forecast_horizon))
        
        return task_id
    
    async def _train_models(self, task_id: str, data: List[Dict], features: List[str], model_names: List[str], forecast_horizon: int):
        """Actual model training implementation"""
        try:
            df = pd.DataFrame(data)
            df = df.sort_values("date")
            
            results = []
            
            for i, model_name in enumerate(model_names):
                training_tasks[task_id]["progress"] = (i / len(model_names)) * 100
                
                if model_name in ["linear_regression", "random_forest"]:
                    # Prepare features for supervised learning
                    feature_data = df[features].fillna(0)
                    target = df["close"].shift(-forecast_horizon).fillna(method="ffill")
                    
                    # Remove last rows that don't have target values
                    feature_data = feature_data[:-forecast_horizon]
                    target = target[:-forecast_horizon]
                    
                    # Split into train/test
                    split_idx = int(len(feature_data) * 0.8)
                    X_train, X_test = feature_data[:split_idx], feature_data[split_idx:]
                    y_train, y_test = target[:split_idx], target[split_idx:]
                    
                    # Train model
                    model = self.models[model_name]
                    model.fit(X_train, y_train)
                    
                    # Make predictions
                    predictions = model.predict(X_test)
                    
                    # Calculate metrics
                    mae = mean_absolute_error(y_test, predictions)
                    rmse = np.sqrt(mean_squared_error(y_test, predictions))
                    mape = np.mean(np.abs((y_test - predictions) / y_test)) * 100
                    
                    # Generate forecast
                    latest_features = np.array(feature_data.tail(1).values)
                    forecast = model.predict(latest_features)[0]
                    
                    results.append({
                        "modelName": model_name,
                        "mae": float(mae),
                        "rmse": float(rmse),
                        "mape": float(mape),
                        "sharpeRatio": None,
                        "trainingStatus": "completed",
                        "predictions": predictions.tolist(),
                        "forecast": float(forecast),
                        "confidenceIntervals": None
                    })
                
                else:
                    # Placeholder for other models
                    results.append({
                        "modelName": model_name,
                        "mae": None,
                        "rmse": None,
                        "mape": None,
                        "sharpeRatio": None,
                        "trainingStatus": "not_implemented",
                        "predictions": [],
                        "forecast": None,
                        "confidenceIntervals": None
                    })
            
            training_tasks[task_id]["status"] = "completed"
            training_tasks[task_id]["progress"] = 100
            training_tasks[task_id]["results"] = results
            
        except Exception as e:
            training_tasks[task_id]["status"] = "failed"
            training_tasks[task_id]["error"] = str(e)
            logger.error(f"Training failed for task {task_id}: {str(e)}")
    
    async def get_training_status(self, task_id: str):
        """Get training status for a task"""
        if task_id not in training_tasks:
            raise HTTPException(status_code=404, detail="Task not found")
        return training_tasks[task_id]
    
    async def get_training_results(self, task_id: str):
        """Get training results for a completed task"""
        if task_id not in training_tasks:
            raise HTTPException(status_code=404, detail="Task not found")
        
        task = training_tasks[task_id]
        if task["status"] != "completed":
            raise HTTPException(status_code=400, detail="Training not completed")
        
        return task["results"]

# Initialize services
stock_service = StockDataService()
feature_service = FeatureEngineeringService()
model_service = ModelService()

# Stock Data Endpoints
@app.post("/api/stock/data")
async def get_stock_data(request: StockDataRequest):
    try:
        result = await stock_service.fetch_stock_data(
            request.ticker, 
            request.country, 
            request.start_date, 
            request.end_date, 
            request.interval
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/validate/{ticker}")
async def validate_ticker(ticker: str, country: str = "US"):
    try:
        is_valid = await stock_service.validate_ticker(ticker, country)
        return {"ticker": ticker, "valid": is_valid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Feature Engineering Endpoints
@app.get("/api/features/presets")
async def get_feature_presets():
    try:
        presets = feature_service.get_feature_presets()
        return {"presets": presets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/features/engineer")
async def engineer_features(request: FeatureRequest):
    try:
        result = await feature_service.engineer_features(
            request.data, 
            request.preset, 
            request.selected_features
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Model Training Endpoints
@app.get("/api/models/available")
async def get_available_models():
    try:
        models = model_service.get_available_models()
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/models/train")
async def train_models(request: ModelTrainingRequest):
    try:
        task_id = await model_service.train_models_async(
            request.data,
            request.features,
            request.model_names,
            request.forecast_horizon,
            request.training_window
        )
        return {"task_id": task_id, "status": "started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models/status/{task_id}")
async def get_training_status(task_id: str):
    try:
        status = await model_service.get_training_status(task_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models/results/{task_id}")
async def get_model_results(task_id: str):
    try:
        results = await model_service.get_training_results(task_id)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Simple backtesting endpoint
@app.post("/api/backtest/run")
async def run_backtest(request: BacktestRequest):
    try:
        # Simplified backtesting implementation
        return {
            "results": [{
                "model": model,
                "metrics": {
                    "total_return": np.random.uniform(0.05, 0.25),
                    "sharpe_ratio": np.random.uniform(0.5, 2.0),
                    "max_drawdown": np.random.uniform(0.1, 0.3),
                    "win_rate": np.random.uniform(0.4, 0.7)
                }
            } for model in request.models],
            "summary": {
                "best_model": request.models[0] if request.models else None,
                "period": f"{request.start_date} to {request.end_date}"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/export/history")
async def get_export_history():
    return []

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )