from flask import Flask, request, jsonify, render_template, session, redirect, url_for, make_response
from functools import wraps
import os
import sqlite3
import random
from datetime import datetime
from database import get_db_connection, init_db

app = Flask(__name__)
app.secret_key = 'shg_secure_secret_key_2026'

@app.before_request
def handle_options_preflight():
    if request.method == 'OPTIONS':
        response = make_response()
        origin = request.headers.get('Origin')
        if origin:
            response.headers['Access-Control-Allow-Origin'] = origin
        else:
            response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
        return response

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin')
    if origin:
        response.headers['Access-Control-Allow-Origin'] = origin
    else:
        response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    
    # Disable caching so browser back button after logout redirects to login
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('authenticated') or not session.get('user_id'):
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    return decorated_function

def ensure_db_initialized():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        conn.close()
        if user_count == 0:
            init_db('B')
    except Exception as e:
        print(f"[DB Init Error] {e}. Reinitializing database...")
        init_db('B')

ensure_db_initialized()

# In-memory / session state management
CURRENT_SCENARIO = 'B'

def get_current_scenario():
    global CURRENT_SCENARIO
    return session.get('scenario', CURRENT_SCENARIO)

def set_current_scenario(sc):
    global CURRENT_SCENARIO
    CURRENT_SCENARIO = sc
    session['scenario'] = sc

# --- AUDIT LOG HELPER ---

def log_audit(conn, user_id, username, role, action, details):
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO audit_logs (timestamp, user_id, username, role, action, details)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), user_id, username, role, action, details))

# --- AUTHENTICATION HELPER ---

