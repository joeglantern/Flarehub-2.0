#!/bin/bash
# Flarehub deployment script
# Run this on the VPS: bash deploy.sh
# First-time setup: bash deploy.sh --setup

set -e

DEPLOY_DIR="/var/www/flarehub"
BACKEND_DIR="$DEPLOY_DIR/flarehub-backend"
FRONTEND_DIR="$DEPLOY_DIR/flarehub-frontend"
LOG_DIR="/var/log/flarehub"
REPO_URL="https://github.com/joeglantern/Flarehub-2.0.git"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
err()  { echo -e "${RED}[error]${NC} $1"; exit 1; }

# ── First-time setup ─────────────────────────────────────────────────────────
if [ "$1" = "--setup" ]; then
    log "Running first-time setup..."

    # Install Node.js 20 if not present
    if ! command -v node &>/dev/null; then
        log "Installing Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi

    # Install PM2 if not present
    if ! command -v pm2 &>/dev/null; then
        log "Installing PM2..."
        sudo npm install -g pm2
        pm2 startup systemd -u "$USER" --hp "$HOME" | tail -1 | sudo bash
    fi

    # Create deploy directory
    sudo mkdir -p "$DEPLOY_DIR"
    sudo chown "$USER":"$USER" "$DEPLOY_DIR"

    # Create log directory
    sudo mkdir -p "$LOG_DIR"
    sudo chown "$USER":"$USER" "$LOG_DIR"

    # Clone repo
    log "Cloning repository..."
    git clone "$REPO_URL" "$DEPLOY_DIR"

    # ── Backend .env ─────────────────────────────────────────────────────────
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        warn "Backend .env not found. Copying from .env.example..."
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        warn "Edit $BACKEND_DIR/.env with your production secrets before starting!"
    fi

    # ── nginx ────────────────────────────────────────────────────────────────
    log "Installing nginx config..."
    sudo cp "$DEPLOY_DIR/deploy/nginx.conf" /etc/nginx/sites-available/flarehub
    sudo ln -sf /etc/nginx/sites-available/flarehub /etc/nginx/sites-enabled/flarehub
    warn "Edit /etc/nginx/sites-available/flarehub and replace YOUR_VPS_IP with your actual IP."
    warn "Then run: sudo nginx -t && sudo systemctl reload nginx"

    log "Setup complete. Next steps:"
    echo "  1. Edit $BACKEND_DIR/.env with real production secrets"
    echo "  2. Edit /etc/nginx/sites-available/flarehub — replace YOUR_VPS_IP"
    echo "  3. Run: bash deploy.sh   (to build and start)"
    exit 0
fi

# ── Regular deploy ────────────────────────────────────────────────────────────
[ -d "$DEPLOY_DIR/.git" ] || err "Repo not found at $DEPLOY_DIR. Run: bash deploy.sh --setup"
[ -f "$BACKEND_DIR/.env" ]  || err "Missing $BACKEND_DIR/.env — create it from .env.example first"

log "Pulling latest code..."
cd "$DEPLOY_DIR"
git pull origin main

# Build backend
log "Building backend..."
cd "$BACKEND_DIR"
npm ci
npm run build

# Build frontend
log "Building frontend..."
cd "$FRONTEND_DIR"
npm ci
npm run build

# Reload PM2 (zero-downtime)
log "Reloading backend process..."
cd "$DEPLOY_DIR"
if pm2 list | grep -q "flarehub-api"; then
    pm2 reload ecosystem.config.cjs --env production
else
    pm2 start ecosystem.config.cjs --env production
    pm2 save
fi

log "Reloading nginx..."
sudo nginx -t && sudo systemctl reload nginx

log "Deploy complete."
pm2 status flarehub-api
