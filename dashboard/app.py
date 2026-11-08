import subprocess
import json
import os
from flask import Flask, render_template, request, jsonify, session, redirect, url_for

# Tool configurations - name, command, description
TOOLS = {
    'gitleaks': {
        'command': ['gitleaks', 'detect', '--source', '.', '--redact', '--report-format', 'json', '--report-path', '/tmp/gitleaks-report.json'],
        'description': 'Detect hardcoded secrets in the codebase'
    },
    'semgrep': {
        'command': ['semgrep', 'scan', '--config', 'auto', '--json', '--output', '/tmp/semgrep-report.json', 'app/'],
        'description': 'Static application security testing (SAST)'
    },
    'trivy-fs': {
        'command': ['trivy', 'fs', '--scanners', 'vuln', '--severity', 'HIGH,CRITICAL', '--exit-code', '0', '--format', 'json', '--output', '/tmp/trivy-fs-report.json', 'app/'],
        'description': 'Filesystem vulnerability scan'
    },
    'trivy-image': {
        'command': ['trivy', 'image', '--input', '/tmp/image.tar', '--severity', 'HIGH,CRITICAL', '--exit-code', '0', '--format', 'json', '--output', '/tmp/trivy-image-report.json'],
        'description': 'Container image vulnerability scan'
    },
    'grype': {
        'command': ['grype', 'docker-archive:/tmp/image.tar', '-o', 'json', '--file', '/tmp/grype-report.json', '--fail-on', 'high'],
        'description': 'Second vulnerability scanner'
    },
    'hadolint': {
        'command': ['hadolint', '--failure-threshold', 'warning', '--format', 'json', 'app/Dockerfile', 'security/hadolint/Dockerfile', 'security/syft/Dockerfile'],
        'description': 'Dockerfile linting'
    },
    'dockle': {
        'command': ['dockle', '/tmp/image.tar', '--exit-code', '1', '--exit-level', 'warn', '--format', 'json', '--output', '/tmp/dockle-report.json'],
        'description': 'Image best-practices scan'
    },
    'syft': {
        'command': ['syft', 'docker-archive:/tmp/image.tar', '-o', 'cyclonedx-json=/tmp/sbom-ci.json'],
        'description': 'SBOM generation'
    }
}

# Hardcoded credentials for demo purposes
VALID_USERNAME = 'admin'
VALID_PASSWORD = 'devsecops'

# Set a secret key for session management
app = Flask(__name__)
app.secret_key = 'devsecops_dashboard_2026'

@app.route('/', methods=['GET', 'POST'])
def login():
    if 'logged_in' in session:
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        username = request.form.get('username', '')
        password = request.form.get('password', '')
        if username == VALID_USERNAME and password == VALID_PASSWORD:
            session['logged_in'] = True
            return redirect(url_for('dashboard'))
        else:
            return render_template('login.html', error='Invalid credentials. Please try again.')
    
    return render_template('login.html', error=None)

@app.route('/dashboard')
def dashboard():
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    return render_template('index.html', tools=TOOLS)

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('login'))

@app.route('/run-analysis', methods=['POST'])
def run_analysis():
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized. Please login first.'}), 401
    
    data = request.json
    tool_name = data.get('tool')
    
    if tool_name not in TOOLS:
        return jsonify({'error': 'Unknown tool'}), 400
    
    tool = TOOLS[tool_name]
    
    try:
        result = subprocess.run(
            tool['command'],
            capture_output=True,
            text=True,
            timeout=120
        )
        
        output_data = None
        output_file = tool['command'][-1] if tool['command'] and tool['command'][-1].endswith('.json') else None
        if output_file:
            try:
                with open(output_file, 'r') as f:
                    output_data = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                output_data = {'output': 'Output file not found or invalid JSON'}
        
        output_summary = {
            'tool': tool_name,
            'returncode': result.returncode,
            'stdout': result.stdout[-500:] if result.stdout else '',
            'stderr': result.stderr[-500:] if result.stderr else '',
            'output_data': output_data
        }
        
        return jsonify({'success': True, 'data': output_summary})
        
    except subprocess.TimeoutExpired:
        return jsonify({'success': False, 'error': 'Analysis timed out after 120 seconds'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)