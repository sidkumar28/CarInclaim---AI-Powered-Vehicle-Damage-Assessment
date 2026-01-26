variable "aws_region" {
  default = "ap-south-1"
}

variable "instance_type" {
  default = "t3.micro"
}

variable "ssh_public_key_path" {
  default = "../carinclaim_deploy_key.pub"
}
