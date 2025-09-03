# Assetrix DevOps Assessment – CI/CD, IaC, Security

## 🎯 **What This Does**

**Builds** the application (npm install)  
**Tests** the application (npm test)  
**Builds Docker image** and pushes to Docker Hub  
**IaC**: Provisions an EC2 host and runs the container  
**Security**: CI vulnerability scan with Trivy  

## **Quick Start**

### **Local Testing**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Start the app:**
   ```bash
   npm start
   ```

4. **Test endpoints:**
   ```bash
   curl http://localhost:3000
   curl http://localhost:3000/health
   curl http://localhost:3000/api/version
   ```

### **Docker Testing**

1. **Build the image:**
   ```bash
   docker build -t assetrix-demo-app .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3000:3000 assetrix-demo-app
   ```

## 🔄 **CI/CD Pipeline (How I set it up)**

- File: `/.github/workflows/ci-cd.yml`
- Flow I chose: checkout → `npm ci` → `npm test` → Docker build → Trivy scan → push to Docker Hub (on `main`).
- Secrets: `DOCKER_USERNAME`, `DOCKER_PASSWORD` (Docker Hub access token).
- By default, the Trivy step is non‑blocking so the demo runs cleanly. To enforce security gates, set `exit-code: '1'`.

Why I kept it this way: it’s fast to understand, easy to extend (e.g., add environments), and shows the core signals (build, test, image, scan, publish).

## **Infrastructure as Code (Terraform)**

- Directory: `terraform/`
- What it does: creates a single Ubuntu EC2 instance in the default VPC, opens HTTP/SSH, installs Docker, and runs the app image via user_data (80→3000).
- Variables you’ll change most often: `app_image`, `aws_region`, `instance_type`.
- Outputs: public IP/DNS and a ready URL.
- Steps are in `terraform/README.md`.

Why this path: for an assessment, a minimal EC2 + Docker host communicates the approach clearly without the overhead of a full orchestrator.

## **Security in CI**

- I added a Trivy scan step after the Docker build.
- It reports HIGH/CRITICAL findings in logs; it can be made blocking in one line if required.

## SSL/TLS Implementation

Below is how I would implement SSL/TLS for production web apps on Linode and AWS, keeping it simple, maintainable, and secure.

### Linode
- Tools/services:
  - Linode NodeBalancer (TLS termination) or NGINX on the VM
  - Let’s Encrypt (Certbot or acme.sh) for certificates
  - Linode DNS (optional) for managed DNS records
- Configuration steps (NodeBalancer):
  1. Point your domain to the NodeBalancer public IP via an A/AAAA record
  2. Create an HTTPS frontend (port 443) with a TLS certificate (upload a Let’s Encrypt cert or use ACME via automation on a small helper instance)
  3. Create an HTTP frontend (port 80) that issues 301 redirects to HTTPS
  4. Register a backend pool targeting your app instances (port 3000 or 80)
- Configuration steps (VM with NGINX):
  1. Install NGINX and Certbot on the VM hosting the app or reverse proxy
  2. Configure an NGINX server block for port 80 that only redirects to HTTPS
  3. Obtain a Let’s Encrypt cert: `certbot --nginx -d example.com -d www.example.com` 
  4. Enable HTTP/2 on the 443 server block and proxy_pass to the app
- Automate renewal:
  - Certbot installs a systemd timer/cron by default; verify `systemctl status certbot.timer`
  - Optionally use DNS-01 validation (acme.sh or certbot-dns-* plugins) to renew without opening port 80
- Ongoing security:
  - Force HTTP→HTTPS (301), enable HSTS (e.g., `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`)
  - Restrict TLS policies to TLS 1.2/1.3 and strong ciphers; enable OCSP stapling
  - Rotate keys/certs on schedule; monitor expiry via cron mail, Prometheus exporter, or an external uptime monitor that checks TLS expiry

### AWS
- Tools/services:
  - AWS Certificate Manager (ACM) + Application Load Balancer (ALB) or CloudFront
  - Route 53 for DNS validation 
  - Alternatively, EC2 with NGINX + Certbot if not using ALB/CloudFront
- Configuration steps (ALB + ACM):
  1. Request a public certificate in ACM for `example.com` (+ SANs)
  2. Validate via Route 53 DNS (ACM can create validation records automatically)
  3. Attach the ACM cert to the ALB HTTPS listener (port 443)
  4. Add an HTTP listener (port 80) that redirects to HTTPS (301)
  5. Set a modern TLS security policy on the ALB (TLS 1.2/1.3 only)
- Configuration steps (CloudFront):
  1. Upload/request an ACM cert in us-east-1
  2. Attach it to your CloudFront distribution; enforce HTTPS-only viewer protocol
  3. Set a modern minimum TLS version and enable HTTP/2/3
- EC2/NGINX alternative:
  1. Install NGINX and Certbot
  2. Use the Route53 DNS plugin (`certbot-dns-route53`) to automate DNS-01 validation
  3. Configure 80→443 redirect, HSTS, TLS 1.2/1.3, OCSP stapling
- Automate renewal:
  - ACM renews automatically once DNS validation is in place—no downtime
  - For EC2/Certbot, rely on the systemd timer and Route 53 DNS-01 to renew without opening port 80
- Ongoing security:
  - Enforce HTTPS at the edge (ALB/CloudFront), redirect 80→443, enable HSTS
  - Use AWS-managed TLS policies (e.g., ELBSecurityPolicy-TLS13-1-2-2021-06)
  - Set CloudWatch Alarms or Health Checks for certificate expiry (or use a Lambda that scans ACM and posts to SNS/Slack)
  - Regularly run SSL/TLS scans (e.g., SSL Labs) and review findings as part of release checks

What I’d ship next:
- Kubernetes ingress with `cert-manager` (ACME DNS-01 via Route 53 or Linode DNS) for automatic issuance/renewal
- Enforce security gates in CI (fail on HIGH/CRITICAL)
- Simple certificate‑expiry alerts if ACM isn’t used everywhere

## 📁 **Project Structure**

```
.
├── app.js                    # Simple Express.js app
├── package.json              # Dependencies and scripts
├── Dockerfile                # Docker configuration
├── jest.config.js            # Jest test configuration
├── tests/app.test.js         # Test files
├── .github/workflows/ci-cd.yml # GitHub Actions workflow
├── terraform/                # Minimal IaC for EC2 + Docker
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── README.md
└── README.md                 # This file
```

