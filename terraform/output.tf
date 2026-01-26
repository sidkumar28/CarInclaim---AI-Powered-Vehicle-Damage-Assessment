output "server_ip" {
  value       = aws_instance.carinclaim.public_ip
  description = "Public IP address of CarinClaim EC2 instance"
}
