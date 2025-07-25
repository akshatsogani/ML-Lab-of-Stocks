import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import asyncio
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class StockDataService:
    def __init__(self):
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes cache
    
    async def fetch_stock_data(self, ticker: str, start_date: str, end_date: str, interval: str = "1d") -> Dict[str, Any]:
        """Fetch historical stock data using yfinance"""
        try:
            # Convert interval format
            yf_interval = self._convert_interval(interval)
            
            # Create cache key
            cache_key = f"{ticker}_{start_date}_{end_date}_{yf_interval}"
            
            # Check cache
            if self._is_cached(cache_key):
                logger.info(f"Returning cached data for {ticker}")
                return self.cache[cache_key]["data"]
            
            # Fetch data from yfinance
            logger.info(f"Fetching fresh data for {ticker}")
            stock = yf.Ticker(ticker)
            
            # Get historical data
            hist_data = stock.history(
                start=start_date,
                end=end_date,
                interval=yf_interval,
                auto_adjust=True
            )
            
            if hist_data.empty:
                raise ValueError(f"No data found for ticker {ticker}")
            
            # Convert to list of dictionaries
            data_list = []
            for date, row in hist_data.iterrows():
                data_list.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "open": float(row["Open"]) if pd.notna(row["Open"]) else None,
                    "high": float(row["High"]) if pd.notna(row["High"]) else None,
                    "low": float(row["Low"]) if pd.notna(row["Low"]) else None,
                    "close": float(row["Close"]) if pd.notna(row["Close"]) else None,
                    "volume": int(row["Volume"]) if pd.notna(row["Volume"]) else None,
                })
            
            # Calculate data quality metrics
            quality = self._calculate_data_quality(hist_data)
            
            result = {
                "ticker": ticker,
                "data": data_list,
                "quality": quality,
                "metadata": {
                    "start_date": start_date,
                    "end_date": end_date,
                    "interval": interval,
                    "total_points": len(data_list)
                }
            }
            
            # Cache the result
            self.cache[cache_key] = {
                "data": result,
                "timestamp": datetime.now()
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error fetching stock data for {ticker}: {str(e)}")
            raise
    
    async def validate_ticker(self, ticker: str) -> bool:
        """Validate if a ticker exists"""
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            
            # Check if we got valid info
            if not info or 'symbol' not in info:
                return False
            
            # Try to get some recent data
            hist = stock.history(period="5d")
            return not hist.empty
            
        except Exception as e:
            logger.error(f"Error validating ticker {ticker}: {str(e)}")
            return False
    
    async def get_stock_info(self, ticker: str) -> Dict[str, Any]:
        """Get basic stock information"""
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            
            return {
                "symbol": info.get("symbol", ticker),
                "name": info.get("longName", info.get("shortName", "N/A")),
                "sector": info.get("sector", "N/A"),
                "industry": info.get("industry", "N/A"),
                "market_cap": info.get("marketCap", None),
                "currency": info.get("currency", "USD"),
                "exchange": info.get("exchange", "N/A"),
            }
        except Exception as e:
            logger.error(f"Error getting stock info for {ticker}: {str(e)}")
            return {"symbol": ticker, "name": "N/A"}
    
    def _convert_interval(self, interval: str) -> str:
        """Convert frontend interval format to yfinance format"""
        interval_map = {
            "1 Minute": "1m",
            "5 Minutes": "5m",
            "15 Minutes": "15m",
            "30 Minutes": "30m",
            "1 Hour": "1h",
            "1 Day": "1d",
            "1 Week": "1wk",
            "1 Month": "1mo"
        }
        return interval_map.get(interval, "1d")
    
    def _calculate_data_quality(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Calculate data quality metrics"""
        if data.empty:
            return {"completeness": 0, "missing_values": 0, "outliers": 0}
        
        total_points = len(data)
        missing_values = data.isnull().sum().sum()
        
        # Calculate completeness
        completeness = ((total_points * len(data.columns) - missing_values) / 
                       (total_points * len(data.columns))) * 100
        
        # Detect outliers using IQR method on close prices
        close_prices = data["Close"].dropna()
        if len(close_prices) > 0:
            Q1 = close_prices.quantile(0.25)
            Q3 = close_prices.quantile(0.75)
            IQR = Q3 - Q1
            outliers = len(close_prices[(close_prices < Q1 - 1.5 * IQR) | 
                                      (close_prices > Q3 + 1.5 * IQR)])
            outlier_percentage = (outliers / len(close_prices)) * 100
        else:
            outlier_percentage = 0
        
        return {
            "completeness": round(completeness, 1),
            "missing_values": int(missing_values),
            "outliers": round(outlier_percentage, 1)
        }
    
    def _is_cached(self, cache_key: str) -> bool:
        """Check if data is cached and still valid"""
        if cache_key not in self.cache:
            return False
        
        cache_time = self.cache[cache_key]["timestamp"]
        return (datetime.now() - cache_time).seconds < self.cache_ttl
