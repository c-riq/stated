#!/bin/bash

# Set variables
BACKUP_DIR="./backups"
LATEST_BACKUP=$(ls -t $BACKUP_DIR/*.gz | head -1)

# Check if backup exists
if [ -z "$LATEST_BACKUP" ]; then
    echo "No backup file found in $BACKUP_DIR"
    exit 1
fi

echo "Using backup file: $LATEST_BACKUP"

# Stop PostgreSQL service
echo "Stopping PostgreSQL..."
sudo systemctl stop postgresql

# Start PostgreSQL with new version
echo "Starting PostgreSQL..."
sudo systemctl start postgresql
sleep 5  # Wait for PostgreSQL to start

# Restore from backup
echo "Restoring PostgreSQL backup..."
gunzip -c "$LATEST_BACKUP" | PGPASSWORD="sdf" psql -h localhost -U sdf

# Check if restore was successful
if [ $? -eq 0 ]; then
    echo "Restore completed successfully"
else
    echo "Restore failed!"
    exit 1
fi

echo "Database restore complete!" 