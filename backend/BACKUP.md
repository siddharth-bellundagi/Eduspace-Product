# Backup Strategy — Greenwood Public School Backend

## Overview

The backend uses two Firebase services that need backup:
1. **Firestore** — All application data (20+ collections)
2. **Firebase Storage** — Uploaded images and PDFs

---

## 1. Firestore Backup

### 1.1 Automatic Backups (Recommended)

Firebase offers built-in scheduled exports. Set this up in Google Cloud Console.

**Enable via Google Cloud Console:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project `st-thomas-school-b71e3`
3. Navigate to **Firestore → Import/Export**
4. Click **Schedule Export**
5. Set schedule (recommended: daily at 2:00 AM IST)
6. Set destination: `gs://st-thomas-school-b71e3-backups/firestore/`

### 1.2 Manual Export (via gcloud CLI)

```bash
# Install Google Cloud SDK
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login
gcloud config set project st-thomas-school-b71e3

# Create a backup bucket (one-time setup)
gsutil mb gs://st-thomas-school-b71e3-backups

# Export all Firestore collections
gcloud firestore export gs://st-thomas-school-b71e3-backups/firestore/$(date +%Y-%m-%d)

# Export specific collections only
gcloud firestore export gs://st-thomas-school-b71e3-backups/firestore/$(date +%Y-%m-%d) \
  --collection-ids=announcements,gallery,faculty,staff,admission-enquiries,contact-inquiries
```

### 1.3 Restore from Backup

```bash
# Restore from a specific backup
gcloud firestore import gs://st-thomas-school-b71e3-backups/firestore/2026-08-01

# NOTE: Import will overwrite existing documents with the same IDs
# It will NOT delete documents that don't exist in the backup
```

---

## 2. Firebase Storage Backup

### 2.1 Automated Bucket Sync

```bash
# Sync storage bucket to a backup bucket
gsutil -m rsync -r gs://st-thomas-school-b71e3.appspot.com gs://st-thomas-school-b71e3-backups/storage/$(date +%Y-%m-%d)
```

### 2.2 Download to Local Machine

```bash
# Download entire storage bucket locally
gsutil -m cp -r gs://st-thomas-school-b71e3.appspot.com ./storage-backup-$(date +%Y-%m-%d)
```

---

## 3. Backup Schedule

| Data | Frequency | Retention | Method |
|------|-----------|-----------|--------|
| Firestore (all collections) | Daily at 2:00 AM | 30 days | Scheduled export |
| Firestore (critical: admissions, contacts) | Hourly | 7 days | Scheduled export |
| Storage (images/PDFs) | Weekly (Sunday 3:00 AM) | 90 days | gsutil rsync |
| Full backup (Firestore + Storage) | Monthly (1st, 3:00 AM) | 1 year | Manual export |

---

## 4. Automated Backup Script

Create `/var/www/st-thomas/backend/scripts/backup.sh`:

```bash
#!/bin/bash
# Greenwood School — Automated Backup Script
# Run via crontab: 0 2 * * * /var/www/st-thomas/backend/scripts/backup.sh

set -e

PROJECT_ID="st-thomas-school-b71e3"
BACKUP_BUCKET="gs://${PROJECT_ID}-backups"
DATE=$(date +%Y-%m-%d)
LOG_FILE="/var/www/st-thomas/backend/logs/backup-${DATE}.log"

echo "========================================" >> "$LOG_FILE"
echo "Backup started at $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# 1. Export Firestore
echo "Exporting Firestore..." >> "$LOG_FILE"
gcloud firestore export "${BACKUP_BUCKET}/firestore/${DATE}" \
  --project="$PROJECT_ID" >> "$LOG_FILE" 2>&1

# 2. Sync Storage bucket
echo "Syncing Storage bucket..." >> "$LOG_FILE"
gsutil -m rsync -r "gs://${PROJECT_ID}.appspot.com" \
  "${BACKUP_BUCKET}/storage/${DATE}" >> "$LOG_FILE" 2>&1

# 3. Clean up old backups (> 30 days)
echo "Cleaning up old backups..." >> "$LOG_FILE"
OLD_DATE=$(date -d "30 days ago" +%Y-%m-%d 2>/dev/null || date -v-30d +%Y-%m-%d)
gsutil -m rm -r "${BACKUP_BUCKET}/firestore/${OLD_DATE}" >> "$LOG_FILE" 2>&1 || true
gsutil -m rm -r "${BACKUP_BUCKET}/storage/${OLD_DATE}" >> "$LOG_FILE" 2>&1 || true

echo "Backup completed at $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"
```

### Crontab Setup

```bash
# Edit crontab
crontab -e

# Add daily backup at 2:00 AM
0 2 * * * /var/www/st-thomas/backend/scripts/backup.sh
```

---

## 5. Disaster Recovery Checklist

If you need to restore from a backup:

1. **Assess the damage** — Which collections/files are affected?
2. **Stop the application** — `pm2 stop greenwood-backend`
3. **Restore Firestore** — `gcloud firestore import gs://backup-bucket/firestore/DATE`
4. **Restore Storage** — `gsutil -m rsync -r gs://backup-bucket/storage/DATE gs://project.appspot.com`
5. **Verify data** — Check key collections via `curl http://localhost:5000/api/health`
6. **Restart application** — `pm2 restart greenwood-backend`
7. **Notify stakeholders** — Inform school admin about the restoration

---

## 6. Important Notes

- **Firebase Admin SDK bypasses security rules** — All backup/restore operations go through the Admin SDK, which has full access regardless of Firestore security rules.
- **Backup bucket costs** — Google Cloud Storage charges for backup storage. Monitor costs in Google Cloud Console → Billing.
- **Test restores regularly** — Run a test restore to a separate project quarterly to verify backups are working.
- **Never store backups in the same region** — Use multi-region or different-region backup buckets for disaster recovery.
