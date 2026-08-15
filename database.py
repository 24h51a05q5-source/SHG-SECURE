import sqlite3
import os
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), 'shg_secure.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def create_tables(conn):
    cursor = conn.cursor()
    
    # Drop existing tables
    tables = [
        'audit_logs', 'transaction_verifications', 'disputes', 'risk_alerts', 
        'expenses', 'loan_repayments', 'loans', 'payments', 'shg_members', 'users', 'shgs'
    ]
    for table in tables:
        cursor.execute(f"DROP TABLE IF EXISTS {table}")
        
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    # 1. SHGs Table
    cursor.execute("""
    CREATE TABLE shgs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        expected_monthly_contribution REAL NOT NULL DEFAULT 1000.0,
        created_at TEXT NOT NULL
    );
    """)
    
    # 2. Users Table
    cursor.execute("""
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('MEMBER', 'LEADER', 'REVIEWER', 'ADMIN')),
        full_name TEXT NOT NULL,
        shg_id INTEGER,
        dob TEXT NOT NULL DEFAULT '1990-05-15',
        gender TEXT NOT NULL DEFAULT 'Female',
        mobile TEXT NOT NULL DEFAULT '9876543210',
        email TEXT NOT NULL DEFAULT 'member@shgsecure.in',
        address TEXT NOT NULL DEFAULT 'H.No 1-23, Temple Street',
        village TEXT NOT NULL DEFAULT 'Gollapudi',
        mandal TEXT NOT NULL DEFAULT 'Vemuru',
        district TEXT NOT NULL DEFAULT 'Guntur',
        occupation TEXT NOT NULL DEFAULT 'Tailoring',
        profile_photo TEXT NOT NULL DEFAULT '👩‍🌾',
        FOREIGN KEY (shg_id) REFERENCES shgs(id) ON DELETE SET NULL
    );
    """)
    
    # 3. SHG Members Table
    cursor.execute("""
    CREATE TABLE shg_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        shg_id INTEGER NOT NULL,
        member_id_code TEXT UNIQUE NOT NULL,
        membership_date TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (shg_id) REFERENCES shgs(id) ON DELETE CASCADE
    );
    """)
    
    # 4. Payments Table
    cursor.execute("""
    CREATE TABLE payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shg_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_date TEXT,
        method TEXT CHECK(method IN ('UPI', 'QR', 'BANK_TRANSFER', 'CASH', 'PENDING')),
        txn_id TEXT UNIQUE,
        status TEXT NOT NULL CHECK(status IN ('PENDING', 'VERIFIED')),
        reconciled INTEGER NOT NULL DEFAULT 0,
        is_cash_deposit INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (shg_id) REFERENCES shgs(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)
    
    # 5. Loans Table
    cursor.execute("""
    CREATE TABLE loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shg_id INTEGER NOT NULL,
        bank_name TEXT NOT NULL,
        amount REAL NOT NULL,
        purpose TEXT NOT NULL,
        sanctioned_date TEXT NOT NULL,
        interest_rate REAL NOT NULL,
        amount_repaid REAL NOT NULL DEFAULT 0,
        outstanding_balance REAL NOT NULL,
        next_repayment_date TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('PENDING_VERIFICATION', 'UNDER_REVIEW', 'APPROVED', 'DISPUTED')),
        FOREIGN KEY (shg_id) REFERENCES shgs(id) ON DELETE CASCADE
    );
    """)
    
    # 6. Expenses Table
    cursor.execute("""
    CREATE TABLE expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shg_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        purpose TEXT NOT NULL,
        date TEXT NOT NULL,
        initiated_by INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('PENDING', 'VERIFIED')),
        FOREIGN KEY (shg_id) REFERENCES shgs(id) ON DELETE CASCADE,
        FOREIGN KEY (initiated_by) REFERENCES users(id) ON DELETE CASCADE
    );
    """)
    
    # 7. Disputes Table
    cursor.execute("""
    CREATE TABLE disputes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_type TEXT NOT NULL CHECK(transaction_type IN ('LOAN', 'EXPENSE', 'PAYMENT')),
        transaction_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('OPEN', 'RESOLVED')) DEFAULT 'OPEN',
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)
    
    # 8. Risk Alerts Table
    cursor.execute("""
    CREATE TABLE risk_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shg_id INTEGER NOT NULL,
        alert_type TEXT NOT NULL CHECK(alert_type IN ('MISMATCH', 'UNUSUAL_ACTIVITY', 'SHORTFALL', 'DEADLINE')),
        description TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'RESOLVED')) DEFAULT 'ACTIVE',
        created_at TEXT NOT NULL,
        FOREIGN KEY (shg_id) REFERENCES shgs(id) ON DELETE CASCADE
    );
    """)
    
    # 9. Audit Logs Table
    cursor.execute("""
    CREATE TABLE audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        user_id INTEGER,
        username TEXT NOT NULL,
        role TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    """)
    
    # 10. Transaction Verifications Table (for member voting on loans/withdrawals)
    cursor.execute("""
    CREATE TABLE transaction_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_type TEXT NOT NULL CHECK(transaction_type IN ('LOAN', 'EXPENSE')),
        transaction_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        response TEXT NOT NULL CHECK(response IN ('AWARE', 'UNAWARE', 'DISPUTED', 'PENDING')),
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)
    
    conn.commit()

def seed_base_data(conn):
    cursor = conn.cursor()
    
    # 1. Create SHG Group
    cursor.execute(
        "INSERT INTO shgs (name, expected_monthly_contribution, created_at) VALUES (?, ?, ?)",
        ("Mahila Jyothi SHG", 1000.0, "2025-01-15 10:00:00")
    )
    shg_id = cursor.lastrowid
    
    # 2. Create Users (10 Members + 1 Reviewer + 1 Admin)
    # Sujatha is Leader, Lakshmi is Member, Reviewer, Admin
    users_data = [
        ('lakshmi', '1234', 'MEMBER', 'Lakshmi Devi', shg_id),
        ('anitha', '1234', 'MEMBER', 'Anitha Kurma', shg_id),
        ('sujatha', '1234', 'LEADER', 'Sujatha Rao', shg_id),
        ('radha', '1234', 'MEMBER', 'Radha Murthy', shg_id),
        ('kavitha', '1234', 'MEMBER', 'Kavitha Reddy', shg_id),
        ('maya', '1234', 'MEMBER', 'Maya Sharma', shg_id),
        ('saroja', '1234', 'MEMBER', 'Saroja Naidu', shg_id),
        ('latha', '1234', 'MEMBER', 'Latha Mangal', shg_id),
        ('geetha', '1234', 'MEMBER', 'Geetha K.', shg_id),
        ('shanti', '1234', 'MEMBER', 'Shanti Priya', shg_id),
        ('reviewer', '1234', 'REVIEWER', 'Authorized Review Officer', None),
        ('admin', '1234', 'ADMIN', 'System Administrator', None)
    ]
    
    user_ids = {}
    for username, pwd, role, name, shg in users_data:
        cursor.execute(
            "INSERT INTO users (username, password, role, full_name, shg_id) VALUES (?, ?, ?, ?, ?)",
            (username, pwd, role, name, shg)
        )
        user_ids[username] = cursor.lastrowid
        
    # 3. Create SHG Member relationships
    member_usernames = ['lakshmi', 'anitha', 'sujatha', 'radha', 'kavitha', 'maya', 'saroja', 'latha', 'geetha', 'shanti']
    for i, uname in enumerate(member_usernames):
        m_code = f"SHG001-M{i+1:02d}"
        cursor.execute(
            "INSERT INTO shg_members (user_id, shg_id, member_id_code, membership_date) VALUES (?, ?, ?, ?)",
            (user_ids[uname], shg_id, m_code, "2025-01-15 10:30:00")
        )
        
    # 4. Standard Expenses history (Normal ones)
    expenses = [
        (shg_id, 10000.0, "Purchase of organic seeds", "2026-05-10 11:00:00", user_ids['sujatha'], "VERIFIED"),
        (shg_id, 15000.0, "Sewing machines repair", "2026-06-12 14:30:00", user_ids['sujatha'], "VERIFIED"),
        (shg_id, 12000.0, "SHG group meeting venue and logistics", "2026-07-02 09:15:00", user_ids['sujatha'], "VERIFIED"),
        (shg_id, 18000.0, "Raw materials for handicraft training", "2026-07-20 16:45:00", user_ids['sujatha'], "VERIFIED"),
    ]
    for shg, amt, purp, dt, init, stat in expenses:
        cursor.execute(
            "INSERT INTO expenses (shg_id, amount, purpose, date, initiated_by, status) VALUES (?, ?, ?, ?, ?, ?)",
            (shg, amt, purp, dt, init, stat)
        )
        
    # Update some realistic user profile fields
    cursor.execute("UPDATE users SET email = 'lakshmi@shgsecure.in', mobile = '9848022338', occupation = 'Tailoring & Embroidery', dob = '1988-08-14', profile_photo = '👩‍🌾' WHERE username = 'lakshmi'")
    cursor.execute("UPDATE users SET email = 'sujatha.rao@shgsecure.in', mobile = '9490123456', occupation = 'Dairy Farming', dob = '1982-04-10', profile_photo = '👩' WHERE username = 'sujatha'")
    cursor.execute("UPDATE users SET email = 'anitha@shgsecure.in', mobile = '9177283940', occupation = 'Agriculture', dob = '1991-11-20', profile_photo = '👩‍🍳' WHERE username = 'anitha'")

    conn.commit()
    return shg_id, user_ids

def init_db(scenario='B'):
    conn = get_db_connection()
    create_tables(conn)
    shg_id, user_ids = seed_base_data(conn)
    cursor = conn.cursor()
    
    current_time = "2026-08-08 18:00:00"
    
    # 1. Base Loan (existing, sanctioned in Jan 2026)
    default_repayment_date = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
    cursor.execute("""
        INSERT INTO loans (shg_id, bank_name, amount, purpose, sanctioned_date, interest_rate, amount_repaid, outstanding_balance, next_repayment_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (shg_id, "State Bank of India", 300000.0, "Dairy Farming Setup", "2026-01-10 11:30:00", 7.5, 90000.0, 210000.0, default_repayment_date, "APPROVED"))
    base_loan_id = cursor.lastrowid
    
    # Write initial audit logs for base data
    cursor.execute("INSERT INTO audit_logs (timestamp, user_id, username, role, action, details) VALUES (?, ?, ?, ?, ?, ?)",
                   ("2026-01-10 12:00:00", user_ids['sujatha'], 'sujatha', 'LEADER', 'Approved Loan Setup', 'Group sanctioned ₹3,00,000 loan from SBI for Dairy setup.'))

    if scenario == 'A':
        # --- SCENARIO A: NORMAL PAYMENT (10/10 Paid) ---
        members = ['lakshmi', 'anitha', 'sujatha', 'radha', 'kavitha', 'maya', 'saroja', 'latha', 'geetha', 'shanti']
        for i, uname in enumerate(members):
            txn_id = f"TXN-SHG-2026-{i+1:04d}"
            cursor.execute("""
                INSERT INTO payments (shg_id, user_id, amount, payment_date, method, txn_id, status, reconciled)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (shg_id, user_ids[uname], 1000.0, "2026-08-07 10:00:00", "UPI", txn_id, "VERIFIED", 1))
            
            # Logs
            cursor.execute("INSERT INTO audit_logs (timestamp, user_id, username, role, action, details) VALUES (?, ?, ?, ?, ?, ?)",
                           ("2026-08-07 10:05:00", user_ids[uname], uname, 'MEMBER' if uname != 'sujatha' else 'LEADER', 'Payment Verified', f'Contribution of ₹1,000 verified. Txn: {txn_id}'))

        # Set up Loan Verifications for the active loan (All Aware)
        for uname in members:
            cursor.execute("""
                INSERT INTO transaction_verifications (transaction_type, transaction_id, user_id, response, updated_at)
                VALUES (?, ?, ?, ?, ?)
            """, ('LOAN', base_loan_id, user_ids[uname], 'AWARE', "2026-01-12 10:00:00"))

    elif scenario == 'B':
        # --- SCENARIO B: 8 OF 10 MEMBERS PAID (2 pending: lakshmi & shanti) ---
        paid_members = ['anitha', 'sujatha', 'radha', 'kavitha', 'maya', 'saroja', 'latha', 'geetha']
        pending_members = ['lakshmi', 'shanti']
        
        # Seed paid
        for i, uname in enumerate(paid_members):
            txn_id = f"TXN-SHG-2026-{i+2:04d}"
            cursor.execute("""
                INSERT INTO payments (shg_id, user_id, amount, payment_date, method, txn_id, status, reconciled)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (shg_id, user_ids[uname], 1000.0, "2026-08-07 10:00:00", "QR", txn_id, "VERIFIED", 1))
        
        # Seed pending
        for uname in pending_members:
            cursor.execute("""
                INSERT INTO payments (shg_id, user_id, amount, payment_date, method, txn_id, status, reconciled)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (shg_id, user_ids[uname], 1000.0, None, 'PENDING', None, "PENDING", 0))
            
        # Add risk alert for shortfall
        cursor.execute("""
            INSERT INTO risk_alerts (shg_id, alert_type, description, status, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (shg_id, 'SHORTFALL', "SHG group repayment is ₹2,000 short. 8 of 10 members paid. Deadline approaching in 7 days.", 'ACTIVE', current_time))
        
        # Set up Loan Verifications for the active loan (All Aware)
        for uname in paid_members + pending_members:
            cursor.execute("""
                INSERT INTO transaction_verifications (transaction_type, transaction_id, user_id, response, updated_at)
                VALUES (?, ?, ?, ?, ?)
            """, ('LOAN', base_loan_id, user_ids[uname], 'AWARE', "2026-01-12 10:00:00"))

    elif scenario == 'C':
        # --- SCENARIO C: LEADER/CASH COLLECTION RISK (Mismatch) ---
        paid_members = ['lakshmi', 'anitha', 'sujatha', 'radha', 'kavitha', 'maya', 'saroja', 'latha']
        for i, uname in enumerate(paid_members):
            txn_id = f"TXN-SHG-2026-{i+1:04d}"
            cursor.execute("""
                INSERT INTO payments (shg_id, user_id, amount, payment_date, method, txn_id, status, reconciled)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (shg_id, user_ids[uname], 1000.0, "2026-08-06 09:30:00", "UPI", txn_id, "VERIFIED", 1))
            
        cash_members = ['geetha', 'shanti']
        for i, uname in enumerate(cash_members):
            txn_id = f"TXN-CASH-{i+9:04d}"
            cursor.execute("""
                INSERT INTO payments (shg_id, user_id, amount, payment_date, method, txn_id, status, reconciled, is_cash_deposit)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (shg_id, user_ids[uname], 1000.0, "2026-08-07 14:00:00", "CASH", txn_id, "VERIFIED", 0, 1))
            
            cursor.execute("INSERT INTO audit_logs (timestamp, user_id, username, role, action, details) VALUES (?, ?, ?, ?, ?, ?)",
                           ("2026-08-07 14:15:00", user_ids['sujatha'], 'sujatha', 'LEADER', 'Recorded Cash Payment', f'Leader recorded Cash collection for {uname}. Txn: {txn_id}'))

        # Add Reconciliation Risk Alert
        cursor.execute("""
            INSERT INTO risk_alerts (shg_id, alert_type, description, status, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (shg_id, 'MISMATCH', "FINANCIAL MISMATCH: Expected bank deposit ₹10,000. Verified digital receipts = ₹8,000. Cash recorded = ₹2,000. Actual Bank Received = ₹8,000. Unresolved cash discrepancy.", 'ACTIVE', current_time))
        
        # Loan Verifications (All Aware)
        for uname in paid_members + cash_members:
            cursor.execute("""
                INSERT INTO transaction_verifications (transaction_type, transaction_id, user_id, response, updated_at)
                VALUES (?, ?, ?, ?, ?)
            """, ('LOAN', base_loan_id, user_ids[uname], 'AWARE', "2026-01-12 10:00:00"))

    elif scenario == 'D':
        # --- SCENARIO D: UNAUTHORIZED LOAN ---
        paid_members = ['lakshmi', 'anitha', 'sujatha', 'radha', 'kavitha', 'maya', 'saroja', 'latha']
        pending_members = ['geetha', 'shanti']
        
        for i, uname in enumerate(paid_members):
            txn_id = f"TXN-SHG-2026-{i+1:04d}"
            cursor.execute("""
                INSERT INTO payments (shg_id, user_id, amount, payment_date, method, txn_id, status, reconciled)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (shg_id, user_ids[uname], 1000.0, "2026-08-07 10:00:00", "UPI", txn_id, "VERIFIED", 1))
        
        for uname in pending_members:
            cursor.execute("""
                INSERT INTO payments (shg_id, user_id, amount, payment_date, method, txn_id, status, reconciled)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (shg_id, user_ids[uname], 1000.0, None, 'PENDING', None, "PENDING", 0))

        cursor.execute("""
            INSERT INTO loans (shg_id, bank_name, amount, purpose, sanctioned_date, interest_rate, amount_repaid, outstanding_balance, next_repayment_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (shg_id, "Andhra Bank", 300000.0, "Dairy Business Expansion (Phase 2)", "2026-08-08 10:00:00", 8.0, 0.0, 300000.0, "2026-09-15", "PENDING_VERIFICATION"))
        unauth_loan_id = cursor.lastrowid
        
        cursor.execute("INSERT INTO audit_logs (timestamp, user_id, username, role, action, details) VALUES (?, ?, ?, ?, ?, ?)",
                       ("2026-08-08 10:05:00", user_ids['sujatha'], 'sujatha', 'LEADER', 'Initiated Loan Verification', f'Leader uploaded new loan agreement. Sanctioned: ₹3,00,000. Loan ID: {unauth_loan_id}'))

        aware_members = ['lakshmi', 'sujatha', 'anitha', 'saroja', 'latha', 'geetha']
        unaware_members = ['radha', 'kavitha', 'maya']
        pending_vote_members = ['shanti']
        
        for uname in aware_members:
            cursor.execute("""
                INSERT INTO transaction_verifications (transaction_type, transaction_id, user_id, response, updated_at)
                VALUES (?, ?, ?, ?, ?)
            """, ('LOAN', unauth_loan_id, user_ids[uname], 'AWARE', "2026-08-08 12:00:00"))
            
        for uname in unaware_members:
            cursor.execute("""
                INSERT INTO transaction_verifications (transaction_type, transaction_id, user_id, response, updated_at)
                VALUES (?, ?, ?, ?, ?)
            """, ('LOAN', unauth_loan_id, user_ids[uname], 'UNAWARE', "2026-08-08 13:00:00"))
            
        for uname in pending_vote_members:
            cursor.execute("""
                INSERT INTO transaction_verifications (transaction_type, transaction_id, user_id, response, updated_at)
                VALUES (?, ?, ?, ?, ?)
            """, ('LOAN', unauth_loan_id, user_ids[uname], 'PENDING', "2026-08-08 10:00:00"))
            
        cursor.execute("""
            INSERT INTO disputes (transaction_type, transaction_id, user_id, reason, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, ('LOAN', unauth_loan_id, user_ids['radha'], "I was not informed about this loan application. We did not discuss this in our weekly meeting, and our group signature was submitted without full consent.", 'OPEN', "2026-08-08 13:10:00"))
        dispute_id = cursor.lastrowid
        
        cursor.execute("INSERT INTO audit_logs (timestamp, user_id, username, role, action, details) VALUES (?, ?, ?, ?, ?, ?)",
                       ("2026-08-08 13:10:00", user_ids['radha'], 'radha', 'MEMBER', 'Raised Dispute', f'Disputed Loan ID: {unauth_loan_id}. Reason: Not discussed in meeting. Dispute ID: DISP-{dispute_id:04d}'))

        cursor.execute("UPDATE loans SET status = 'UNDER_REVIEW' WHERE id = ?", (unauth_loan_id,))
        
        cursor.execute("""
            INSERT INTO risk_alerts (shg_id, alert_type, description, status, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (shg_id, 'UNUSUAL_ACTIVITY', "MEMBER VERIFICATION ALERT: 3 members (Radha, Kavitha, Maya) reported they were UNAWARE of the new ₹3,00,000 loan. 1 open dispute raised.", 'ACTIVE', current_time))

    elif scenario == 'E':
        # --- SCENARIO E: UNUSUAL WITHDRAWAL (Expense Anomaly) ---
        paid_members = ['lakshmi', 'anitha', 'sujatha', 'radha', 'kavitha', 'maya', 'saroja', 'latha']
        for i, uname in enumerate(paid_members):
            txn_id = f"TXN-SHG-2026-{i+1:04d}"
            cursor.execute("""
                INSERT INTO payments (shg_id, user_id, amount, payment_date, method, txn_id, status, reconciled)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (shg_id, user_ids[uname], 1000.0, "2026-08-07 10:00:00", "UPI", txn_id, "VERIFIED", 1))
            
        cursor.execute("""
            INSERT INTO payments (shg_id, user_id, amount, payment_date, method, txn_id, status, reconciled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (shg_id, user_ids['geetha'], 1000.0, None, 'PENDING', None, "PENDING", 0))
        cursor.execute("""
            INSERT INTO payments (shg_id, user_id, amount, payment_date, method, txn_id, status, reconciled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (shg_id, user_ids['shanti'], 1000.0, None, 'PENDING', None, "PENDING", 0))

        cursor.execute("""
            INSERT INTO expenses (shg_id, amount, purpose, date, initiated_by, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (shg_id, 150000.0, "Bulk purchase of dairy feed and packaging equipment", "2026-08-08 14:00:00", user_ids['sujatha'], "PENDING"))
        expense_id = cursor.lastrowid
        
        cursor.execute("INSERT INTO audit_logs (timestamp, user_id, username, role, action, details) VALUES (?, ?, ?, ?, ?, ?)",
                       ("2026-08-08 14:05:00", user_ids['sujatha'], 'sujatha', 'LEADER', 'Created Expense Record', f'Recorded expense of ₹1,50,000. Pending verification. Expense ID: {expense_id}'))

        all_members = ['lakshmi', 'anitha', 'sujatha', 'radha', 'kavitha', 'maya', 'saroja', 'latha', 'geetha', 'shanti']
        for uname in all_members:
            resp = 'PENDING'
            if uname == 'sujatha': resp = 'AWARE'
            if uname == 'lakshmi': resp = 'UNAWARE'
            cursor.execute("""
                INSERT INTO transaction_verifications (transaction_type, transaction_id, user_id, response, updated_at)
                VALUES (?, ?, ?, ?, ?)
            """, ('EXPENSE', expense_id, user_ids[uname], resp, "2026-08-08 14:10:00"))

        cursor.execute("""
            INSERT INTO risk_alerts (shg_id, alert_type, description, status, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (shg_id, 'UNUSUAL_ACTIVITY', "HIGH-RISK TRANSACTION: Expense amount (₹1,50,000) is 1,090% higher than recent SHG expense average (₹13,750). Triggered member review.", 'ACTIVE', current_time))

    conn.commit()
    conn.close()
    print(f"Database initialized and seeded for Scenario {scenario}.")

if __name__ == '__main__':
    init_db('A')
