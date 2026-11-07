# PFE DevSecOps — Onboarding Guide

This repository demonstrates a complete **CI/CD security pipeline** built around a deliberately vulnerable Flask app. It shows how security checks (secrets, SAST, SBOM, image scanning, signing, etc.) are integrated into GitLab CI/CD.

## 👀 What you'll see

| Stage | What it does |
|---|---|
| **test** | Runner sanity check (`runner-check`) |
| **secrets** | Gitleaks detects hard‑coded keys in code & CI variables |
| **sast** | Semgrep static‑application‑security testing |
| **lint** | Hadolint Dockerfile linting |
| **build** | `docker build` + `docker save` (artifact `image.tar`) |
| **sbom** | Syft generates a CycloneDX SBOM from the image tarball |
| **vuln** | Trivy filesystem + config scans + Grype image scan |
| **image‑scan** | Dockle image‑best‑practices scan |
| **sign** | Cosign signs the image (only if `COSIGN_PRIVATE_KEY` var is set) |

The pipeline is intentionally **weakened** ( `allow_failure: true`, exit‑codes set to `0` ) so that it stays green even though findings exist – this is a teaching lab. To make the pipeline actually fail, remove the `allow_failure:` lines and restore the original exit‑codes.

---

## 🛠️ First‑time setup (run once)

### 1. Prerequisites
- Docker + Docker Compose (v2)
- Git
- ~8 GB free RAM

### 2. Clone
```bash
git clone https://github.com/MADMAN870/sentinelci-devsecops-audit.git
cd sentinelci-devsecops-audit
```

### 2. Allow the local HTTP registry
```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{ "insecure-registries": ["localhost:5050"] }
EOF
sudo systemctl restart docker
```

### 3. Start GitLab + Runner only
```bash
docker compose up -d gitlab gitlab-runner
```

### 3. Wait for GitLab
```bash
docker logs -f pfe-gitlab | grep -i "GitLab is up"
# (≈5–10 min)
```

### 4. Get root password & log in
```bash
docker exec pfe-gitlab cat /etc/gitlab/initial_root_password
# then open http://localhost:8080 and sign in as root
```

### 5. Create a GitLab project & push the repo
```bash
git remote add localgitlab http://localhost:8080/<namespace>/<project>.git
git push localgitlab main
```

### 5. Register the Runner (get the token from **Settings → CI/CD → Runners → New project runner**)
```bash
docker exec -it pfe-gitlab-runner gitlab-runner register \
  --non-interactive \
  --url "http://gitlab" \
  --token "<RUNNER_TOKEN>" \
  --executor "docker" \
  --docker-image "alpine:latest" \
  --docker-volumes "/var/run/docker.sock:/var/run/docker.sock" \
  --docker-network-mode "host" \
  --tag-list "pfe,security"
```

### 5. Verify the registry
```bash
docker login localhost:5050 -u root   # use the root password from step 3
```

### 6. Install host‑side tools
```bash
./scripts/install-security-tools.sh    # installs gitleaks, trivy, syft, grype, cosign, hadolint, dockle
pip install -r requirements.txt        # pre‑commit, semgrep, bandit, checkov
pre‑commit install                     # activates the Gitleaks hook
```

### 6. (Optional) Cosign signing keys
```bash
# In GitLab project → CI/CD → Variables (masked)
# COSIGN_PRIVATE_KEY, COSIGN_PUBLIC_KEY, COSIGN_PASSWORD
```

### 7. Trigger the pipeline
```bash
git commit --allow-empty -m "trigger pipeline"
git push localgitlab main
```

Watch the pipeline in **GitLab → Build → Pipelines**. All stages should complete (they are intentionally weakened).

### 7. (Optional) Run the Flask app locally
```bash
docker compose up -d pfe-vulnerable-app
curl http://localhost:5000
# to stop:
docker compose down pfe-vulnerable-app
```
---


## 🔍 Verify the app is vulnerable

The Flask app is deliberately vulnerable. You can confirm this locally:

```bash
# start the app (if not already running)
docker compose up -d pfe-vulnerable-app

# 1️⃣ Command injection via /ping
curl "http://localhost:5000/ping?host=127.0.0.1"
# you should see: PONG 127.0.0.1 executed by subprocess

# 2️⃣ Eval injection via /eval
curl "http://localhost:5000/eval?expr=2+2"
# you should see: 4

# 3️⃣ Debug mode leaking information
curl http://localhost:5000/
# you should see: PFE DevSecOps Security Audit Application
# and in the logs: DEBUG is enabled
```

You can also run the scanners manually (same as the CI pipeline):

```bash
# Gitleaks
gitleaks detect --source .

# Semgrep
semgrep scan --config auto app/

# Trivy filesystem
trivy fs --scanners vuln --severity HIGH,CRITICAL --exit-code 1 app/

# Hadolint
hadolint app/Dockerfile
```

These manual runs will produce the same findings that the CI pipeline reports.

---


## 📦 What's inside

| File / Folder | Purpose |
|---|---|
| `app/app.py` | Flask app with intentional vulns (command injection, `eval`, `debug=True`, hard‑coded keys) |
| `app/Dockerfile` | Deliberately bad Dockerfile (latest tag, `ADD`, no `USER`) |
| `app/requirements.txt` | Vulnerable dependency set (`PyJWT`, `cryptography`, `requests`) |
| `infra/deployment.yaml` / `infra/main.tf` | Insecure K8s & Terraform manifests (Trivy config scans) |
| `.gitlab-ci.yml` | Full 9‑stage pipeline (weakened gates, secret variables) |
| `scripts/install-security-tools.sh` | One‑liner to download all scanner binaries |
| `requirements.txt` | `pip` install: pre‑commit, semgrep, bandit, checkov |
| `reports/baseline/` | Pre‑fix scan artefacts (for comparison) |
| `.gitlab-ci.yml` | CI config – see stages above |

---

## 🛡️ Security notes for the lab

- **Pre‑commit gitleaks hook** now blocks commits that contain the hard‑coded keys. To keep developing use `git commit --no-verify`.
- The pipeline stays **green** because all gates are intentionally weakened (`allow_failure: true`, `--exit-code 0`).  
  To restore real enforcement, revert those lines and set `--exit-code 1` / `--fail-on high`.
- The runner uses `--docker-network-mode host` so job containers can reach `localhost:8080` and `localhost:5050`.
- All secrets in `app.py` and `.gitlab-ci.yml` are **synthetic** (made‑up values) – they are detected by Gitleaks but are harmless placeholders.

---

## 📬 Need help?

Open an issue or ask in the project’s Slack/Discussion forum. Happy hacking!