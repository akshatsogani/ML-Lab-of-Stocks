import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
import logging
import asyncio
import io
import json
from datetime import datetime, timedelta

# ML/DL libraries
from statsmodels.tsa.arima.model import ARIMA
from prophet import Prophet
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error
import xgboost as xgb

# For LSTM
try:
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    from tensorflow.keras.optimizers import Adam
    HAS_TENSORFLOW = True
except ImportError:
    HAS_TENSORFLOW = False

logger = logging.getLogger(__name__)

class ModelService:
    def __init__(self):
        self.models = {}
        self.scalers = {}
    
    async def train_models(self, request, training_jobs: Dict, analysis_results: Dict):
        """Train multiple models asynchronously"""
        try:
            analysis_id = request.analysis_id
            
            # Update job status
            training_jobs[analysis_id]["status"] = "training"
            
            # Initialize results storage
            analysis_results[analysis_id] = {
                "models": {},
                "request": request.dict(),
                "created_at": datetime.now().isoformat()
            }
            
            # Train each selected model
            for model_name in request.selected_models:
                try:
                    logger.info(f"Training {model_name} for analysis {analysis_id}")
                    
                    # Update model status
                    training_jobs[analysis_id]["models"][model_name]["status"] = "training"
                    training_jobs[analysis_id]["models"][model_name]["progress"] = 10
                    
                    # Train the model
                    model_result = await self._train_single_model(
                        model_name=model_name,
                        request=request,
                        training_jobs=training_jobs,
                        analysis_id=analysis_id
                    )
                    
                    # Store results
                    analysis_results[analysis_id]["models"][model_name] = model_result
                    
                    # Update completion status
                    training_jobs[analysis_id]["models"][model_name]["status"] = "completed"
                    training_jobs[analysis_id]["models"][model_name]["progress"] = 100
                    
                    logger.info(f"Completed training {model_name}")
                    
                except Exception as e:
                    logger.error(f"Error training {model_name}: {str(e)}")
                    training_jobs[analysis_id]["models"][model_name]["status"] = "failed"
                    training_jobs[analysis_id]["models"][model_name]["error"] = str(e)
            
            # Update overall status
            all_completed = all(
                job["status"] in ["completed", "failed"] 
                for job in training_jobs[analysis_id]["models"].values()
            )
            
            if all_completed:
                training_jobs[analysis_id]["status"] = "completed"
            
        except Exception as e:
            logger.error(f"Error in train_models: {str(e)}")
            training_jobs[analysis_id]["status"] = "failed"
            training_jobs[analysis_id]["error"] = str(e)
    
    async def _train_single_model(self, model_name: str, request, training_jobs: Dict, analysis_id: str) -> Dict[str, Any]:
        """Train a single model"""
        try:
            # Mock training data - in real implementation, this would fetch actual stock data
            # and features based on the request parameters
            
            # Simulate training time and progress updates
            for progress in range(20, 101, 20):
                training_jobs[analysis_id]["models"][model_name]["progress"] = progress
                await asyncio.sleep(0.5)  # Simulate training time
            
            # Generate mock results based on model type
            if model_name == "arima":
                return await self._train_arima(request)
            elif model_name == "prophet":
                return await self._train_prophet(request)
            elif model_name == "lstm":
                return await self._train_lstm(request)
            elif model_name == "xgboost":
                return await self._train_xgboost(request)
            else:
                raise ValueError(f"Unknown model: {model_name}")
                
        except Exception as e:
            logger.error(f"Error training {model_name}: {str(e)}")
            raise
    
    async def _train_arima(self, request) -> Dict[str, Any]:
        """Train ARIMA model"""
        try:
            # In real implementation, would fetch and prepare actual data
            # For now, return mock results with realistic metrics
            
            return {
                "model_name": "arima",
                "status": "completed",
                "metrics": {
                    "mae": np.random.uniform(2.0, 4.0),
                    "rmse": np.random.uniform(3.0, 5.0),
                    "mape": np.random.uniform(1.5, 3.0),
                    "aic": np.random.uniform(100, 200),
                    "bic": np.random.uniform(110, 210)
                },
                "parameters": {
                    "order": (1, 1, 1),
                    "seasonal_order": (0, 0, 0, 0)
                },
                "trained_at": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error training ARIMA: {str(e)}")
            raise
    
    async def _train_prophet(self, request) -> Dict[str, Any]:
        """Train Prophet model"""
        try:
            # Mock Prophet training
            return {
                "model_name": "prophet",
                "status": "completed",
                "metrics": {
                    "mae": np.random.uniform(1.8, 3.5),
                    "rmse": np.random.uniform(2.5, 4.5),
                    "mape": np.random.uniform(1.2, 2.8),
                    "coverage": np.random.uniform(0.85, 0.95)
                },
                "parameters": {
                    "seasonality_mode": "multiplicative",
                    "yearly_seasonality": True,
                    "weekly_seasonality": True,
                    "daily_seasonality": False
                },
                "trained_at": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error training Prophet: {str(e)}")
            raise
    
    async def _train_lstm(self, request) -> Dict[str, Any]:
        """Train LSTM model"""
        try:
            if not HAS_TENSORFLOW:
                raise ValueError("TensorFlow not available for LSTM training")
            
            # Mock LSTM training
            return {
                "model_name": "lstm",
                "status": "completed",
                "metrics": {
                    "mae": np.random.uniform(2.2, 4.2),
                    "rmse": np.random.uniform(3.2, 5.2),
                    "mape": np.random.uniform(1.8, 3.2),
                    "val_loss": np.random.uniform(0.01, 0.05)
                },
                "parameters": {
                    "sequence_length": 60,
                    "layers": [50, 50],
                    "dropout": 0.2,
                    "epochs": 100,
                    "batch_size": 32
                },
                "trained_at": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error training LSTM: {str(e)}")
            raise
    
    async def _train_xgboost(self, request) -> Dict[str, Any]:
        """Train XGBoost model"""
        try:
            # Mock XGBoost training
            return {
                "model_name": "xgboost",
                "status": "completed",
                "metrics": {
                    "mae": np.random.uniform(2.5, 4.5),
                    "rmse": np.random.uniform(3.5, 5.5),
                    "mape": np.random.uniform(2.0, 3.5),
                    "r2_score": np.random.uniform(0.7, 0.9)
                },
                "parameters": {
                    "n_estimators": 100,
                    "max_depth": 6,
                    "learning_rate": 0.1,
                    "subsample": 0.8,
                    "colsample_bytree": 0.8
                },
                "trained_at": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error training XGBoost: {str(e)}")
            raise
    
    async def generate_forecast(self, analysis_id: str, model_names: List[str], 
                              horizon: int, analysis_results: Dict) -> Dict[str, Any]:
        """Generate forecasts using trained models"""
        try:
            if analysis_id not in analysis_results:
                raise ValueError(f"Analysis {analysis_id} not found")
            
            forecasts = {}
            
            for model_name in model_names:
                if model_name not in analysis_results[analysis_id]["models"]:
                    logger.warning(f"Model {model_name} not found in analysis {analysis_id}")
                    continue
                
                # Generate mock forecast data
                forecast_data = self._generate_mock_forecast(model_name, horizon)
                forecasts[model_name] = forecast_data
            
            return {
                "analysis_id": analysis_id,
                "forecasts": forecasts,
                "horizon": horizon,
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating forecast: {str(e)}")
            raise
    
    def _generate_mock_forecast(self, model_name: str, horizon: int) -> Dict[str, Any]:
        """Generate mock forecast data"""
        # Create mock forecast dates
        start_date = datetime.now().date()
        dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(horizon)]
        
        # Generate mock predictions with some trend and noise
        base_price = 186.72
        trend = np.random.uniform(-0.01, 0.02)  # Daily trend
        noise_level = 0.02
        
        predictions = []
        confidence_lower = []
        confidence_upper = []
        
        for i in range(horizon):
            # Generate prediction with trend and noise
            pred = base_price * (1 + trend * i + np.random.normal(0, noise_level))
            predictions.append(pred)
            
            # Generate confidence intervals
            confidence_width = pred * 0.05  # 5% confidence width
            confidence_lower.append(pred - confidence_width)
            confidence_upper.append(pred + confidence_width)
        
        return {
            "model_name": model_name,
            "predictions": [
                {
                    "date": dates[i],
                    "predicted": predictions[i],
                    "confidence_lower": confidence_lower[i],
                    "confidence_upper": confidence_upper[i]
                }
                for i in range(horizon)
            ],
            "summary": {
                "start_price": base_price,
                "end_price": predictions[-1],
                "total_return": (predictions[-1] - base_price) / base_price * 100,
                "max_price": max(predictions),
                "min_price": min(predictions)
            }
        }
    
    async def export_csv(self, analysis_id: str, data_type: str, analysis_results: Dict) -> io.StringIO:
        """Export analysis results as CSV"""
        try:
            if analysis_id not in analysis_results:
                raise ValueError(f"Analysis {analysis_id} not found")
            
            csv_buffer = io.StringIO()
            
            if data_type == "forecast":
                # Export forecast data
                data = []
                for model_name, model_data in analysis_results[analysis_id]["models"].items():
                    # Add mock forecast data to CSV
                    for i in range(7):  # 7 days forecast
                        date = (datetime.now().date() + timedelta(days=i)).strftime("%Y-%m-%d")
                        price = 186.72 * (1 + np.random.uniform(-0.02, 0.02))
                        data.append({
                            "date": date,
                            "model": model_name,
                            "predicted_price": price,
                            "confidence_lower": price * 0.95,
                            "confidence_upper": price * 1.05
                        })
                
                df = pd.DataFrame(data)
                df.to_csv(csv_buffer, index=False)
            
            elif data_type == "metrics":
                # Export model metrics
                data = []
                for model_name, model_data in analysis_results[analysis_id]["models"].items():
                    metrics = model_data.get("metrics", {})
                    row = {"model": model_name}
                    row.update(metrics)
                    data.append(row)
                
                df = pd.DataFrame(data)
                df.to_csv(csv_buffer, index=False)
            
            csv_buffer.seek(0)
            return csv_buffer
            
        except Exception as e:
            logger.error(f"Error exporting CSV: {str(e)}")
            raise
    
    async def export_json(self, analysis_id: str, data_type: str, analysis_results: Dict) -> Dict[str, Any]:
        """Export analysis results as JSON"""
        try:
            if analysis_id not in analysis_results:
                raise ValueError(f"Analysis {analysis_id} not found")
            
            if data_type == "forecast":
                # Return forecast data
                forecasts = {}
                for model_name, model_data in analysis_results[analysis_id]["models"].items():
                    # Generate mock forecast for export
                    forecast = self._generate_mock_forecast(model_name, 7)
                    forecasts[model_name] = forecast
                
                return {
                    "analysis_id": analysis_id,
                    "data_type": data_type,
                    "forecasts": forecasts,
                    "exported_at": datetime.now().isoformat()
                }
            
            elif data_type == "full":
                # Return complete analysis results
                return {
                    "analysis_id": analysis_id,
                    "data_type": data_type,
                    "results": analysis_results[analysis_id],
                    "exported_at": datetime.now().isoformat()
                }
            
            else:
                return analysis_results[analysis_id]
                
        except Exception as e:
            logger.error(f"Error exporting JSON: {str(e)}")
            raise
