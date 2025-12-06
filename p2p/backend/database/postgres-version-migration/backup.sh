#!/bin/bash

# Set variables
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="postgres_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform the backup
echo "Starting PostgreSQL backup..."
PGPASSWORD="sdf" pg_dumpall -h localhost -U sdf > "$BACKUP_DIR/$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $BACKUP_FILE"
    echo "Backup location: $BACKUP_DIR/$BACKUP_FILE"
else
    echo "Backup failed!"
    exit 1
fi

# Optional: Compress the backup
gzip "$BACKUP_DIR/$BACKUP_FILE"
echo "Backup compressed: ${BACKUP_FILE}.gz" 