def perform_authentication(identifier, pin):
    identifier = (identifier or '').strip()
    pin = (pin or '').strip()
    
    if not identifier:
        return False, None, "Please enter your Member ID or Username."
    if not pin:
        return False, None, "Please enter your PIN."
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.username, u.password, u.role, u.full_name, u.shg_id, m.member_id_code
        FROM users u
        LEFT JOIN shg_members m ON u.id = m.user_id
        WHERE LOWER(TRIM(m.member_id_code)) = LOWER(TRIM(?)) OR LOWER(TRIM(u.username)) = LOWER(TRIM(?))
    """, (identifier, identifier))
    row = cursor.fetchone()
    
    if row:
        user = dict(row)
        # Check password against database password or fallback demo PIN 1234
        if pin == user['password'] or pin == '1234':
            session['authenticated'] = True
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']
            session['member_id'] = user['member_id_code'] if user['member_id_code'] else user['username']
            session['group_id'] = f"SHG{user['shg_id']:03d}" if user['shg_id'] else "SYSTEM"
            
            log_audit(conn, user['id'], user['username'], user['role'], 'Login', f"User {user['full_name']} authenticated successfully.")
            conn.commit()
            conn.close()
            print(f"[LOGIN SUCCESS] {user['full_name']} ({user['username']}) authenticated")
            return True, user, None
            
    conn.close()
    print(f"[LOGIN FAILED] Invalid credentials for identifier='{identifier}'")
    return False, None, "Invalid Member ID or PIN."

# --- APPLICATION ROUTES ---

@app.route('/')
@app.route('/login', methods=['GET', 'POST'])
def login_page():
    if request.method == 'GET':
        if session.get('authenticated') and session.get('user_id'):
            return redirect(url_for('dashboard_route'))
        return render_template('login.html', error=None)

    # POST handling
    if request.is_json:
        data = request.json or {}
    else:
        data = request.form or {}
        
    identifier = data.get('member_id', '') or data.get('username', '')
    pin = data.get('pin', '') or data.get('password', '')
    
    success, user, error_msg = perform_authentication(identifier, pin)
    
    if success:
        if request.is_json:
            return jsonify({"success": True, "redirect": "/dashboard", "user": user})
        return redirect(url_for('dashboard_route'))
        
    if request.is_json:
        return jsonify({"success": False, "error": error_msg}), 401
    return render_template('login.html', error=error_msg)

@app.route('/dashboard')
@login_required
def dashboard_route():
    return render_template('index.html')

@app.route('/profile')
@app.route('/my-profile')
@login_required
def profile_route():
    return render_template('index.html')

@app.route('/shg')
@app.route('/my-shg')
@login_required
def shg_route():
    return render_template('index.html')

@app.route('/group-chat')
@login_required
def group_chat_route():
    return render_template('index.html')

@app.route('/finances')
@app.route('/my-finances')
@login_required
def finances_route():
    return render_template('index.html')

@app.route('/transactions')
@app.route('/my-transactions')
@login_required
def transactions_route():
    return render_template('index.html')

@app.route('/security')
@app.route('/my-security')
@login_required
def security_route():
    return render_template('index.html')

@app.route('/alerts')
@app.route('/my-alerts')
@login_required
def alerts_route():
    return render_template('index.html')

@app.route('/report-concern')
@login_required
def report_concern_route():
    return render_template('index.html')

@app.route('/settings')
@login_required
def settings_route():
    return render_template('index.html')

@app.route('/logout')
def handle_portal_logout():
    username = session.get('username')
    role = session.get('role')
    if username:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        if row:
            log_audit(conn, row['id'], username, role, 'Logout', "User logged out of the portal.")
            conn.commit()
        conn.close()
    session.clear()
    return redirect(url_for('login_page'))

@app.route('/api/status', methods=['GET'])
def get_status():
    if not session.get('authenticated') or not session.get('user_id'):
        return jsonify({"error": "Unauthorized. Please log in.", "authenticated": False, "user": None}), 401

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Get Logged in User
    user = None
    if 'username' in session:
        cursor.execute("SELECT id, username, role, full_name, shg_id FROM users WHERE username = ?", (session['username'],))
        row = cursor.fetchone()
        if row:
            user = dict(row)
            
    # 2. Get active scenario
    scenario = get_current_scenario()
    
    # 3. Get SHG info
    cursor.execute("SELECT * FROM shgs LIMIT 1")
    shg_row = cursor.fetchone()
    shg = dict(shg_row) if shg_row else None
    
    if not shg:
        conn.close()
        return jsonify({"error": "No SHG found in database"}), 500
        
    shg_id = shg['id']
    
    # 4. Get all members and their payment status
    cursor.execute("""
        SELECT u.id, u.username, u.full_name, p.amount, p.payment_date, p.method, p.txn_id, p.status, p.is_cash_deposit
        FROM users u
        JOIN shg_members m ON u.id = m.user_id
        LEFT JOIN payments p ON u.id = p.user_id AND p.shg_id = ?
        WHERE u.shg_id = ? AND u.role IN ('MEMBER', 'LEADER')
        ORDER BY u.id ASC
    """, (shg_id, shg_id))
    members = [dict(r) for r in cursor.fetchall()]
    
    # Calculate statistics
    total_members = len(members)
    paid_members = sum(1 for m in members if m['status'] == 'VERIFIED')
    pending_members = total_members - paid_members
    
    expected_collection = total_members * shg['expected_monthly_contribution']
    
    # Verified digital payments (UPI, QR, Bank Transfer)
    cursor.execute("""
        SELECT SUM(amount) FROM payments 
        WHERE shg_id = ? AND status = 'VERIFIED' AND is_cash_deposit = 0
    """, (shg_id,))
    digital_sum = cursor.fetchone()[0] or 0.0
    
    # Cash collected but not necessarily deposited
    cursor.execute("""
        SELECT SUM(amount) FROM payments 
        WHERE shg_id = ? AND status = 'VERIFIED' AND is_cash_deposit = 1
    """, (shg_id,))
    cash_sum = cursor.fetchone()[0] or 0.0
    
    # Bank Received (Simulated bank statement)
    # Under Scenario C: 8 paid digitally (₹8,000), 2 paid cash (₹2,000) to leader, but bank has received only ₹8,000
    # In Scenario A: 10 paid digitally, bank received ₹10,000.
    # In Scenario B: 8 paid digitally, bank received ₹8,000.
    # In general, Bank Received = Digital Payments.
    bank_received = digital_sum
    
    # Ledger balance (what's recorded in the platform: verified digital + cash)
    ledger_balance = digital_sum + cash_sum
    
    # Reconciliation Engine
    mismatch = False
    mismatch_amount = 0.0
    
    if scenario == 'C':
        # Mismatch: Cash recorded by leader is ₹2,000, bank received is ₹8,000, ledger balance is ₹10,000.
        # So ledger_balance (10,000) != bank_received (8,000)
        mismatch = True
        mismatch_amount = ledger_balance - bank_received
    else:
        # In other scenarios, if cash was deposited or no cash payments, they match
        mismatch_amount = abs(ledger_balance - bank_received)
        mismatch = mismatch_amount > 0.01

    # 5. Get loans
    cursor.execute("SELECT * FROM loans WHERE shg_id = ?", (shg_id,))
    loans = []
    for l_row in cursor.fetchall():
        loan = dict(l_row)
        # Get verifications for this loan
        cursor.execute("""
            SELECT tv.response, u.full_name, u.username 
            FROM transaction_verifications tv
            JOIN users u ON tv.user_id = u.id
            WHERE tv.transaction_type = 'LOAN' AND tv.transaction_id = ?
        """, (loan['id'],))
        verifications = [dict(v) for v in cursor.fetchall()]
        
        aware_count = sum(1 for v in verifications if v['response'] == 'AWARE')
        unaware_count = sum(1 for v in verifications if v['response'] == 'UNAWARE')
        pending_count = sum(1 for v in verifications if v['response'] == 'PENDING')
        
        loan['verifications'] = verifications
        loan['aware_count'] = aware_count
        loan['unaware_count'] = unaware_count
        loan['pending_count'] = pending_count
        loans.append(loan)

    # 6. Get expenses
    cursor.execute("SELECT e.*, u.full_name as initiator_name FROM expenses e JOIN users u ON e.initiated_by = u.id WHERE e.shg_id = ?", (shg_id,))
    expenses = []
    for e_row in cursor.fetchall():
        exp = dict(e_row)
        cursor.execute("""
            SELECT tv.response, u.full_name, u.username 
            FROM transaction_verifications tv
            JOIN users u ON tv.user_id = u.id
            WHERE tv.transaction_type = 'EXPENSE' AND tv.transaction_id = ?
        """, (exp['id'],))
        verifications = [dict(v) for v in cursor.fetchall()]
        
        aware_count = sum(1 for v in verifications if v['response'] == 'AWARE')
        unaware_count = sum(1 for v in verifications if v['response'] == 'UNAWARE')
        pending_count = sum(1 for v in verifications if v['response'] == 'PENDING')
        
        exp['verifications'] = verifications
        exp['aware_count'] = aware_count
        exp['unaware_count'] = unaware_count
        exp['pending_count'] = pending_count
        expenses.append(exp)

    # 7. Get active disputes
    cursor.execute("""
        SELECT d.*, u.full_name, u.username 
        FROM disputes d
        JOIN users u ON d.user_id = u.id
        ORDER BY d.id DESC
    """)
    disputes = [dict(r) for r in cursor.fetchall()]

    # 8. Get active risk alerts
    cursor.execute("SELECT * FROM risk_alerts WHERE shg_id = ? AND status = 'ACTIVE'", (shg_id,))
    alerts = [dict(r) for r in cursor.fetchall()]

    # 9. Get audit logs (last 50 logs)
    cursor.execute("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 50")
    audit_logs = [dict(r) for r in cursor.fetchall()]

    # Calculate overall risk score
    # Formula based on days to deadline, shortfall, unverified loans/expenses, and mismatches
    on_time_rate = 100.0
    if total_members > 0:
        on_time_rate = (paid_members / total_members) * 100.0
        
    days_to_deadline = 7
    if loans:
        # SBI loan next repayment date is index 0
        sbi_loan = next((l for l in loans if l['bank_name'] == 'State Bank of India'), None)
        if sbi_loan:
            deadline_str = sbi_loan['next_repayment_date']
            try:
                deadline_dt = datetime.strptime(deadline_str, "%Y-%m-%d")
                days_to_deadline = (deadline_dt - datetime.now()).days + 1
            except:
                pass
                
    shortfall = expected_collection - (paid_members * shg['expected_monthly_contribution'])
    if shortfall < 0: shortfall = 0.0

    # Decision-support Risk Score Calculation
    risk_score = 15 # baseline low risk
    risk_reasons = []
    
    if shortfall > 0:
        risk_score += 25
        risk_reasons.append(f"Payment Shortfall of ₹{shortfall:,.0f}")
        if days_to_deadline <= 3:
            risk_score += 30
            risk_reasons.append(f"Critical Bank Repayment Deadline (Only {days_to_deadline} days left)")
        elif days_to_deadline <= 7:
            risk_score += 15
            risk_reasons.append(f"Approaching Bank Repayment Deadline ({days_to_deadline} days left)")
            
    if mismatch:
        risk_score += 25
        risk_reasons.append("Active Bank Reconciliation Mismatch")
        
    unverified_transactions = sum(1 for l in loans if l['status'] in ('PENDING_VERIFICATION', 'UNDER_REVIEW')) + \
                             sum(1 for e in expenses if e['status'] == 'PENDING')
    if unverified_transactions > 0:
        risk_score += 20
        risk_reasons.append(f"{unverified_transactions} transactions require member verification")

    active_disputes = sum(1 for d in disputes if d['status'] == 'OPEN')
    if active_disputes > 0:
        risk_score += 15
        risk_reasons.append(f"{active_disputes} open member disputes")

    if risk_score > 100: risk_score = 100
    
    risk_level = 'LOW'
    if risk_score >= 70:
        risk_level = 'HIGH'
    elif risk_score >= 40:
        risk_level = 'MEDIUM'

    conn.close()
    
    # Return full data structure
    return jsonify({
        "user": user,
        "currentUser": user,
        "scenario": scenario,
        "shg": shg,
        "members": members,
        "loans": loans,
        "expenses": expenses,
        "disputes": disputes,
        "alerts": alerts,
        "auditLogs": audit_logs,
        "reconciliation": {
            "expected": expected_collection,
            "digital": digital_sum,
            "cash": cash_sum,
            "bankReceived": bank_received,
            "ledgerBalance": ledger_balance,
            "mismatch": mismatch,
            "mismatchAmount": mismatch_amount
        },
        "riskScore": {
            "score": risk_score,
            "level": risk_level,
            "reasons": risk_reasons,
            "daysRemaining": max(0, days_to_deadline),
            "onTimeRate": on_time_rate,
            "shortfall": shortfall
        }
    })

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    identifier = data.get('member_id', '') or data.get('username', '')
    pin = data.get('pin', '') or data.get('password', '') or '1234'
    
    success, user, error_msg = perform_authentication(identifier, pin)
    
    if success:
        return jsonify({"success": True, "user": {
            "id": user['id'],
            "username": user['username'],
            "role": user['role'],
            "full_name": user['full_name'],
            "shg_id": user['shg_id']
        }})
        
    return jsonify({"success": False, "error": error_msg}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    username = session.get('username')
    role = session.get('role')
    
    if username:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        if row:
            log_audit(conn, row['id'], username, role, 'Logout', "User logged out of the portal.")
            conn.commit()
        conn.close()
        
    session.clear()
    return jsonify({"success": True})

@app.route('/api/pay', methods=['POST'])
def pay_contribution():
    if 'username' not in session:
        session['username'] = 'lakshmi'
        session['authenticated'] = True
        session['user_id'] = 1
        session['role'] = 'MEMBER'
        session['member_id'] = 'SHG001-M01'
        session['group_id'] = 'SHG001'
        
    data = request.json or {}
    method = data.get('method', 'UPI')
    amount = float(data.get('amount', 1000.0))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get user details
    cursor.execute("SELECT id, username, role, full_name, shg_id FROM users WHERE username = ?", (session['username'],))
    user_row = cursor.fetchone()
    if not user_row:
        cursor.execute("SELECT id, username, role, full_name, shg_id FROM users WHERE username = 'lakshmi'")
        user_row = cursor.fetchone()
        
    user = dict(user_row)
    shg_id = user['shg_id']
    
    # Check if a payment record already exists for this member
    cursor.execute("SELECT id, status, amount, payment_date, txn_id FROM payments WHERE shg_id = ? AND user_id = ?", (shg_id, user['id']))
    existing_pay = cursor.fetchone()
    
    if existing_pay and existing_pay['status'] == 'VERIFIED':
        conn.close()
        return jsonify({
            "success": True,
            "already_paid": True,
            "receipt": {
                "shgName": "Mahila Jyothi SHG",
                "memberName": user['full_name'],
                "amount": existing_pay['amount'] or amount,
                "purpose": "Monthly Contribution",
                "date": existing_pay['payment_date'] or datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "txnId": existing_pay['txn_id'] or "TXN-SHG-2026-0001",
                "status": "VERIFIED",
                "message": "Payment already completed and recorded in SHG financial ledger."
            }
        })
    
    # Generate unique txn ID
    txn_num = random.randint(1000, 9999)
    txn_id = f"TXN-SHG-2026-{txn_num}"
    payment_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if existing_pay:
        # Update PENDING to VERIFIED
        cursor.execute("""
            UPDATE payments 
            SET amount = ?, payment_date = ?, method = ?, txn_id = ?, status = 'VERIFIED', reconciled = 1, is_cash_deposit = 0
            WHERE id = ?
        """, (amount, payment_time, method, txn_id, existing_pay['id']))
    else:
        # Create verified digital payment record
        cursor.execute("""
            INSERT INTO payments (shg_id, user_id, amount, payment_date, method, txn_id, status, reconciled, is_cash_deposit)
            VALUES (?, ?, ?, ?, ?, ?, 'VERIFIED', 1, 0)
        """, (shg_id, user['id'], amount, payment_time, method, txn_id))
        
    # Log Audit
    log_audit(conn, user['id'], user['username'], user['role'], 'Digital Payment', 
              f"Paid monthly contribution of ₹{amount:,.2f} digitally via {method}. Reference Txn: {txn_id}.")
              
    # Let's check if there's an active shortfall risk alert and resolve it dynamically if all paid!
    cursor.execute("SELECT COUNT(*) FROM users u JOIN shg_members m ON u.id = m.user_id WHERE u.shg_id = ?", (shg_id,))
    total_members_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM payments WHERE shg_id = ? AND status = 'VERIFIED'", (shg_id,))
    paid_members_count = cursor.fetchone()[0]
    
    if paid_members_count == total_members_count:
        # Resolve any active SHORTFALL risk alerts
        cursor.execute("UPDATE risk_alerts SET status = 'RESOLVED' WHERE shg_id = ? AND alert_type = 'SHORTFALL'", (shg_id,))
        log_audit(conn, None, 'SYSTEM', 'SYSTEM', 'Alert Resolved', "SHORTFALL risk alert resolved as 10/10 members paid contributions.")

    conn.commit()
    
    # Fetch the newly created/updated payment to return receipt data
    cursor.execute("SELECT * FROM payments WHERE txn_id = ?", (txn_id,))
    pay_record = dict(cursor.fetchone())
    
    conn.close()
    
    return jsonify({
        "success": True,
        "receipt": {
            "shgName": "Mahila Jyothi SHG",
            "memberName": user['full_name'],
            "amount": pay_record['amount'],
            "purpose": "Monthly Contribution",
            "date": pay_record['payment_date'],
            "txnId": pay_record['txn_id'],
            "status": pay_record['status'],
            "message": "Payment successfully recorded in SHG financial ledger."
        }
    })

@app.route('/api/verify-transaction', methods=['POST'])
def verify_transaction():
    if 'username' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.json or {}
    tx_type = data.get('transaction_type') # 'LOAN' or 'EXPENSE'
    tx_id = data.get('transaction_id')
    response = data.get('response') # 'AWARE', 'UNAWARE', 'DISPUTED'
    reason = data.get('reason', '').strip()
    
    if not tx_type or not tx_id or not response:
        return jsonify({"error": "Missing required parameters"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get user
    cursor.execute("SELECT id, username, role, full_name, shg_id FROM users WHERE username = ?", (session['username'],))
    user = dict(cursor.fetchone())
    
    # Check if verification record exists
    cursor.execute("""
        SELECT id FROM transaction_verifications 
        WHERE transaction_type = ? AND transaction_id = ? AND user_id = ?
    """, (tx_type, tx_id, user['id']))
    existing = cursor.fetchone()
    
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if existing:
        cursor.execute("""
            UPDATE transaction_verifications 
            SET response = ?, updated_at = ? 
            WHERE id = ?
        """, (response, now_str, existing['id']))
    else:
        cursor.execute("""
            INSERT INTO transaction_verifications (transaction_type, transaction_id, user_id, response, updated_at)
            VALUES (?, ?, ?, ?, ?)
        """, (tx_type, tx_id, user['id'], response, now_str))
        
    # Log Audit
    log_audit(conn, user['id'], user['username'], user['role'], 'Transaction Verification', 
              f"Verified {tx_type} ID: {tx_id} as {response}.")
              
    # If disputed or unaware, log dispute
    if response in ('UNAWARE', 'DISPUTED'):
        # Check if dispute already exists
        cursor.execute("""
            SELECT id FROM disputes 
            WHERE transaction_type = ? AND transaction_id = ? AND user_id = ?
        """, (tx_type, tx_id, user['id']))
        disp_row = cursor.fetchone()
        
        dispute_reason = reason if reason else f"Member marked transaction as {response} during verification."
        
        if not disp_row:
            cursor.execute("""
                INSERT INTO disputes (transaction_type, transaction_id, user_id, reason, status, created_at)
                VALUES (?, ?, ?, ?, 'OPEN', ?)
            """, (tx_type, tx_id, user['id'], dispute_reason, now_str))
            disp_id = cursor.lastrowid
            
            log_audit(conn, user['id'], user['username'], user['role'], 'Dispute Raised', 
                      f"Raised dispute on {tx_type} ID {tx_id}. Dispute ID: DISP-{disp_id:04d}.")
            
            # Put loan or expense status under review
            if tx_type == 'LOAN':
                cursor.execute("UPDATE loans SET status = 'UNDER_REVIEW' WHERE id = ?", (tx_id,))
            elif tx_type == 'EXPENSE':
                cursor.execute("UPDATE expenses SET status = 'PENDING' WHERE id = ?", (tx_id,))
                
    # Recalculate transaction awareness rate and update risk alerts if necessary
    cursor.execute("""
        SELECT COUNT(DISTINCT user_id) FROM shg_members WHERE shg_id = ?
    """, (user['shg_id'],))
    total_members = cursor.fetchone()[0]
    
    cursor.execute("""
        SELECT COUNT(*) FROM transaction_verifications 
        WHERE transaction_type = ? AND transaction_id = ? AND response = 'UNAWARE'
    """, (tx_type, tx_id))
    unaware_count = cursor.fetchone()[0]
    
    if unaware_count >= 3:
        # Check if alert exists
        cursor.execute("""
            SELECT id FROM risk_alerts 
            WHERE shg_id = ? AND alert_type = 'UNUSUAL_ACTIVITY' AND status = 'ACTIVE' 
            AND description LIKE ?
        """, (user['shg_id'], f"%{tx_type} ID: {tx_id}%"))
        
        if not cursor.fetchone():
            alert_desc = f"MEMBER VERIFICATION ALERT: {unaware_count}/{total_members} members reported they were UNAWARE of {tx_type} ID: {tx_id}. Verification required."
            cursor.execute("""
                INSERT INTO risk_alerts (shg_id, alert_type, description, status, created_at)
                VALUES (?, 'UNUSUAL_ACTIVITY', ?, 'ACTIVE', ?)
            """, (user['shg_id'], alert_desc, now_str))

    conn.commit()
    conn.close()
    return jsonify({"success": True, "response": response})

@app.route('/api/add-expense', methods=['POST'])
def add_expense():
    if 'username' not in session or session.get('role') != 'LEADER':
        return jsonify({"error": "Unauthorized. Leader credentials required."}), 403
        
    data = request.json or {}
    amount = float(data.get('amount', 0.0))
    purpose = data.get('purpose', '').strip()
    
    if amount <= 0 or not purpose:
        return jsonify({"error": "Valid amount and purpose are required."}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get user
    cursor.execute("SELECT id, username, role, shg_id FROM users WHERE username = ?", (session['username'],))
    user = dict(cursor.fetchone())
    shg_id = user['shg_id']
    
    # Set status. Expenses > ₹50,000 are PENDING and trigger anomaly flags
    status = 'VERIFIED'
    is_anomaly = False
    
    if amount > 50000.0:
        status = 'PENDING'
        is_anomaly = True
        
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    cursor.execute("""
        INSERT INTO expenses (shg_id, amount, purpose, date, initiated_by, status)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (shg_id, amount, purpose, now_str, user['id'], status))
    expense_id = cursor.lastrowid
    
    # Log Audit
    log_audit(conn, user['id'], user['username'], user['role'], 'Create Expense Record', 
              f"Logged new expense of ₹{amount:,.2f} for '{purpose}'. Status: {status}.")
              
    # Automatically add verification for initiator (Leader is Aware)
    cursor.execute("""
        INSERT INTO transaction_verifications (transaction_type, transaction_id, user_id, response, updated_at)
        VALUES ('EXPENSE', ?, ?, 'AWARE', ?)
    """, (expense_id, user['id'], now_str))
    
    # Seed verifications for other members as PENDING
    cursor.execute("SELECT user_id FROM shg_members WHERE shg_id = ? AND user_id != ?", (shg_id, user['id']))
    other_members = [r[0] for r in cursor.fetchall()]
    for om_id in other_members:
        cursor.execute("""
            INSERT INTO transaction_verifications (transaction_type, transaction_id, user_id, response, updated_at)
            VALUES ('EXPENSE', ?, ?, 'PENDING', ?)
        """, (expense_id, om_id, now_str))

    if is_anomaly:
        alert_desc = f"HIGH-RISK TRANSACTION: Expense ID: {expense_id} (₹{amount:,.0f} for '{purpose}') exceeds normal thresholds. Awaiting member verification."
        cursor.execute("""
            INSERT INTO risk_alerts (shg_id, alert_type, description, status, created_at)
            VALUES (?, 'UNUSUAL_ACTIVITY', ?, 'ACTIVE', ?)
        """, (shg_id, alert_desc, now_str))
        
        log_audit(conn, None, 'SYSTEM', 'SYSTEM', 'Anomaly Detected', 
                  f"Risk engine flagged Expense ID {expense_id} due to size (₹{amount:,.0f}).")

    conn.commit()
    conn.close()
    return jsonify({"success": True, "expense_id": expense_id, "status": status, "is_anomaly": is_anomaly})

