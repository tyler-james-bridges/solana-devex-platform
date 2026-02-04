#!/bin/bash
#
# Stop All Services - Clean shutdown of demo environment
#

echo " Stopping Solana DevEx Platform Services"
echo "==========================================="

if [ -f .service_pids ]; then
    echo " Reading service PIDs..."
    PIDS=$(cat .service_pids)
    
    echo " Stopping services gracefully..."
    for PID in $PIDS; do
        if kill -0 $PID 2>/dev/null; then
            echo "Stopping service PID: $PID"
            kill -TERM $PID
        fi
    done
    
    echo " Waiting for graceful shutdown..."
    sleep 5
    
    echo " Force killing any remaining processes..."
    for PID in $PIDS; do
        if kill -0 $PID 2>/dev/null; then
            echo "Force killing PID: $PID"
            kill -KILL $PID
        fi
    done
    
    rm .service_pids
    echo " Service PIDs file removed"
else
    echo "  No .service_pids file found"
    echo " Checking for running processes on our ports..."
    
    # Kill processes on our known ports
    for PORT in 3000 3002 3004 3005; do
        PID=$(lsof -ti:$PORT)
        if [ ! -z "$PID" ]; then
            echo " Killing process on port $PORT (PID: $PID)"
            kill -KILL $PID
        fi
    done
fi

# Clean up log files
if [ -d "logs" ]; then
    echo " Cleaning up log files..."
    rm -rf logs/*.log
fi

echo ""
echo " All services stopped"
echo " Ready to restart with: ./scripts/start-all-services.sh"