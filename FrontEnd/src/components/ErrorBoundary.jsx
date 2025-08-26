import React from 'react';
import { motion } from 'framer-motion';
import { FiWifi, FiWifiOff, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isRetrying: false 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ isRetrying: true });
    setTimeout(() => {
      this.setState({ 
        hasError: false, 
        error: null, 
        errorInfo: null,
        isRetrying: false 
      });
    }, 1000);
  };

  isConnectionError = (error) => {
    if (!error) return false;
    
    const connectionErrors = [
      'ERR_CONNECTION_CLOSED',
      'ERR_NETWORK',
      'ERR_INTERNET_DISCONNECTED',
      'ERR_NAME_NOT_RESOLVED',
      'ERR_CONNECTION_REFUSED',
      'ERR_CONNECTION_TIMED_OUT'
    ];
    
    return connectionErrors.some(errType => 
      error.message?.includes(errType) || 
      error.code === errType ||
      error.name === errType
    );
  };

  isApiError = (error) => {
    if (!error) return false;
    
    const apiErrors = [
      'ERR_BAD_REQUEST',
      'ERR_BAD_RESPONSE',
      'ERR_BAD_OPTION',
      'ERR_BAD_OPTION_VALUE'
    ];
    
    return apiErrors.some(errType => 
      error.message?.includes(errType) || 
      error.code === errType ||
      error.name === errType
    );
  };

  render() {
    if (this.state.hasError) {
      const isConnectionError = this.isConnectionError(this.state.error);
      const isApiError = this.isApiError(this.state.error);

      return (
        <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
          <motion.div 
            className="bg-neutral-800 rounded-xl p-8 max-w-md w-full text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6">
              {isConnectionError ? (
                <FiWifiOff className="mx-auto text-red-500 text-6xl mb-4" />
              ) : isApiError ? (
                <FiAlertCircle className="mx-auto text-yellow-500 text-6xl mb-4" />
              ) : (
                <FiWifi className="mx-auto text-blue-500 text-6xl mb-4" />
              )}
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">
              {isConnectionError ? 'Connection Error' : 
               isApiError ? 'API Error' : 'Something went wrong'}
            </h2>

            <p className="text-neutral-300 mb-6">
              {isConnectionError 
                ? 'Unable to connect to the server. Please check your internet connection and try again.'
                : isApiError
                ? 'There was an issue with the API request. Please try again later.'
                : 'An unexpected error occurred. Please try refreshing the page.'
              }
            </p>

            <div className="space-y-3">
              <motion.button
                onClick={this.handleRetry}
                disabled={this.state.isRetrying}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-neutral-600 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {this.state.isRetrying ? (
                  <>
                    <FiRefreshCw className="animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <FiRefreshCw />
                    Try Again
                  </>
                )}
              </motion.button>

              <button
                onClick={() => window.location.reload()}
                className="w-full bg-neutral-700 hover:bg-neutral-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Refresh Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-neutral-400 cursor-pointer text-sm">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-neutral-500 bg-neutral-900 p-3 rounded overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 