@app.route('/api/dispute', methods=['POST'])
def raise_dispute():
    if 'username' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.json or {}
    tx_type = data.get('transaction_type')
    tx_id = data.get('transaction_id')
    reason = data.get('reason', '').strip()
    
    if not tx_type or not tx_id or not reason:
        return jsonify({"error": "Missing required details to log concern."}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get user
    cursor.execute("SELECT id, username, role, shg_id FROM users WHERE username = ?", (session['username'],))
    user = dict(cursor.fetchone())
    
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Record dispute
    cursor.execute("""
        INSERT INTO disputes (transaction_type, transaction_id, user_id, reason, status, created_at)
        VALUES (?, ?, ?, ?, 'OPEN', ?)
    """, (tx_type, tx_id, user['id'], reason, now_str))
    disp_id = cursor.lastrowid
    
    # Update transaction status
    if tx_type == 'LOAN':
        cursor.execute("UPDATE loans SET status = 'UNDER_REVIEW' WHERE id = ?", (tx_id,))
    elif tx_type == 'EXPENSE':
        cursor.execute("UPDATE expenses SET status = 'PENDING' WHERE id = ?", (tx_id,))
    elif tx_type == 'PAYMENT':
        cursor.execute("UPDATE payments SET status = 'PENDING', reconciled = 0 WHERE id = ?", (tx_id,))
        
    # Log member response as DISPUTED in verifications
    if tx_type in ('LOAN', 'EXPENSE'):
        cursor.execute("""
            INSERT OR REPLACE INTO transaction_verifications (transaction_type, transaction_id, user_id, response, updated_at)
            VALUES (?, ?, ?, 'DISPUTED', ?)
        """, (tx_type, tx_id, user['id'], now_str))

    # Log Audit
    log_audit(conn, user['id'], user['username'], user['role'], 'Raised Dispute', 
              f"Logged concern for {tx_type} ID: {tx_id}. Dispute ID: DISP-{disp_id:04d}. Reason: {reason}")
              
    # Add Risk Alert
    alert_desc = f"MEMBER DISPUTE: Member {user['full_name']} raised dispute DISP-{disp_id:04d} on {tx_type} ID: {tx_id}."
    cursor.execute("""
        INSERT INTO risk_alerts (shg_id, alert_type, description, status, created_at)
        VALUES (?, 'UNUSUAL_ACTIVITY', ?, 'ACTIVE', ?)
    """, (user['shg_id'], alert_desc, now_str))

    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True, 
        "dispute_id": f"DISP-{disp_id:04d}",
        "message": "Your concern has been recorded for authorized review."
    })

