output "server_ip" {
  value       = aws_eip.carinclaim_eip.public_ip
  description = "Elastic IP address of CarinClaim server (stable)"
}