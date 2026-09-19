# ZINGO NEW ARCHITECTURE

## Core
- Telegram Mini App
- Telegram signed authentication
- Existing Cloudflare Worker API
- Existing D1 database

## PRO WORLD
AAA Esports / Gaming Command Center

Modules:
- Home
- Match Center
- Predictions
- Markets
- Stats
- Competition
- Achievements
- Rewards
- History
- Player Hub
- Leaderboard

Markets:
- Winner
- Goals
- Score

Prediction behavior:
- Select prediction
- Show Save button
- Save individually
- Show saved state
- Show result when available

## VIP WORLD
Black Diamond / Ultra Exclusive

Modules:
- VIP Command Center
- Prediction Cockpit
- Advanced Analysis Center
- Royal Rank
- Royal Rewards
- Hidden Rooms
- Hidden Features
- Hidden Rewards

Visual system:
- Black
- Gold
- Platinum
- Diamond
- Living logo
- Dynamic environment
- Maximum VFX
- Adaptive soundtrack

## PRO -> VIP
Royal Ascension cinematic:
- Full cinematic scene
- PRO transformation
- Royal gold components
- Magnetic attraction / impacts
- VFX
- Audio
- Skip button
- Enter VIP only after scene completes or Skip

## Architecture Rule
Do NOT patch the legacy frontend.
Build the new frontend as a clean architecture.
Preserve only required API / DB functionality.
