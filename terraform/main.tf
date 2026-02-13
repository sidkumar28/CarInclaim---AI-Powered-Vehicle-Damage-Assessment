############################################
# SSH Key Pair
############################################
resource "aws_key_pair" "deploy" {
  key_name   = "carinclaim-key"
  public_key = file(var.ssh_public_key_path)
}

############################################
# Security Group
############################################
resource "aws_security_group" "carinclaim_sg" {
  name        = "carinclaim-sg"
  description = "Security group for CarinClaim server"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

############################################
# Ubuntu AMI
############################################
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

############################################
# SSM Secure Parameter
############################################
resource "aws_ssm_parameter" "openai_api_key" {
  name  = "/carinclaim/OPENAI_API_KEY"
  type  = "SecureString"
  value = var.openai_api_key
}

############################################
# IAM Role for EC2
############################################
resource "aws_iam_role" "ec2_role" {
  name = "carinclaim-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

############################################
# Attach SSM Read Policy
############################################
resource "aws_iam_role_policy_attachment" "ssm_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess"
}

############################################
# Instance Profile
############################################
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "carinclaim-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

############################################
# EC2 Instance
############################################
resource "aws_instance" "carinclaim" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.deploy.key_name
  vpc_security_group_ids = [aws_security_group.carinclaim_sg.id]

  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name
  user_data            = file("${path.module}/user_data.sh")

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name = "carinclaim-server"
  }
}

############################################
# Elastic IP (Stable IP)
############################################
resource "aws_eip" "carinclaim_eip" {
  domain = "vpc"

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Name = "carinclaim-eip"
  }
}

resource "aws_eip_association" "carinclaim_eip_assoc" {
  instance_id   = aws_instance.carinclaim.id
  allocation_id = aws_eip.carinclaim_eip.id
}
