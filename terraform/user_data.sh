#!/bin/bash

# Update packages
apt update -y

# Install required packages
apt install -y docker.io docker-compose git awscli

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add ubuntu user to docker group
usermod -aG docker ubuntu

# Fetch OpenAI key from SSM
OPENAI_KEY=$(aws ssm get-parameter \
  --name "/carinclaim/OPENAI_API_KEY" \
  --with-decryption \
  --query "Parameter.Value" \
  --output text \
  --region ap-south-1)

# Create app directory
mkdir -p /home/ubuntu/apps
cd /home/ubuntu/apps

# Clone repository
git clone https://github.com/sidkumar28/CarInclaim---AI-Powered-Vehicle-Damage-Assessment.git carinclaim
cd carinclaim

# Create .env file
cat <<EOF > .env
OPENAI_API_KEY=$OPENAI_KEY
LOG_LEVEL=INFO
ENVIRONMENT=development
EOF

# Run containers (legacy docker-compose)
docker-compose up -d
