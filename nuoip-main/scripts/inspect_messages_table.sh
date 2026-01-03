#!/bin/bash
export PGPASSWORD=$DATABASE_PASSWORD
psql "$DATABASE_URL" -c "\d whatsapp_messages"
