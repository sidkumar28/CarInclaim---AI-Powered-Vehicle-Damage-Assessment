#!/bin/bash

apt update -y
apt install -y docker.io git awscli

systemctl start docker
systemctl enable docker

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

git clone https://github.com/sidkumar28/CarInclaim---AI-Powered-Vehicle-Damage-Assessment.git carinclaim
cd carinclaim

# Create .env
cat <<EOF > .env
OPENAI_API_KEY=$OPENAI_KEY
LOG_LEVEL=INFO
ENVIRONMENT=production
EOF

docker compose up -d --build
