resource "aws_key_pair" "deploy" {
  key_name   = "carinclaim-key"
  public_key = file(var.ssh_public_key_path)
}

resource "aws_security_group" "carinclaim_sg" {
  name = "carinclaim-sg"

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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_instance" "carinclaim" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.deploy.key_name
  vpc_security_group_ids = [aws_security_group.carinclaim_sg.id]

  tags = {
    Name = "carinclaim-server"
  }
}

resource "aws_eip" "carinclaim_eip" {
  domain = "vpc"
  tags = {
    Name = "carinclaim-eip"
  }
}
resource "aws_eip_association" "carinclaim_eip_assoc" {
  instance_id   = aws_instance.carinclaim.id
  allocation_id = aws_eip.carinclaim_eip.id
}


