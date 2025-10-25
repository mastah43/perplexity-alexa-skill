#!/bin/bash

# Test script for Alexa skill using ASK CLI

set -e

echo "🧪 Testing Alexa Skill with ASK CLI"

# Check if ASK CLI is available
if ! command -v ask &> /dev/null; then
    echo "❌ ASK CLI is not installed. Install with: npm install -g ask-cli"
    exit 1
fi

# Test LaunchRequest
echo "1️⃣  Testing LaunchRequest..."
ask dialog --replay-file test/fixtures/alexa-launch-request.json --skill-id ${ALEXA_SKILL_ID:-"your-skill-id"}

# Test Help Intent
echo "2️⃣  Testing HelpIntent..."
ask dialog --replay-file test/fixtures/alexa-help-request.json --skill-id ${ALEXA_SKILL_ID:-"your-skill-id"}

# Test Query Intent
echo "3️⃣  Testing AskPerplexityIntent..."
ask dialog --replay-file test/fixtures/alexa-query-request.json --skill-id ${ALEXA_SKILL_ID:-"your-skill-id"}

echo "✅ Alexa skill testing completed!"