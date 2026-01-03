#!/bin/bash
# Inspect chatbot_contacts table structure
export PGPASSWORD=$DATABASE_PASSWORD
psql "$DATABASE_URL" -c "\d chatbot_contacts"
