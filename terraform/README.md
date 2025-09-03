# Minimal AWS Terraform - EC2 runs Dockerized App

This Terraform creates a single EC2 instance, installs Docker, and runs your app image on port 80.

## Prerequisites
- Terraform >= 1.3
- AWS account and credentials configured (`aws configure`)
- A public Docker image (from your GitHub Actions push), e.g. `youruser/assetrix-demo-app:latest`

## Usage

1. Set variables (recommended via a `.tfvars` file or inline):
   ```hcl
   aws_region     = "us-east-1"
   environment    = "dev"
   instance_type  = "t3.micro"
   app_image      = "youruser/assetrix-demo-app:latest"
   ```

2. Initialize and apply:
   ```bash
   cd terraform
   terraform init
   terraform apply -var="app_image=youruser/assetrix-demo-app:latest"
   # or: terraform apply -var-file="values.tfvars"
   ```

3. After apply, get the URL:
   ```bash
   terraform output app_url
   ```

4. Test the app:
   ```bash
   curl http://<public-dns>/
   curl http://<public-dns>/health
   ```

## What it creates
- 1 x EC2 (Ubuntu 22.04) in the default VPC
- Security group allowing HTTP (80) and SSH (22)
- User data that installs Docker and runs the container mapped 80->3000

## Clean up
```bash
terraform destroy
```
