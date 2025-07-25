import pandas as pd
import numpy as np
import ta
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class FeatureEngineeringService:
    def __init__(self):
        self.feature_presets = {
            "basic": ["close", "volume", "sma_20"],
            "technical": ["close", "rsi", "macd", "bollinger_upper", "bollinger_lower", "ema_12", "ema_26"],
            "macro": ["close", "gdp", "cpi", "interest_rates"],
            "fundamental": ["pe_ratio", "market_cap", "close", "book_value"],
            "custom": []
        }
    
    async def generate_features(self, ticker: str, preset: str, selected_features: List[str], 
                              stock_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate features based on preset and selected features"""
        try:
            if not stock_data or not stock_data.get("data"):
                raise ValueError("Stock data is required for feature generation")
            
            # Convert stock data to DataFrame
            df = pd.DataFrame(stock_data["data"])
            df["date"] = pd.to_datetime(df["date"])
            df.set_index("date", inplace=True)
            
            # Sort by date
            df.sort_index(inplace=True)
            
            # Generate features based on preset or selected features
            features_to_generate = selected_features if preset == "custom" else self.feature_presets.get(preset, [])
            
            features_data = {}
            
            for feature in features_to_generate:
                feature_values = self._generate_feature(df, feature)
                if feature_values is not None:
                    features_data[feature] = {
                        "name": feature,
                        "values": feature_values.tolist() if isinstance(feature_values, np.ndarray) else list(feature_values),
                        "description": self._get_feature_description(feature)
                    }
            
            # Calculate feature importance (mock for now)
            importance = self._calculate_feature_importance(features_data)
            
            # Calculate correlation matrix
            correlation_matrix = self._calculate_correlation_matrix(features_data)
            
            return {
                "features": features_data,
                "feature_importance": importance,
                "correlation_matrix": correlation_matrix,
                "selected_features": features_to_generate,
                "ticker": ticker,
                "generated_at": pd.Timestamp.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating features: {str(e)}")
            raise
    
    def _generate_feature(self, df: pd.DataFrame, feature: str) -> Optional[pd.Series]:
        """Generate a specific feature"""
        try:
            if feature == "close":
                return df["close"]
            elif feature == "volume":
                return df["volume"]
            elif feature == "open":
                return df["open"]
            elif feature == "high":
                return df["high"]
            elif feature == "low":
                return df["low"]
            
            # Technical indicators
            elif feature == "sma_20":
                return ta.trend.sma_indicator(df["close"], window=20)
            elif feature == "sma_50":
                return ta.trend.sma_indicator(df["close"], window=50)
            elif feature == "ema_12":
                return ta.trend.ema_indicator(df["close"], window=12)
            elif feature == "ema_26":
                return ta.trend.ema_indicator(df["close"], window=26)
            elif feature == "rsi":
                return ta.momentum.rsi(df["close"], window=14)
            elif feature == "macd":
                return ta.trend.macd(df["close"])
            elif feature == "macd_signal":
                return ta.trend.macd_signal(df["close"])
            elif feature == "macd_diff":
                return ta.trend.macd_diff(df["close"])
            elif feature == "bollinger_upper":
                return ta.volatility.bollinger_hband(df["close"])
            elif feature == "bollinger_lower":
                return ta.volatility.bollinger_lband(df["close"])
            elif feature == "bollinger_middle":
                return ta.volatility.bollinger_mavg(df["close"])
            elif feature == "atr":
                return ta.volatility.average_true_range(df["high"], df["low"], df["close"])
            elif feature == "stoch":
                return ta.momentum.stoch(df["high"], df["low"], df["close"])
            elif feature == "williams_r":
                return ta.momentum.williams_r(df["high"], df["low"], df["close"])
            
            # Price-based features
            elif feature == "price_change":
                return df["close"].pct_change()
            elif feature == "log_return":
                return np.log(df["close"] / df["close"].shift(1))
            elif feature == "volatility":
                return df["close"].pct_change().rolling(window=20).std()
            
            # Volume-based features
            elif feature == "volume_sma":
                return ta.volume.volume_sma(df["close"], df["volume"])
            elif feature == "volume_change":
                return df["volume"].pct_change()
            
            # Mock fundamental/macro features (in real implementation, these would come from external APIs)
            elif feature == "pe_ratio":
                # Mock PE ratio (would be fetched from fundamental data API)
                return pd.Series([20.5] * len(df), index=df.index)
            elif feature == "market_cap":
                # Mock market cap (would be calculated from shares outstanding)
                return pd.Series([1000000000] * len(df), index=df.index)
            elif feature == "book_value":
                # Mock book value
                return pd.Series([15.2] * len(df), index=df.index)
            elif feature == "gdp":
                # Mock GDP growth (would be fetched from macro data API)
                return pd.Series([2.1] * len(df), index=df.index)
            elif feature == "cpi":
                # Mock CPI (would be fetched from macro data API)
                return pd.Series([3.2] * len(df), index=df.index)
            elif feature == "interest_rates":
                # Mock interest rates (would be fetched from central bank API)
                return pd.Series([5.25] * len(df), index=df.index)
            
            else:
                logger.warning(f"Unknown feature: {feature}")
                return None
                
        except Exception as e:
            logger.error(f"Error generating feature {feature}: {str(e)}")
            return None
    
    def _get_feature_description(self, feature: str) -> str:
        """Get human-readable description for a feature"""
        descriptions = {
            "close": "Daily closing price",
            "volume": "Trading volume",
            "open": "Daily opening price",
            "high": "Daily high price",
            "low": "Daily low price",
            "sma_20": "20-day Simple Moving Average",
            "sma_50": "50-day Simple Moving Average",
            "ema_12": "12-day Exponential Moving Average",
            "ema_26": "26-day Exponential Moving Average",
            "rsi": "Relative Strength Index (14-day)",
            "macd": "MACD Line",
            "macd_signal": "MACD Signal Line",
            "macd_diff": "MACD Histogram",
            "bollinger_upper": "Bollinger Bands Upper",
            "bollinger_lower": "Bollinger Bands Lower",
            "bollinger_middle": "Bollinger Bands Middle",
            "atr": "Average True Range",
            "stoch": "Stochastic Oscillator",
            "williams_r": "Williams %R",
            "price_change": "Daily price change percentage",
            "log_return": "Log returns",
            "volatility": "20-day rolling volatility",
            "volume_sma": "Volume Simple Moving Average",
            "volume_change": "Volume change percentage",
            "pe_ratio": "Price-to-Earnings Ratio",
            "market_cap": "Market Capitalization",
            "book_value": "Book Value per Share",
            "gdp": "GDP Growth Rate",
            "cpi": "Consumer Price Index",
            "interest_rates": "Central Bank Interest Rates"
        }
        return descriptions.get(feature, f"Feature: {feature}")
    
    def _calculate_feature_importance(self, features_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Calculate mock feature importance scores"""
        # In a real implementation, this would use actual ML feature importance
        importance_scores = {
            "close": 0.85,
            "volume": 0.45,
            "sma_20": 0.72,
            "rsi": 0.38,
            "macd": 0.56,
            "bollinger_upper": 0.41,
            "bollinger_lower": 0.39,
            "ema_12": 0.68,
            "ema_26": 0.65
        }
        
        importance = []
        for feature_name in features_data.keys():
            score = importance_scores.get(feature_name, np.random.uniform(0.1, 0.9))
            importance.append({
                "feature": feature_name,
                "importance": score
            })
        
        # Sort by importance descending
        importance.sort(key=lambda x: x["importance"], reverse=True)
        return importance
    
    def _calculate_correlation_matrix(self, features_data: Dict[str, Any]) -> List[List[float]]:
        """Calculate correlation matrix between features"""
        try:
            # Create DataFrame from features
            feature_df = pd.DataFrame()
            for feature_name, feature_info in features_data.items():
                values = feature_info["values"]
                if values and len(values) > 0:
                    feature_df[feature_name] = values
            
            if feature_df.empty:
                return []
            
            # Calculate correlation matrix
            corr_matrix = feature_df.corr()
            
            # Replace NaN with 0
            corr_matrix = corr_matrix.fillna(0)
            
            # Convert to list of lists
            return corr_matrix.values.tolist()
            
        except Exception as e:
            logger.error(f"Error calculating correlation matrix: {str(e)}")
            return []
    
    def get_presets(self) -> Dict[str, Any]:
        """Get available feature presets"""
        return {
            "presets": [
                {
                    "id": "basic",
                    "name": "Basic",
                    "description": "Close price, Volume, SMA",
                    "features": self.feature_presets["basic"]
                },
                {
                    "id": "technical",
                    "name": "Technical",
                    "description": "Technical indicators (RSI, MACD, Bollinger)",
                    "features": self.feature_presets["technical"]
                },
                {
                    "id": "macro",
                    "name": "Macro + Price",
                    "description": "Macroeconomic indicators + price",
                    "features": self.feature_presets["macro"]
                },
                {
                    "id": "fundamental",
                    "name": "Fundamental",
                    "description": "Fundamental analysis features",
                    "features": self.feature_presets["fundamental"]
                }
            ]
        }
