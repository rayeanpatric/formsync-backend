#!/bin/bash

# Collaborative Form App API Test Runner
# This script runs the Postman tests using Newman CLI

echo "🚀 Collaborative Form App API Test Runner"
echo "=========================================="

# Check if Newman is installed
if ! command -v newman &> /dev/null; then
    echo "❌ Newman CLI not found. Installing..."
    npm install -g newman
fi

# Default to local environment
ENVIRONMENT="local"
BASE_URL="http://localhost:3000"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENVIRONMENT="$2"
            shift
            shift
            ;;
        --url)
            BASE_URL="$2"
            shift
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --env [local|production]  Set environment (default: local)"
            echo "  --url [URL]              Set custom base URL"
            echo "  --help                   Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                          # Run tests locally"
            echo "  $0 --env production                        # Run tests on production"
            echo "  $0 --url http://localhost:3000            # Run tests on custom URL"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

# Set production URL if environment is production
if [ "$ENVIRONMENT" = "production" ]; then
    BASE_URL="https://base-backend-try-production.up.railway.app"
fi

echo "🌍 Environment: $ENVIRONMENT"
echo "🔗 Base URL: $BASE_URL"
echo ""

# Check if server is accessible
echo "🔍 Checking server connectivity..."
if curl -f -s --connect-timeout 10 "$BASE_URL/health" > /dev/null; then
    echo "✅ Server is accessible"
else
    echo "❌ Server is not accessible. Please check:"
    echo "   - Server is running"
    echo "   - URL is correct: $BASE_URL"
    echo "   - Network connectivity"
    exit 1
fi

echo ""
echo "🧪 Running API tests..."
echo "========================"

# Run Newman with the specified environment
newman run collection.json \
    -e environment.json \
    --env-var "baseUrl=$BASE_URL" \
    --reporters cli,html \
    --reporter-html-export "test-report-$(date +%Y%m%d-%H%M%S).html" \
    --color on \
    --delay-request 100

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests completed successfully!"
    echo "📊 Test report saved as HTML file"
else
    echo ""
    echo "❌ Some tests failed. Check the output above for details."
    exit 1
fi