@app.route('/api/resolve-dispute', methods=['POST'])
def resolve_dispute():
    if 'username' not in session or session.get('role') != 'REVIEWER':
        return jsonify({"error": "Unauthorized. Reviewer credentials required."}), 403
        
    data = request.json or {}
    dispute_id = data.get('dispute_id')
    resolution = data.get('resolution') # 'APPROVED', 'CANCELLED', 'REJECTED'
    
    if not dispute_id or not resolution:
        return jsonify({"error": "Dispute ID and resolution action are required."}), 400
        
    # Extract integer ID from format DISP-XXXX
    try:
        db_disp_id = int(dispute_id.replace('DISP-', ''))
    except ValueError:
        return jsonify({"error": "Invalid dispute ID format"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get user
    cursor.execute("SELECT id, username, role FROM users WHERE username = ?", (session['username'],))
    user = dict(cursor.fetchone())
    
    # Fetch dispute details
    cursor.execute("SELECT * FROM disputes WHERE id = ?", (db_disp_id,))
    disp_row = cursor.fetchone()
    if not disp_row:
        conn.close()
        return jsonify({"error": "Dispute not found"}), 404
        
    dispute = dict(disp_row)
    tx_type = dispute['transaction_type']
    tx_id = dispute['transaction_id']
    
    # Update dispute status
    cursor.execute("UPDATE disputes SET status = 'RESOLVED' WHERE id = ?", (db_disp_id,))
    
    # Update actual transaction based on resolution
    if tx_type == 'LOAN':
        if resolution == 'APPROVED':
            cursor.execute("UPDATE loans SET status = 'APPROVED' WHERE id = ?", (tx_id,))
        elif resolution == 'CANCELLED':
            cursor.execute("UPDATE loans SET status = 'DISPUTED' WHERE id = ?", (tx_id,))
    elif tx_type == 'EXPENSE':
        if resolution == 'APPROVED':
            cursor.execute("UPDATE expenses SET status = 'VERIFIED' WHERE id = ?", (tx_id,))
        elif resolution == 'CANCELLED':
            cursor.execute("UPDATE expenses SET status = 'PENDING' WHERE id = ?", (tx_id,)) # remains blocked
            
    # Resolve related risk alerts
    cursor.execute("""
        UPDATE risk_alerts SET status = 'RESOLVED' 
        WHERE description LIKE ? AND status = 'ACTIVE'
    """, (f"%DISP-{db_disp_id:04d}%",))
    
    # Log Audit
    log_audit(conn, user['id'], user['username'], user['role'], 'Resolve Dispute', 
              f"Resolved Dispute ID DISP-{db_disp_id:04d} with decision: {resolution}.")
              
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": f"Dispute DISP-{db_disp_id:04d} resolved successfully."})

@app.route('/api/switch-scenario', methods=['POST'])
def switch_scenario():
    data = request.json or {}
    sc = data.get('scenario', 'A').upper()
    
    if sc not in ('A', 'B', 'C', 'D', 'E'):
        return jsonify({"error": "Invalid scenario name"}), 400
        
    # Reinitialize SQLite database with the selected scenario seeds
    init_db(sc)
    
    # Set the scenario in the session
    set_current_scenario(sc)
    
    conn = get_db_connection()
    # Log audit trail of scenario change
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE username = 'admin'")
    admin_id = cursor.fetchone()[0]
    log_audit(conn, admin_id, 'admin', 'ADMIN', 'Switch Scenario', f"Simulated database state switched to Scenario {sc}.")
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "scenario": sc})

@app.route('/api/reset', methods=['POST'])
def reset_demo():
    init_db('A')
    set_current_scenario('A')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE username = 'admin'")
    admin_id = cursor.fetchone()[0]
    log_audit(conn, admin_id, 'admin', 'ADMIN', 'Reset System', "Simulated database state reset to default Scenario A.")
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "scenario": 'A'})

if __name__ == '__main__':
    # Try running Flask. Default port is 5000.
    app.run(host='0.0.0.0', port=5000, debug=True)
