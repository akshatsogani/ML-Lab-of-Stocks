import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class BacktestingService:
    def __init__(self):
        pass
    
    async def run_backtest(self, analysis_id: str, period: str, rolling_window: str, 
                          forecast_horizon: str, metrics: List[str], 
                          analysis_results: Dict) -> Dict[str, Any]:
        """Run backtesting analysis"""
        try:
            if analysis_id not in analysis_results:
                raise ValueError(f"Analysis {analysis_id} not found")
            
            logger.info(f"Running backtest for analysis {analysis_id}")
            
            # Extract parameters
            period_days = self._parse_period(period)
            window_days = self._parse_period(rolling_window)
            horizon_days = self._parse_period(forecast_horizon)
            
            # Get available models
            models = analysis_results[analysis_id]["models"]
            
            backtest_results = {}
            
            for model_name in models.keys():
                logger.info(f"Backtesting {model_name}")
                
                # Run backtest for this model
                model_results = await self._backtest_model(
                    model_name=model_name,
                    period_days=period_days,
                    window_days=window_days,
                    horizon_days=horizon_days,
                    metrics=metrics
                )
                
                backtest_results[model_name] = model_results
            
            # Calculate overall statistics
            overall_stats = self._calculate_overall_stats(backtest_results)
            
            return {
                "analysis_id": analysis_id,
                "backtest_results": backtest_results,
                "overall_stats": overall_stats,
                "parameters": {
                    "period": period,
                    "rolling_window": rolling_window,
                    "forecast_horizon": forecast_horizon,
                    "metrics": metrics
                },
                "completed_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error running backtest: {str(e)}")
            raise
    
    async def _backtest_model(self, model_name: str, period_days: int, 
                            window_days: int, horizon_days: int, 
                            metrics: List[str]) -> Dict[str, Any]:
        """Run backtest for a single model"""
        try:
            # Generate mock historical data for backtesting
            dates = pd.date_range(
                start=datetime.now() - timedelta(days=period_days),
                end=datetime.now(),
                freq='D'
            )
            
            # Mock actual prices (would be real historical data)
            np.random.seed(42)  # For reproducibility
            base_price = 180.0
            actual_prices = []
            current_price = base_price
            
            for _ in range(len(dates)):
                # Random walk with slight upward trend
                change = np.random.normal(0.001, 0.02)  # 0.1% mean daily return, 2% volatility
                current_price *= (1 + change)
                actual_prices.append(current_price)
            
            # Generate mock predictions (would be from actual model)
            predicted_prices = []
            prediction_errors = []
            
            for actual in actual_prices:
                # Add some noise to simulate prediction error
                error = np.random.normal(0, actual * 0.03)  # 3% prediction error
                predicted = actual + error
                predicted_prices.append(predicted)
                prediction_errors.append(abs(error))
            
            # Calculate metrics
            metrics_results = {}
            
            if "mae" in metrics:
                metrics_results["mae"] = np.mean(prediction_errors)
            
            if "rmse" in metrics:
                mse = np.mean([(a - p) ** 2 for a, p in zip(actual_prices, predicted_prices)])
                metrics_results["rmse"] = np.sqrt(mse)
            
            if "mape" in metrics:
                mape = np.mean([abs((a - p) / a) for a, p in zip(actual_prices, predicted_prices) if a != 0])
                metrics_results["mape"] = mape * 100  # Convert to percentage
            
            if "sharpe" in metrics:
                # Calculate Sharpe ratio based on prediction accuracy
                returns = [(p / a - 1) for a, p in zip(actual_prices[:-1], actual_prices[1:])]
                if len(returns) > 1 and np.std(returns) > 0:
                    sharpe = np.mean(returns) / np.std(returns) * np.sqrt(252)  # Annualized
                else:
                    sharpe = 0
                metrics_results["sharpe"] = sharpe
            
            # Calculate rolling accuracy
            rolling_accuracy = self._calculate_rolling_accuracy(actual_prices, predicted_prices)
            
            return {
                "model_name": model_name,
                "metrics": metrics_results,
                "rolling_accuracy": rolling_accuracy,
                "total_predictions": len(actual_prices),
                "period_start": dates[0].strftime("%Y-%m-%d"),
                "period_end": dates[-1].strftime("%Y-%m-%d")
            }
            
        except Exception as e:
            logger.error(f"Error backtesting model {model_name}: {str(e)}")
            raise
    
    def _calculate_rolling_accuracy(self, actual: List[float], predicted: List[float]) -> List[Dict[str, Any]]:
        """Calculate rolling accuracy over different time periods"""
        accuracy_trend = []
        
        # Weekly accuracy
        window = 7
        for i in range(window, len(actual), window):
            window_actual = actual[i-window:i]
            window_predicted = predicted[i-window:i]
            
            # Calculate accuracy as 1 - MAPE
            mape = np.mean([abs((a - p) / a) for a, p in zip(window_actual, window_predicted) if a != 0])
            accuracy = max(0, 1 - mape) * 100  # Convert to percentage
            
            accuracy_trend.append({
                "period": f"Week {len(accuracy_trend) + 1}",
                "accuracy": round(accuracy, 1),
                "end_date": (datetime.now() - timedelta(days=len(actual) - i)).strftime("%Y-%m-%d")
            })
        
        return accuracy_trend
    
    def _calculate_overall_stats(self, backtest_results: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate overall backtesting statistics"""
        try:
            all_metrics = {}
            
            # Collect all metrics from all models
            for model_name, results in backtest_results.items():
                for metric_name, value in results["metrics"].items():
                    if metric_name not in all_metrics:
                        all_metrics[metric_name] = []
                    all_metrics[metric_name].append(value)
            
            # Calculate averages
            avg_metrics = {}
            for metric_name, values in all_metrics.items():
                avg_metrics[f"avg_{metric_name}"] = np.mean(values)
                avg_metrics[f"best_{metric_name}"] = min(values) if metric_name in ["mae", "rmse", "mape"] else max(values)
            
            # Find best performing model
            best_model = min(
                backtest_results.keys(),
                key=lambda x: backtest_results[x]["metrics"].get("mape", float("inf"))
            )
            
            return {
                "summary_metrics": avg_metrics,
                "best_model": best_model,
                "total_models": len(backtest_results),
                "evaluation_period": {
                    "start": min([r["period_start"] for r in backtest_results.values()]),
                    "end": max([r["period_end"] for r in backtest_results.values()])
                }
            }
            
        except Exception as e:
            logger.error(f"Error calculating overall stats: {str(e)}")
            return {}
    
    def _parse_period(self, period_str: str) -> int:
        """Parse period string to number of days"""
        period_map = {
            "1 Day": 1,
            "7 Days": 7,
            "30 Days": 30,
            "1 Week": 7,
            "2 Weeks": 14,
            "1 Month": 30,
            "2 Months": 60,
            "Last 3 Months": 90,
            "Last 6 Months": 180,
            "Last 1 Year": 365,
            "Last 2 Years": 730
        }
        
        return period_map.get(period_str, 30)  # Default to 30 days
    
    async def get_accuracy_trend(self, analysis_id: str, model_name: str) -> List[Dict[str, Any]]:
        """Get accuracy trend for a specific model"""
        try:
            # Mock accuracy trend data
            periods = ["Last Week", "Last Month", "Last Quarter"]
            accuracies = [91, 87, 83]  # Mock declining accuracy over longer periods
            
            trend = []
            for period, accuracy in zip(periods, accuracies):
                trend.append({
                    "period": period,
                    "accuracy": accuracy,
                    "model": model_name
                })
            
            return trend
            
        except Exception as e:
            logger.error(f"Error getting accuracy trend: {str(e)}")
            return []
    
    async def compare_models(self, analysis_id: str, metric: str = "mape") -> Dict[str, Any]:
        """Compare models based on a specific metric"""
        try:
            # Mock model comparison data
            models = ["Prophet", "ARIMA", "LSTM", "XGBoost"]
            
            if metric == "accuracy":
                scores = [87, 84, 82, 79]
            elif metric == "mape":
                scores = [1.8, 2.1, 2.3, 2.7]
            elif metric == "mae":
                scores = [2.34, 2.56, 2.78, 3.02]
            else:
                scores = [np.random.uniform(1, 5) for _ in models]
            
            comparison = []
            for model, score in zip(models, scores):
                comparison.append({
                    "model": model,
                    "score": score,
                    "rank": scores.index(score) + 1
                })
            
            # Sort by score (ascending for error metrics, descending for accuracy)
            reverse_sort = metric == "accuracy"
            comparison.sort(key=lambda x: x["score"], reverse=reverse_sort)
            
            return {
                "metric": metric,
                "comparison": comparison,
                "best_model": comparison[0]["model"]
            }
            
        except Exception as e:
            logger.error(f"Error comparing models: {str(e)}")
            return {}
