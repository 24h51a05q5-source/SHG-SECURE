// SHG-Secure Front-End Application Logic

// --- THEME MANAGEMENT SYSTEM (Light & Dark Mode) ---
function getTheme() {
    return localStorage.getItem('shg-theme') || document.documentElement.getAttribute('data-theme') || 'light';
}

function setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') theme = 'light';
    localStorage.setItem('shg-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (document.body) document.body.setAttribute('data-theme', theme);
    
    // Immediately update top-right header toggle button across all views
    renderHeader();
    
    // Immediately synchronize Settings theme buttons if on settings view
    const settingsLightBtn = document.getElementById('theme-btn-light');
    const settingsDarkBtn = document.getElementById('theme-btn-dark');
    const settingsBadge = document.getElementById('theme-active-badge');
    
    if (settingsLightBtn && settingsDarkBtn) {
        if (theme === 'light') {
            settingsLightBtn.className = 'theme-control-btn active-theme-btn flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-extrabold transition shadow-sm cursor-pointer';
            settingsDarkBtn.className = 'theme-control-btn inactive-theme-btn flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-extrabold transition shadow-sm cursor-pointer';
            if (settingsBadge) {
                settingsBadge.textContent = 'Light Mode Active';
                settingsBadge.className = 'text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#FFF3EB] text-[#E87545] border border-[#FED7AA]';
            }
        } else {
            settingsDarkBtn.className = 'theme-control-btn active-theme-btn flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-extrabold transition shadow-sm cursor-pointer';
            settingsLightBtn.className = 'theme-control-btn inactive-theme-btn flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-extrabold transition shadow-sm cursor-pointer';
            if (settingsBadge) {
                settingsBadge.textContent = 'Dark Mode Active';
                settingsBadge.className = 'text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#172554] text-[#38BDF8] border border-[#38BDF8]/40';
            }
        }
    }
}

function toggleTheme() {
    const current = getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
}

// Initialize theme immediately
(function initTheme() {
    const current = getTheme();
    document.documentElement.setAttribute('data-theme', current);
    if (document.body) document.body.setAttribute('data-theme', current);
})();



const _getDemoOverrides = (target) => {
    const sc = target.selectedDemoScenario;
    if (!sc || !target.inDemoMode || !target.demoCompleted) return null;
    
    // Deep clone to avoid mutating target
    const clone = (obj) => JSON.parse(JSON.stringify(obj));
    
    let overrides = {};
    
    if (sc === 'A') {
        overrides.riskScore = { level: 'LOW RISK', score: 15, nextUpdate: 'Just now' };
        overrides.alerts = [];
        let members = clone(target.members || []);
        members.forEach(m => m.status = 'VERIFIED');
        overrides.members = members;
    } 
    else if (sc === 'B') {
        overrides.riskScore = { level: 'MEDIUM RISK', score: 55, nextUpdate: 'Just now' };
        overrides.alerts = [{ id: 'demo-b-1', type: 'WARNING', title: 'PAYMENT SHORTFALL DETECTED', message: '10 expected, 8 received, 2 missing.', date: new Date().toISOString(), status: 'UNRESOLVED' }];
        let members = clone(target.members || []);
        if (members.length >= 10) {
            members[8].status = 'PENDING';
            members[9].status = 'PENDING';
        }
        overrides.members = members;
    }
    else if (sc === 'C') {
        overrides.riskScore = { level: 'HIGH RISK', score: 85, nextUpdate: 'Just now' };
        overrides.alerts = [{ id: 'demo-c-1', type: 'CRITICAL', title: 'CASH MISMATCH DETECTED', message: 'Reported cash does not match expected amount.', date: new Date().toISOString(), status: 'UNRESOLVED' }];
        let recon = clone(target.reconciliation || {});
        recon.status = 'MISMATCH';
        recon.mismatchAmount = 5000;
        overrides.reconciliation = recon;
    }
    else if (sc === 'D') {
        overrides.riskScore = { level: 'HIGH RISK', score: 90, nextUpdate: 'Just now' };
        overrides.alerts = [{ id: 'demo-d-1', type: 'CRITICAL', title: 'UNAUTHORIZED LOAN ACTIVITY', message: 'Unverified loan detected.', date: new Date().toISOString(), status: 'UNRESOLVED' }];
        let loans = clone(target.loans || []);
        if (loans.length > 0) loans[0].status = 'UNAUTHORIZED';
        overrides.loans = loans;
    }
    else if (sc === 'E') {
        overrides.riskScore = { level: 'HIGH RISK', score: 75, nextUpdate: 'Just now' };
        overrides.alerts = [{ id: 'demo-e-1', type: 'WARNING', title: 'LARGE EXPENSE ANOMALY', message: 'Expense significantly outside expected range.', date: new Date().toISOString(), status: 'UNRESOLVED' }];
    }
    
    return overrides;
};

let _realAppState = 
{
    currentUser: null,
    authenticated: false,
    scenario: 'A',
    shg: null,
    members: [],
    loans: [],
    expenses: [],
    disputes: [],
    alerts: [],
    auditLogs: [],
    reconciliation: {},
    riskScore: {},
    currentLanguage: 'en',
    currentView: 'login', // 'landing' or 'dashboard'
    isLoading: false,
    demoGuidedStep: 0,
    demoGuidedActive: false,
    unreadChatCount: 3,
    chatMessages: [
        { sender: 'Lakshmi Devi', username: 'lakshmi', message: "Tomorrow's SHG meeting will start at 10:00 AM.", time: '10:30 AM', date: '13 Aug 2026' },
        { sender: 'Anitha Kurma', username: 'anitha', message: "Okay, I will attend.", time: '10:32 AM', date: '13 Aug 2026' },
        { sender: 'Sujatha Rao', username: 'sujatha', message: "Can everyone bring their passbooks?", time: '10:35 AM', date: '13 Aug 2026' }
    ],
    announcements: [
        { id: 1, text: "Monthly SHG meeting is scheduled for 10 August at 10:00 AM.", postedBy: "Group Leader (Lakshmi Devi)", date: "10 Aug 2026" }
    ],
    
    // Competition Demo Mode interactive properties
    selectedDemoScenario: null,
    demoRunning: false,
    demoCompleted: false,
    baselineScenario: 'A',
    demoAnalysisStep: 0,
    inDemoMode: false
};

const appState = new Proxy(_realAppState, {
    get: function(target, prop) {
        const overrides = _getDemoOverrides(target);
        if (overrides && prop in overrides) {
            return overrides[prop];
        }
        return target[prop];
    },
    set: function(target, prop, value) {
        target[prop] = value;
        return true;
    }
});


// Multilingual Dictionary for Financial Awareness Module
const translations = {
    en: {
        title: "Financial Awareness Handbook",
        subtitle: "Learn how SHG-Secure protects your hard-earned money",
        langLabel: "Language",
        q1: "What is an SHG Loan?",
        a1: "It is a combined loan taken by the group from a bank. All members share equal responsibility for repayment. Visibility helps ensure everyone knows what loans are active.",
        q2: "What is Outstanding Balance?",
        a2: "It is the remaining amount that the SHG group collectively owes the bank. Keeping this visible prevents surprise debts.",
        q3: "What is a Repayment Deadline?",
        a3: "The specific date by which the monthly payment must reach the bank. Delayed payments lower the group's rating and increase interest rates.",
        q4: "Why should you keep your Digital Receipt?",
        a4: "A digital receipt is an independent, unchangeable proof of your payment. It prevents disputes like 'I already paid' and proves your transaction was sent directly to the bank account.",
        q5: "What to do if you don't recognize a transaction?",
        a5: "If a loan or withdrawal appears that was not discussed, click the 'Report / Dispute' button immediately. This flags the item for authorized bank review.",
        q6: "What happens if a group payment is delayed?",
        a6: "If even 1 or 2 members don't pay on time, the entire group faces a default. SHG-Secure detects this early so the group can coordinate before penalties apply.",
        q7: "How to verify your payment status?",
        a7: "Check your digital passbook on this dashboard. If it shows 'VERIFIED', the bank has recorded the fund receipt. If it shows 'PENDING', contact the leader immediately.",
        badge: "Awareness Guide",
        disclaimer: "Note: This is a decision-support learning guide, not bank advice."
    },
    te: {
        title: "ఆర్థిక అవగాహన హ్యాండ్‌బుక్",
        subtitle: "SHG-Secure మీ కష్టార్జితాన్ని ఎలా కాపాడుతుందో తెలుసుకోండి",
        langLabel: "భాష",
        q1: "SHG రుణం అంటే ఏమిటి?",
        a1: "ఇది బ్యాంకు నుండి గ్రూప్ తీసుకున్న సంయుక్త రుణం. చెల్లింపుకు సభ్యులందరిదీ సమాన బాధ్యత. సభ్యులందరికీ ఏ రుణాలు ఉన్నాయో తెలియడానికి ఇది ఉపయోగపడుతుంది.",
        q2: "బకాయి మొత్తం అంటే ఏమిటి?",
        a2: "ఇది SHG గ్రూప్ బ్యాంకుకు చెల్లించాల్సిన మిగిలిన మొత్తం. బకాయిలు అందరికీ స్పష్టంగా కనిపించడం వల్ల ఆకస్మిక అప్పుల భయం ఉండదు.",
        q3: "తిరిగి చెల్లింపు గడువు అంటే ఏమిటి?",
        a3: "నెలవారీ కంతులు బ్యాంకుకు చేరాల్సిన నిర్దిష్ట తేదీ. ఆలస్యంగా చెల్లిస్తే గ్రూప్ రేటింగ్ తగ్గి, వడ్డీ రేట్లు పెరుగుతాయి.",
        q4: "డిజిటల్ రసీదును ఎందుకు ఉంచుకోవాలి?",
        a4: "డిజిటల్ రసీదు మీ చెల్లింపుకు తిరుగులేని సాక్ష్యం. 'నేను ఇప్పటికే చెల్లించాను' అనే వివాదాలను ఇది నివారిస్తుంది మరియు మీ డబ్బు బ్యాంకుకు చేరిందని రుజువు చేస్తుంది.",
        q5: "గుర్తించని లావాదేవీని చూస్తే ఏం చేయాలి?",
        a5: "గ్రూప్ సమావేశంలో చర్చించని రుణం లేదా ఉపసంహరణ కనిపిస్తే, వెంటనే 'రిపోర్ట్ / వివాదం' బటన్ నొక్కండి. ఇది సమీక్ష అధికారికి అలర్ట్ పంపుతుంది.",
        q6: "గ్రూప్ చెల్లింపు ఆలస్యమైతే ఏమవుతుంది?",
        a6: "ఒకరు లేదా ఇద్దరు సభ్యులు సకాలంలో చెల్లించకపోయినా, గ్రూప్ మొత్తం అపరాధిగా మారుతుంది. దీనిని ముందే గుర్తించి గ్రూప్ సర్దుబాటు చేసుకోవడానికి ఈ యాప్ సహాయపడుతుంది.",
        q7: "చెల్లింపును ఎలా ధృవీకరించాలి?",
        a7: "మీ డిజిటల్ పాస్‌బుక్ తనిఖీ చేయండి. 'VERIFIED' అని ఉంటే బ్యాంకుకు డబ్బులు చేరినట్టు. 'PENDING' అని ఉంటే వెంటనే లీడర్‌ను సంప్రదించండి.",
        badge: "అవగాహన గైడ్",
        disclaimer: "గమనిక: ఇది అవగాహన కొరకు మాత్రమే, బ్యాంకు అధికారిక సలహా కాదు."
    },
    hi: {
        title: "वित्तीय जागरूकता पुस्तिका",
        subtitle: "जानें कि SHG-Secure आपकी मेहनत की कमाई की रक्षा कैसे करता है",
        langLabel: "भाषा",
        q1: "एसएचजी (SHG) ऋण क्या है?",
        a1: "यह बैंक से समूह द्वारा लिया गया एक संयुक्त ऋण है। पुनर्भुगतान के लिए सभी सदस्य समान रूप से जिम्मेदार हैं। पारदर्शिता से सभी को सक्रिय ऋणों की जानकारी रहती है।",
        q2: "बकाया राशि (Outstanding Balance) क्या है?",
        a2: "यह वह बची हुई राशि है जो SHG समूह को बैंक को चुकानी है। इसे पारदर्शी रखने से अचानक होने वाले कर्ज से बचाव होता है।",
        q3: "पुनर्भुगतान की समय सीमा (Deadline) क्या है?",
        a3: "वह तारीख जब तक मासिक भुगतान बैंक तक पहुंचना आवश्यक है। देरी से भुगतान करने पर समूह की रेटिंग गिरती है और ब्याज दर बढ़ती है।",
        q4: "डिजिटल रसीद संभालकर क्यों रखनी चाहिए?",
        a4: "डिजिटल रसीद आपके भुगतान का एक स्वतंत्र, अपरिवर्तनीय प्रमाण है। यह 'मैंने भुगतान कर दिया है' जैसे विवादों को रोकता है और साबित करता है कि राशि बैंक खाते में जमा हो गई है।",
        q5: "अपरिचित लेनदेन दिखने पर क्या करें?",
        a5: "यदि कोई ऋण या निकासी दिखाई दे जिसके बारे में चर्चा नहीं हुई थी, तो तुरंत 'रिपोर्ट / विवाद' बटन पर क्लिक करें। यह समीक्षा अधिकारी को सूचित करेगा।",
        q6: "यदि समूह भुगतान में देरी हो तो क्या होगा?",
        a6: "यदि 1 या 2 सदस्य भी समय पर भुगतान नहीं करते हैं, तो पूरा समूह डिफॉल्टर हो जाता है। SHG-Secure इसे समय से पहले पहचानता है ताकि समूह पहले ही चर्चा कर सके।",
        q7: "भुगतान स्थिति को कैसे सत्यापित करें?",
        a7: "अपने डिजिटल पासबुक की जांच करें। यदि 'VERIFIED' दिखाई दे तो बैंक को राशि मिल चुकी है। यदि 'PENDING' है, तो तुरंत समूह नेता से संपर्क करें।",
        badge: "जागरूकता गाइड",
        disclaimer: "नोट: यह एक जागरूकता मार्गदर्शिका है, बैंक की आधिकारिक सलाह नहीं।"
    }
};

// Helper: Get the real member ID code from the database
function getMemberIdDisplay() {
    const user = appState.currentUser;
    if (!user) return 'N/A';
    if (user.member_id_code) return user.member_id_code;
    if (user.username === 'reviewer') return 'RO-001';
    if (user.username === 'admin') return 'ADM-99';
    // Fallback: compute from members array
    const idx = appState.members.findIndex(m => m.username === user.username);
    return idx >= 0 ? 'SHG001-M' + String(idx + 1).padStart(2, '0') : 'SHG-M-' + user.id;
}

// Helper: Get real SHG name from appState
function getSHGName() {
    return (appState.shg && appState.shg.name) ? appState.shg.name : 'Mahila Jyothi SHG';
}


document.addEventListener('DOMContentLoaded', () => {
    fetchState();
    setupEventListeners();
});

async function fetchState() {
    setLoading(true);
    try {
        const response = await fetch('/api/status');
        if (!response.ok) {
            // Unauthorized or session expired: redirect to login immediately
            window.location.replace('/login');
            return;
        }
        const data = await response.json();
        
        if (data && (data.user || data.currentUser)) {
            // Real authenticated session exists on backend
            appState.currentUser = data.user || data.currentUser;
            appState.authenticated = true;
            appState.currentView = 'dashboard';
            appState.scenario = data.scenario || 'A';
            appState.shg = data.shg;
            appState.members = data.members || [];
            appState.loans = data.loans || [];
            appState.expenses = data.expenses || [];
            appState.disputes = data.disputes || [];
            appState.alerts = data.alerts || [];
            appState.auditLogs = data.auditLogs || [];
            appState.reconciliation = data.reconciliation || {};
            appState.riskScore = data.riskScore || {};
            
            // Sync activeTab with URL path on page load/refresh
            const path = window.location.pathname;
            if (path === '/profile' || path === '/my-profile') appState.activeTab = 'profile';
            else if (path === '/shg' || path === '/my-shg') appState.activeTab = 'shg';
            else if (path === '/group-chat') appState.activeTab = 'group_chat';
            else if (path === '/finances' || path === '/my-finances') appState.activeTab = 'finances';
            else if (path === '/transactions' || path === '/my-transactions') appState.activeTab = 'transactions';
            else if (path === '/security' || path === '/my-security') appState.activeTab = 'security';
            else if (path === '/alerts' || path === '/my-alerts') appState.activeTab = 'alerts';
            else if (path === '/report-concern') appState.activeTab = 'report_concern';
            else if (path === '/settings') appState.activeTab = 'settings';
            else appState.activeTab = 'dashboard';
        } else {
            // No active session: Redirect to Login page
            window.location.replace('/login');
            return;
        }
    } catch (e) {
        console.warn("Backend server check failed, redirecting to login.");
        window.location.replace('/login');
        return;
    }
    
    setLoading(false);
    renderApp();
}

function setupEventListeners() {
    // Scenario Button Click handlers using event delegation
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.scenario-btn');
        if (btn) {
            const scenario = btn.dataset.scenario;
            triggerScenarioSwitch(scenario);
        }
    });
    
    // Language Switcher Event
    document.addEventListener('change', (e) => {
        if (e.target.id === 'lang-select') {
            appState.currentLanguage = e.target.value;
            renderFinancialAwareness();
        }
    });
}

function setLoading(val) {
    appState.isLoading = val;
    const loader = document.getElementById('global-loader');
    if (loader) {
        if (val) loader.classList.remove('hidden');
        else loader.classList.add('hidden');
    }
}

// === Premium 3D Card Tilt Effect ===
function initCardTilt() {
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1200px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg) translateY(-4px)`;
      card.style.boxShadow = '0 20px 50px rgba(15,23,42,0.12), 0 8px 20px rgba(15,23,42,0.08)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
    });
  });
}

// === Animated Number Counters ===
function animateCounters() {
  document.querySelectorAll('[data-count-to]').forEach(el => {
    const target = parseFloat(el.dataset.countTo);
    const prefix = el.dataset.countPrefix || '';
    const suffix = el.dataset.countSuffix || '';
    const duration = 1400;
    const start = performance.now();
    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = prefix + current.toLocaleString('en-IN') + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

// === Initialize Premium Effects After Render ===
let activeThreeInstances = {};

function cleanupThreeInstance(id) {
    if (activeThreeInstances[id]) {
        try {
            const inst = activeThreeInstances[id];
            cancelAnimationFrame(inst.animationFrameId);
            inst.renderer.dispose();
            if (inst.scene) {
                inst.scene.clear();
            }
            if (inst.container && inst.renderer.domElement) {
                inst.container.removeChild(inst.renderer.domElement);
            }
        } catch (e) {
            console.error("Cleanup error for Three.js instance:", id, e);
        }
        delete activeThreeInstances[id];
    }
}

function initThreeHeroSphere() {
    const container = document.getElementById('three-hero-canvas-container');
    if (!container) return;
    
    cleanupThreeInstance('heroSphere');
    
    const width = container.clientWidth;
    const height = container.clientHeight || 400;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 8;
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    
    const group = new THREE.Group();
    scene.add(group);
    
    // Points sphere
    const geom = new THREE.SphereGeometry(2.0, 24, 24);
    const material = new THREE.PointsMaterial({
        color: 0x06b6d4, // Cyan
        size: 0.08,
        transparent: true,
        opacity: 0.9
    });
    const points = new THREE.Points(geom, material);
    group.add(points);
    
    // Wireframe outer sphere
    const wireGeom = new THREE.SphereGeometry(2.1, 12, 12);
    const wireMat = new THREE.MeshBasicMaterial({
        color: 0x16a34a, // Royal Blue
        wireframe: true,
        transparent: true,
        opacity: 0.2
    });
    const wireSphere = new THREE.Mesh(wireGeom, wireMat);
    group.add(wireSphere);
    
    // Torus rings
    const ringGeom = new THREE.TorusGeometry(2.7, 0.03, 8, 48);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.4
    });
    const ringMesh1 = new THREE.Mesh(ringGeom, ringMat);
    ringMesh1.rotation.x = Math.PI / 2;
    group.add(ringMesh1);
    
    const ringMesh2 = new THREE.Mesh(ringGeom, ringMat);
    ringMesh2.rotation.y = Math.PI / 4;
    group.add(ringMesh2);
    
    const inst = {
        renderer,
        scene,
        container,
        animationFrameId: null
    };
    activeThreeInstances['heroSphere'] = inst;
    
    function animate() {
        if (!activeThreeInstances['heroSphere']) return;
        
        group.rotation.y += 0.005;
        group.rotation.x += 0.002;
        
        ringMesh1.rotation.z += 0.008;
        ringMesh2.rotation.z -= 0.012;
        
        renderer.render(scene, camera);
        inst.animationFrameId = requestAnimationFrame(animate);
    }
    animate();
}

function initPremiumEffects() {
  setTimeout(() => {
    initCardTilt();
    animateCounters();
    
    // Trigger 3D canvases
    if (appState.currentView === 'landing') {
        initThreeHeroSphere();
    }
  }, 100);
}

// --- CORE ACTION TRIGGERS ---

async function triggerScenarioSwitch(sc) {
    setLoading(true);
    try {
        const response = await fetch('/api/switch-scenario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenario: sc })
        });
        const resData = await response.json();
        if (resData.success) {
            let defaultUser = 'lakshmi';
            if (sc === 'C') defaultUser = 'reviewer';
            else if (sc === 'E') defaultUser = 'sujatha';
            
            /* await handleLoginAction(defaultUser); */
            showToast(`Switched database to Scenario ${sc}!`, 'success');
        } else {
            useLocalScenarioSwitch(sc);
        }
    } catch (e) {
        console.warn("Server connection failed, using local scenario switch.");
        useLocalScenarioSwitch(sc);
    }
    setLoading(false);
    renderApp();
}

function useLocalScenarioSwitch(sc) {
    appState.scenario = sc;
    loadLocalMockState(sc);
    autoLoginForScenario(sc);
    showToast(`Switched locally to Scenario ${sc}!`, 'success');
}

function autoLoginForScenario(sc) {
    let defaultUser = 'lakshmi'; // Member Lakshmi for payments/awareness
    if (sc === 'C') {
        defaultUser = 'reviewer'; // Bank review officer to inspect cash mismatch
    } else if (sc === 'D') {
        defaultUser = 'lakshmi'; // Radha has dispute, Lakshmi will review/vote too
    } else if (sc === 'E') {
        defaultUser = 'sujatha'; // Leader Sujatha created the expense, can also check members response
    }
    
    // Run login
    handleLoginAction(defaultUser);
}

async function handleLoginAction(username) {
    setLoading(true);
    
    const mockUsers = {
        'lakshmi': { 
            id: 1, 
            username: 'lakshmi', 
            full_name: 'Lakshmi Devi', 
            role: 'MEMBER', 
            shg_id: 1,
            dob: '1988-08-14',
            gender: 'Female',
            mobile: '9848022338',
            email: 'lakshmi@shgsecure.in',
            address: 'H.No 3-42, Main Road',
            village: 'Gollapudi',
            mandal: 'Vemuru',
            district: 'Guntur',
            occupation: 'Tailoring & Embroidery',
            profile_photo: '👩‍🌾',
            membership_date: '2025-01-15'
        },
        'anitha': { 
            id: 2, 
            username: 'anitha', 
            full_name: 'Anitha Kurma', 
            role: 'MEMBER', 
            shg_id: 1,
            dob: '1991-11-20',
            gender: 'Female',
            mobile: '9177283940',
            email: 'anitha@shgsecure.in',
            address: 'H.No 1-56, Temple Lane',
            village: 'Gollapudi',
            mandal: 'Vemuru',
            district: 'Guntur',
            occupation: 'Agriculture',
            profile_photo: '👩‍🍳',
            membership_date: '2025-01-15'
        },
        'sujatha': { 
            id: 3, 
            username: 'sujatha', 
            full_name: 'Sujatha Rao', 
            role: 'LEADER', 
            shg_id: 1,
            dob: '1982-04-10',
            gender: 'Female',
            mobile: '9490123456',
            email: 'sujatha.rao@shgsecure.in',
            address: 'H.No 2-8, Panchayat Road',
            village: 'Gollapudi',
            mandal: 'Vemuru',
            district: 'Guntur',
            occupation: 'Dairy Farming',
            profile_photo: '👩',
            membership_date: '2025-01-15'
        },
        'reviewer': { 
            id: 11, 
            username: 'reviewer', 
            full_name: 'Authorized Review Officer', 
            role: 'REVIEWER', 
            shg_id: null,
            dob: '1975-06-25',
            gender: 'Male',
            mobile: '9900223344',
            email: 'reviewer@sbi.co.in',
            address: 'SBI Regional Branch Office',
            village: 'Tenali',
            mandal: 'Tenali',
            district: 'Guntur',
            occupation: 'Bank Review Officer',
            profile_photo: '👨‍💼',
            membership_date: '2022-10-01'
        },
        'admin': { 
            id: 12, 
            username: 'admin', 
            full_name: 'System Administrator', 
            role: 'ADMIN', 
            shg_id: null,
            dob: '1980-01-01',
            gender: 'Male',
            mobile: '9000100099',
            email: 'admin@shgsecure.gov.in',
            address: 'NIC District HQ',
            village: 'Guntur',
            mandal: 'Guntur',
            district: 'Guntur',
            occupation: 'Technical Administrator',
            profile_photo: '💻',
            membership_date: '2024-06-01'
        }
    };

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password: 'password' })
        });
        const resData = await response.json();
        if (resData.success) {
            await fetchState();
            showToast(`Logged in as ${appState.currentUser.full_name} (${appState.currentUser.role})`, 'success');
        } else {
            useLocalMockLogin(username, mockUsers);
        }
    } catch (e) {
        console.warn("Server connection offline, loading local sandbox login.");
        useLocalMockLogin(username, mockUsers);
    }
    appState.activeTab = 'dashboard';
    setLoading(false);
    renderApp();
}

function useLocalMockLogin(username, mockUsers) {
    const user = mockUsers[username.toLowerCase()];
    if (user) {
        appState.currentUser = user;
        appState.currentView = 'dashboard';
        showToast(`Logged in as ${user.full_name} (${user.role}) [Demo Mode]`, 'success');
    } else {
        showToast("Login failed.", 'danger');
    }
}

async function handleLogout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
    } catch (e) {
        console.error('Logout failed:', e);
    }
    appState.currentUser = null;
    appState.authenticated = false;
    appState.currentView = 'login';
    clearToasts();
    window.location.replace('/login');
}

function resetSystem() {
    setLoading(true);
    appState.scenario = 'A';
    appState.currentUser = null;
    appState.currentView = 'landing';
    appState.demoGuidedActive = false;
    loadLocalMockState('A');
    showToast("Demo system completely reset to Scenario A.", "success");
    setLoading(false);
    renderApp();
}

appState.selectedPaymentMethod = 'UPI';

function selectPaymentMethod(method) {
    appState.selectedPaymentMethod = method;
    
    const upiBtn = document.getElementById('pay-method-upi');
    const bankBtn = document.getElementById('pay-method-bank');
    
    if (upiBtn && bankBtn) {
        if (method === 'UPI') {
            upiBtn.className = 'flex flex-col items-center justify-center p-4 border border-[#E87545] bg-[#FFF3EB] rounded-xl transition text-center group';
            bankBtn.className = 'flex flex-col items-center justify-center p-4 border border-slate-200 hover:border-[#E87545] rounded-xl transition text-center group';
        } else {
            upiBtn.className = 'flex flex-col items-center justify-center p-4 border border-slate-200 hover:border-[#E87545] rounded-xl transition text-center group';
            bankBtn.className = 'flex flex-col items-center justify-center p-4 border border-[#E87545] bg-[#FFF3EB] rounded-xl transition text-center group';
        }
    }
}

function executeSimulatedPayment() {
    if (appState.isProcessingPayment) return;
    appState.isProcessingPayment = true;
    
    const payBtn = document.getElementById('pay-primary-btn');
    if (payBtn) {
        payBtn.disabled = true;
        payBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
        `;
    }
    
    const dashPayBtn = document.getElementById('dashboard-pay-btn');
    if (dashPayBtn) {
        dashPayBtn.disabled = true;
        dashPayBtn.textContent = 'Processing...';
    }
    
    setTimeout(() => {
        confirmSimulatedPayment(appState.selectedPaymentMethod || 'UPI');
    }, 800);
}

function initiatePayment() {
    // Prevent if already processing or already verified
    if (appState.isProcessingPayment) return;
    const myUser = appState.currentUser || { id: 1, username: 'lakshmi' };
    const myPayment = (appState.members || []).find(m => m.username === myUser.username || m.id === myUser.id);
    if (myPayment && myPayment.status === 'VERIFIED') {
        showToast("Contribution already verified!", "info");
        return;
    }
    
    // Select UPI by default when showing modal
    selectPaymentMethod('UPI');
    
    // Show Simulated Payment Modal
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

async function confirmSimulatedPayment(method) {
    closePaymentModal();
    setLoading(true);
    
    try {
        const response = await fetch('/api/pay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                method: method,
                amount: 1000.0,
                is_cash: 0
            })
        });
        const resData = await response.json();
        if (resData.success) {
            showToast("Payment deposited and verified on secure server!", "success");
            
            // Immediately mark member as verified in appState
            const myUser = appState.currentUser || { id: 1, username: 'lakshmi' };
            const mem = (appState.members || []).find(m => m.username === myUser.username || m.id === myUser.id);
            if (mem) {
                mem.status = 'VERIFIED';
                mem.amount = 1000.0;
                mem.payment_date = resData.receipt.date;
                mem.txn_id = resData.receipt.txnId;
                mem.method = method;
            }
            
            // Reload latest recalculated stats from backend SQLite database
            await fetchState();
            
            // Show receipt from server txn
            const receipt = {
                shgName: resData.receipt.shgName,
                memberName: resData.receipt.memberName,
                amount: resData.receipt.amount,
                purpose: resData.receipt.purpose,
                date: resData.receipt.date,
                method: method,
                txnId: resData.receipt.txnId,
                status: resData.receipt.status,
                message: resData.receipt.message
            };
            showReceipt(receipt);
        } else {
            useLocalPayment(method);
        }
    } catch (e) {
        console.warn("Server payment failed, using local mock payment.");
        useLocalPayment(method);
    }
    
    appState.isProcessingPayment = false;
    setLoading(false);
    renderApp();
}

function useLocalPayment(method) {
    const record = appState.members.find(m => m.username === appState.currentUser.username);
    const uniqueId = Math.floor(100000 + Math.random() * 900000);
    const generatedTxnId = 'SHG-DEMO-' + uniqueId;
    
    if (record) {
        record.status = 'VERIFIED';
        record.amount = 1000.0;
        record.payment_date = new Date().toISOString().replace('T', ' ').split('.')[0];
        record.txn_id = generatedTxnId;
        record.is_cash_deposit = 0;
    }
    
    appState.auditLogs.unshift({
        id: appState.auditLogs.length + 1,
        event_type: 'PAYMENT',
        message: appState.currentUser.full_name + ' paid ₹1,000 via ' + method + '.',
        timestamp: new Date().toISOString().replace('T', ' ').split('.')[0]
    });
    
    recalculateLocalRiskAndCollection();
    
    const receipt = {
        shgName: appState.shg.name,
        memberName: appState.currentUser.full_name,
        amount: 1000.0,
        purpose: 'Monthly Contribution Dues',
        date: new Date().toLocaleDateString('en-GB'),
        method: method,
        txnId: generatedTxnId,
        status: 'VERIFIED',
        message: 'Payment successfully recorded in local mock ledger.'
    };
    showReceipt(receipt);
}

function showReceipt(receipt) {
    const receiptContent = document.getElementById('receipt-content');
    receiptContent.innerHTML = `
        <div class="border-b border-dashed border-slate-200 pb-4 mb-4 text-center">
            <div class="text-emerald-700 text-xl font-black mb-1">✓ PAYMENT SUCCESSFUL</div>
            <p class="text-xs text-slate-500">DIGITAL RECORD & LEDGER ENTRY</p>
        </div>
        <div class="space-y-2 text-sm text-slate-700">
            <div class="flex justify-between"><span class="font-medium text-slate-400">SHG Group:</span> <span class="font-bold text-slate-800">${receipt.shgName}</span></div>
            <div class="flex justify-between"><span class="font-medium text-slate-400">Member:</span> <span class="font-bold text-slate-800">${receipt.memberName}</span></div>
            <div class="flex justify-between"><span class="font-medium text-slate-400">Amount Paid:</span> <span class="font-bold text-emerald-700 text-lg">₹${receipt.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
            <div class="flex justify-between"><span class="font-medium text-slate-400">Purpose:</span> <span class="font-medium text-slate-800">${receipt.purpose}</span></div>
            <div class="flex justify-between"><span class="font-medium text-slate-400">Payment Date:</span> <span class="font-medium text-slate-800">${receipt.date}</span></div>
            <div class="flex justify-between"><span class="font-medium text-slate-400">Transaction ID:</span> <span class="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-1 py-0.5 rounded">${receipt.txnId}</span></div>
            <div class="flex justify-between"><span class="font-medium text-slate-400">Status:</span> <span class="status-pill bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase">VERIFIED</span></div>
        </div>
        <div class="mt-6 pt-4 border-t border-dashed border-slate-200 text-center text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded">
            <p class="font-semibold">${receipt.message}</p>
        </div>
        <div class="mt-2 text-center text-[10px] text-red-500 font-medium">
            * DEMO PAYMENT — NO REAL MONEY TRANSFERRED *
        </div>
    `;
    
    // Set up receipt print/download simulation
    document.getElementById('download-receipt-btn').onclick = () => {
        alert(`Simulated Receipt Download for ${receipt.txnId}. File saved as SHG_Secure_Receipt_${receipt.txnId}.pdf`);
    };
    
    const modal = document.getElementById('receipt-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeReceiptModal() {
    const modal = document.getElementById('receipt-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Transaction Voting / Verification
function submitVote(txType, txId, response) {
    if (response === 'UNAWARE' || response === 'DISPUTED') {
        // Show dispute reason inputs
        const reason = prompt("Please provide a reason or concern for the Authorized Reviewer:", "I was not informed about this transaction in our meetings.");
        if (reason === null) return; // user cancelled prompt
        
        sendVoteRequest(txType, txId, response, reason);
    } else {
        sendVoteRequest(txType, txId, response, "");
    }
}

async function sendVoteRequest(txType, txId, responseValue, reason) {
    setLoading(true);
    try {
        const res = await fetch('/api/verify-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transaction_type: txType,
                transaction_id: txId,
                response: responseValue,
                reason: reason
            })
        });
        const resData = await res.json();
        if (resData.success) {
            showToast("Your verification response has been saved on the secure server!", "success");
            await fetchState(); // reload all state from server!
        } else {
            useLocalVote(txType, txId, responseValue, reason);
        }
    } catch (e) {
        console.warn("Server vote failed, saving locally in client memory.");
        useLocalVote(txType, txId, responseValue, reason);
    }
    setLoading(false);
    renderApp();
}

function useLocalVote(txType, txId, responseValue, reason) {
    let target = null;
    if (txType === 'LOAN') {
        target = appState.loans.find(l => l.id == txId);
    } else if (txType === 'EXPENSE') {
        target = appState.expenses.find(e => e.id == txId);
    }
    
    if (target) {
        let userVote = target.verifications.find(v => v.username === appState.currentUser.username);
        if (userVote) {
            userVote.response = responseValue;
            userVote.reason = reason;
        } else {
            target.verifications.push({
                username: appState.currentUser.username,
                response: responseValue,
                reason: reason
            });
        }
        
        appState.auditLogs.unshift({
            id: appState.auditLogs.length + 1,
            event_type: 'VOTE',
            message: appState.currentUser.full_name + ' voted ' + responseValue + ' on ' + txType + ' ID ' + txId + '.',
            timestamp: new Date().toISOString().replace('T', ' ').split('.')[0]
        });
        
        recalculateLocalRiskAndCollection();
        showToast(`Response recorded locally: ${responseValue}`, 'success');
    }
}

// Create Expense (Leader capability)
function openExpenseModal() {
    const modal = document.getElementById('expense-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Set default demo data to make evaluate easy
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-purpose').value = '';
}

function closeExpenseModal() {
    const modal = document.getElementById('expense-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function submitExpense() {
    const amountVal = document.getElementById('expense-amount').value;
    const purposeVal = document.getElementById('expense-purpose').value.trim();
    
    if (!amountVal || parseFloat(amountVal) <= 0 || !purposeVal) {
        showToast("Please enter a valid amount and description.", 'danger');
        return;
    }
    
    closeExpenseModal();
    setLoading(true);
    
    try {
        const response = await fetch('/api/add-expense', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: parseFloat(amountVal),
                purpose: purposeVal
            })
        });
        const resData = await response.json();
        if (resData.success) {
            showToast("Expense added successfully on secure server!", "success");
            await fetchState(); // reload state from SQLite database!
        } else {
            useLocalSubmitExpense(amountVal, purposeVal);
        }
    } catch (e) {
        console.warn("Server offline, saving expense locally.");
        useLocalSubmitExpense(amountVal, purposeVal);
    }
    setLoading(false);
    renderApp();
}

function useLocalSubmitExpense(amountVal, purposeVal) {
    const newId = appState.expenses.length + 1;
    const amount = parseFloat(amountVal);
    const isAnomaly = amount > 50000;
    
    appState.expenses.push({
        id: newId,
        amount: amount,
        purpose: purposeVal,
        status: isAnomaly ? 'PENDING' : 'APPROVED',
        date: new Date().toISOString().replace('T', ' ').split('.')[0],
        verifications: [
            { username: appState.currentUser.username, response: 'AWARE', reason: 'Logged expense' }
        ]
    });
    
    appState.auditLogs.unshift({
        id: appState.auditLogs.length + 1,
        event_type: 'EXPENSE',
        message: appState.currentUser.full_name + ' logged expense of ₹' + amount.toLocaleString('en-IN') + '.',
        timestamp: new Date().toISOString().replace('T', ' ').split('.')[0]
    });
    
    recalculateLocalRiskAndCollection();
    
    if (isAnomaly) {
        showToast("Expense logged! Risk Engine flagged transaction as UNUSUAL size. Marked PENDING member review.", "warning");
    } else {
        showToast("Expense logged and verified locally.", "success");
    }
}

// Open Dispute Modal (for general concerns)
function openDisputeModal(txType, txId) {
    const modal = document.getElementById('dispute-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    document.getElementById('dispute-tx-type').value = txType;
    document.getElementById('dispute-tx-id').value = txId;
    document.getElementById('dispute-reason').value = '';
}

function closeDisputeModal() {
    const modal = document.getElementById('dispute-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function submitGeneralDispute() {
    const txType = document.getElementById('dispute-tx-type').value;
    const txId = document.getElementById('dispute-tx-id').value;
    const reason = document.getElementById('dispute-reason').value.trim();
    
    if (!reason) {
        showToast("Please state your concern.", 'danger');
        return;
    }
    
    closeDisputeModal();
    setLoading(true);
    
    try {
        const response = await fetch('/api/dispute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transaction_type: txType,
                transaction_id: parseInt(txId),
                reason: reason
            })
        });
        const resData = await response.json();
        if (resData.success) {
            showToast("Dispute logged successfully on secure server!", "success");
            await fetchState(); // Refresh state from SQLite database!
        } else {
            useLocalGeneralDispute(txType, txId, reason);
        }
    } catch (e) {
        console.warn("Server connection offline, saving dispute locally.");
        useLocalGeneralDispute(txType, txId, reason);
    }
    setLoading(false);
    renderApp();
}

function useLocalGeneralDispute(txType, txId, reason) {
    const newId = appState.disputes.length + 1;
    appState.disputes.push({
        id: newId,
        transaction_type: txType,
        transaction_id: parseInt(txId),
        member_name: appState.currentUser.full_name,
        reason: reason,
        status: 'PENDING'
    });
    
    if (txType === 'LOAN') {
        const loan = appState.loans.find(l => l.id == txId);
        if (loan) loan.status = 'UNDER_REVIEW';
    } else if (txType === 'EXPENSE') {
        const exp = appState.expenses.find(e => e.id == txId);
        if (exp) exp.status = 'UNDER_REVIEW';
    }
    
    appState.auditLogs.unshift({
        id: appState.auditLogs.length + 1,
        event_type: 'DISPUTE',
        message: appState.currentUser.full_name + ' raised a dispute on ' + txType + ' ID ' + txId + '.',
        timestamp: new Date().toISOString().replace('T', ' ').split('.')[0]
    });
    
    recalculateLocalRiskAndCollection();
    showToast(`Concern logged. Dispute ID: DISP-${newId.toString().padStart(4, '0')}`, 'success');
}

async function resolveDispute(disputeId, resolution) {
    setLoading(true);
    
    try {
        const response = await fetch('/api/resolve-dispute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dispute_id: disputeId,
                resolution: resolution
            })
        });
        const resData = await response.json();
        if (resData.success) {
            showToast("Dispute resolved successfully on secure server!", "success");
            await fetchState(); // reload from DB!
        } else {
            useLocalResolveDispute(disputeId, resolution);
        }
    } catch (e) {
        console.warn("Server offline, resolving dispute locally.");
        useLocalResolveDispute(disputeId, resolution);
    }
    setLoading(false);
    renderApp();
}

function useLocalResolveDispute(disputeId, resolution) {
    const dispute = appState.disputes.find(d => d.id == disputeId);
    if (dispute) {
        dispute.status = resolution;
        
        if (resolution === 'APPROVED' || resolution === 'RESOLVED') {
            if (dispute.transaction_type === 'LOAN') {
                const loan = appState.loans.find(l => l.id == dispute.transaction_id);
                if (loan) loan.status = 'APPROVED';
            } else if (dispute.transaction_type === 'EXPENSE') {
                const exp = appState.expenses.find(e => e.id == dispute.transaction_id);
                if (exp) exp.status = 'APPROVED';
            }
        }
        
        appState.auditLogs.unshift({
            id: appState.auditLogs.length + 1,
            event_type: 'DISPUTE_RESOLUTION',
            message: 'Dispute ID ' + disputeId + ' resolved as ' + resolution + '.',
            timestamp: new Date().toISOString().replace('T', ' ').split('.')[0]
        });
        
        recalculateLocalRiskAndCollection();
        showToast(`Dispute ${disputeId} resolved as ${resolution}.`, 'success');
    }
}

// --- RENDER SYSTEM ---

function renderApp() {
    renderHeader();
    
    const landingSection = document.getElementById('landing-section');
    const dashboardSection = document.getElementById('dashboard-section');
    
    if (landingSection) {
        landingSection.classList.add('hidden');
        landingSection.style.display = 'none';
    }
    
    if (dashboardSection) {
        dashboardSection.classList.remove('hidden');
        dashboardSection.style.display = 'block';
        renderDashboard();
    }
}

function renderHeader() {
    const headerDiv = document.getElementById('app-header');
    if (!headerDiv) return;
    const isSecure = appState.scenario === 'A';
    const currentTheme = getTheme();
    
    // Auth Guard for Header: If unauthenticated or on login page, ALWAYS render clean header
    if (!appState.authenticated || !appState.currentUser || appState.currentView === 'login' || appState.currentView === 'landing') {
        headerDiv.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center select-none">
                <div class="flex items-center gap-2 cursor-pointer" onclick="appState.currentView = 'login'; renderApp();">
                    <div class="bg-[#18233A] text-[#FAFAF7] p-2 rounded-lg font-bold flex items-center justify-center shadow-sm">🛡️</div>
                    <span class="font-extrabold text-xl tracking-tight text-[#18233A]">SHG-Secure</span>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="toggleTheme();" class="theme-toggle-btn px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-extrabold shadow-sm transition" title="Switch Theme">
                        <span>${currentTheme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
                    </button>
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-full" style="background: ${isSecure ? 'rgba(22,131,75,0.08)' : 'rgba(198,40,40,0.08)'}; border: 1px solid ${isSecure ? 'rgba(22,131,75,0.2)' : 'rgba(198,40,40,0.2)'}">
                        <span class="ai-status-dot ${isSecure ? 'status-safe' : 'status-danger'}" style="width:6px;height:6px"></span>
                        <span class="text-[10px] font-extrabold uppercase tracking-wider ${isSecure ? 'text-emerald-700' : 'text-red-700'}">${isSecure ? 'System Secure' : 'Risk Detected'}</span>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    const roleColors = {
        'MEMBER': 'bg-[#ECE9E1] text-[#18233A] border-[#DDD8CC]',
        'LEADER': 'bg-[#18233A] text-white border-[#18233A]',
        'REVIEWER': 'bg-[#ECE9E1] text-[#18233A] border-[#DDD8CC]',
        'ADMIN': 'bg-[#E87545] text-white border-[#E87545]'
    };
    
    const u = appState.currentUser;
    const name = u.name || u.full_name || 'Lakshmi Devi';
    const memberId = u.member_id || u.member_id_code || 'SHG001-M01';
    const groupName = u.shg_name || 'Mahila Jyothi SHG';
    const role = u.role || 'MEMBER';
    
    headerDiv.innerHTML = `
        <div class="max-w-7xl mx-auto px-2.5 sm:px-4 py-2.5 flex justify-between items-center gap-2 sm:gap-3 select-none box-border">
            <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                <button id="mobile-sidebar-toggle" onclick="toggleMobileSidebar();" class="mobile-menu-btn p-1.5 sm:p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-[#18233A] dark:text-white items-center justify-center font-bold text-sm sm:text-base shadow-sm transition hover:bg-slate-100 shrink-0" title="Toggle Navigation Menu">
                    ☰
                </button>
                <div class="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0" onclick="appState.activeTab = 'dashboard'; closeMobileSidebar(); renderApp();">
                    <div class="bg-[#18233A] text-[#FAFAF7] p-1.5 sm:p-2 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center shadow-sm shrink-0">🛡️</div>
                    <div class="min-w-0">
                        <span class="font-extrabold text-sm sm:text-base leading-tight tracking-tight text-[#18233A] block truncate">SHG-SECURE</span>
                        <span class="text-[9px] sm:text-[10px] font-bold text-[#5B6472] block uppercase tracking-wider truncate max-w-[100px] sm:max-w-[180px]">${groupName}</span>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <button onclick="toggleTheme();" class="theme-toggle-btn px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border flex items-center gap-1 text-[11px] sm:text-xs font-extrabold shadow-sm transition" title="Toggle Light / Dark Mode">
                    <span>${currentTheme === 'dark' ? '🌙' : '☀️'}</span>
                    <span class="hidden sm:inline">${currentTheme === 'dark' ? ' Dark Mode' : ' Light Mode'}</span>
                </button>

                <div class="text-right header-user-info hidden sm:block">
                    <div class="text-xs font-black text-[#18233A] truncate max-w-[120px] md:max-w-[180px]">${name}</div>
                    <div class="text-[10px] text-[#5B6472] font-mono font-bold">ID: ${memberId}</div>
                </div>
                
                <span class="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase border shrink-0 ${roleColors[role] || roleColors['MEMBER']}">
                    ${role}
                </span>

                <button onclick="handleLogout();" class="bg-[#FAFAF7] hover:bg-[#ECE9E1] text-[#18233A] font-bold text-[10px] sm:text-xs px-2.5 sm:px-3.5 py-1 sm:py-2 rounded-xl transition shadow-sm border border-[#E4E0D7] shrink-0">
                    Sign Out
                </button>
            </div>
        </div>
    `;
}

function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar-panel');
    const backdrop = document.getElementById('mobile-sidebar-backdrop');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
    if (backdrop) {
        backdrop.classList.toggle('hidden');
    }
}

function closeMobileSidebar() {
    const sidebar = document.querySelector('.sidebar-panel');
    const backdrop = document.getElementById('mobile-sidebar-backdrop');
    if (sidebar) {
        sidebar.classList.remove('mobile-open');
    }
    if (backdrop) {
        backdrop.classList.add('hidden');
    }
}


function renderLandingPage() {
    clearToasts();
    const landingDiv = document.getElementById('landing-section');
    if (!landingDiv) return;
    
    landingDiv.innerHTML = `
        <div class="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none">
            <!-- Background Radial Decor -->
            <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            <div class="w-full max-w-md bg-slate-950/90 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6 backdrop-blur-xl">
                <!-- Header / Logo -->
                <div class="text-center space-y-2">
                    <div class="inline-flex items-center justify-center w-14 h-14 bg-blue-600/20 border border-blue-500/30 rounded-2xl mb-1 text-2xl shadow-inner">
                        🛡️
                    </div>
                    <h1 class="text-3xl font-black text-white tracking-wider uppercase">SHG-SECURE</h1>
                    <p class="text-xs font-semibold text-slate-400 tracking-wide">Financial Transparency for Every Member</p>
                </div>

                <!-- Login Form -->
                <form onsubmit="handleLoginSubmit(event);" class="space-y-4 pt-2">
                    <!-- Error Alert Container (Empty & Hidden by default) -->
                    <div id="login-error-msg" class="hidden p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs font-bold text-center"></div>

                    <!-- Member ID -->
                    <div class="space-y-1.5 text-left">
                        <label class="text-xs font-bold text-slate-300 uppercase tracking-wider block">Member ID</label>
                        <input type="text" id="login-member-id" placeholder="e.g. SHG001-M01" required value="SHG001-M01"
                            class="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white text-sm rounded-xl p-3 focus:outline-none transition font-mono tracking-wide" />
                    </div>

                    <!-- PIN / Password -->
                    <div class="space-y-1.5 text-left">
                        <div class="flex justify-between items-center">
                            <label class="text-xs font-bold text-slate-300 uppercase tracking-wider">PIN / Password</label>
                            <button type="button" onclick="alert('Demo Credentials PIN: 1234');" class="text-[11px] text-blue-400 hover:underline font-medium">Forgot PIN?</button>
                        </div>
                        <input type="password" id="login-pin" placeholder="••••" required value="1234"
                            class="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 text-white text-sm rounded-xl p-3 focus:outline-none transition font-mono tracking-widest" />
                    </div>

                    <!-- Submit Button -->
                    <button type="submit" class="w-full mt-4 bg-[#E87545] hover:bg-[#D66434] text-white font-extrabold text-sm py-3.5 rounded-xl transition shadow-lg uppercase tracking-wider flex items-center justify-center gap-2">
                        🔒 LOGIN
                    </button>
                </form>

                <!-- Demo Login Helpers Box -->
                <div class="pt-4 border-t border-slate-800/80">
                    <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-left space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                💡 Demo Credentials
                            </span>
                            <span class="text-[10px] text-slate-500 uppercase tracking-wider">Competition Mode</span>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-2 pt-1 text-xs">
                            <button type="button" onclick="fillDemoCredentials('SHG001-M01', '1234');" 
                                class="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition cursor-pointer">
                                <div class="text-[10px] text-slate-400 uppercase font-bold">Member (Lakshmi)</div>
                                <div class="font-mono text-slate-200 text-[11px] font-bold">SHG001-M01</div>
                                <div class="text-[10px] text-emerald-400">PIN: 1234</div>
                            </button>
                            <button type="button" onclick="fillDemoCredentials('SHG001-M03', '1234');" 
                                class="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition cursor-pointer">
                                <div class="text-[10px] text-slate-400 uppercase font-bold">Leader (Sujatha)</div>
                                <div class="font-mono text-slate-200 text-[11px] font-bold">SHG001-M03</div>
                                <div class="text-[10px] text-blue-400">PIN: 1234</div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function handleLoginSubmit(e) {
    if (e) e.preventDefault();
    const memberId = document.getElementById('login-member-id').value.trim();
    const pin = document.getElementById('login-pin').value.trim();
    const errorMsg = document.getElementById('login-error-msg');
    
    if (errorMsg) {
        errorMsg.classList.add('hidden');
        errorMsg.textContent = '';
    }
    
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ member_id: memberId, pin: pin })
        });
        
        const data = await res.json();
        
        if (res.ok && data.success && data.user) {
            appState.currentUser = data.user;
            appState.authenticated = true;
            appState.currentView = 'dashboard';
            renderApp();
        } else {
            if (errorMsg) {
                errorMsg.textContent = data.error || 'Invalid Member ID or PIN.';
                errorMsg.classList.remove('hidden');
            }
        }
    } catch (err) {
        console.error('Login error:', err);
        if (errorMsg) {
            errorMsg.textContent = 'Invalid Member ID or PIN.';
            errorMsg.classList.remove('hidden');
        }
    }
}

function fillDemoCredentials(mId, pin) {
    const idInput = document.getElementById('login-member-id');
    const pinInput = document.getElementById('login-pin');
    if (idInput) idInput.value = mId;
    if (pinInput) pinInput.value = pin;
    const errorMsg = document.getElementById('login-error-msg');
    if (errorMsg) errorMsg.classList.add('hidden');
}


function renderReportConcernViewHTML() {
    return `
        <div class="space-y-6">
            <div class="border-b border-slate-200 pb-4">
                <h2 class="font-extrabold text-2xl text-slate-800 tracking-tight">📞 Report a Financial Concern</h2>
                <p class="text-xs text-slate-500 mt-1">Submit a query or report unapproved financial records for audit officer review.</p>
            </div>
            
            <div class="grid lg:grid-cols-2 gap-6">
                <div>
                    ${renderGeneralReportFormHTML()}
                </div>
                
                <div class="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4 bg-white">
                    <h3 class="font-extrabold text-sm text-slate-800 tracking-wider uppercase">ℹ️ Reporting Guidelines</h3>
                    <div class="space-y-3 text-xs text-slate-600">
                        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <strong class="text-slate-800 block mb-1">1. Missing Payments</strong>
                            <span>If your payment was completed but does not appear in your ledger within 24 hours, select 'My Payment is missing'.</span>
                        </div>
                        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <strong class="text-slate-800 block mb-1">2. Unrecognized Transactions</strong>
                            <span>If you see an external loan or expense you did not approve in a group meeting, file an immediate objection.</span>
                        </div>
                        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <strong class="text-slate-800 block mb-1">3. Audit Escalation</strong>
                            <span>All reports are stored immutably with cryptographic timestamps and forwarded directly to bank review officers.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderDashboard() {
    const dashboard = document.getElementById('dashboard-section');
    if (!dashboard) return;
    
    // Determine active tab HTML content
    let activeContentHTML = '';
    const tab = appState.activeTab || 'dashboard';
    
    if (tab === 'dashboard') {
        activeContentHTML = renderRoleSpecificDashboard();
    } else if (tab === 'profile') {
        activeContentHTML = renderMemberProfileViewHTML();
    } else if (tab === 'shg' || tab === 'members') {
        activeContentHTML = renderMySHGViewHTML();
    } else if (tab === 'group_chat') {
        activeContentHTML = renderGroupChatViewHTML();
    } else if (tab === 'finances') {
        activeContentHTML = renderMyFinancesViewHTML();
    } else if (tab === 'transactions') {
        activeContentHTML = renderMyTransactionsViewHTML();
    } else if (tab === 'security' || tab === 'risk_analysis') {
        activeContentHTML = renderMySecurityViewHTML();
    } else if (tab === 'alerts') {
        activeContentHTML = renderMyAlertsViewHTML();
    } else if (tab === 'report_concern') {
        activeContentHTML = renderReportConcernViewHTML();
    } else if (tab === 'settings') {
        activeContentHTML = renderMySettingsViewHTML();
    }
    
    // Layout: 2-Column Shell
    dashboard.innerHTML = `
        <div class="dashboard-shell relative">
            <!-- Backdrop for mobile sidebar drawer -->
            <div id="mobile-sidebar-backdrop" class="mobile-backdrop hidden" onclick="closeMobileSidebar();"></div>
            <!-- COLUMN 1: Left Sidebar Panel -->
            <div class="sidebar-panel select-none">
                <div class="px-2 py-2 mb-2 border-b border-slate-700/40 text-center md:text-left">
                    <span class="text-xs font-black uppercase tracking-widest block sidebar-portal-title">💳 Member Portal</span>
                    <span class="text-[9px] font-bold block uppercase tracking-wider mt-1 sidebar-portal-subtitle">SHG-Secure AI Active</span>
                </div>
                ${renderSidebarNavigationItemsHTML()}
            </div>

            <!-- COLUMN 2: Main Content Area -->
            <section class="left-panel ${tab === 'group_chat' ? 'chat-active-panel' : 'space-y-6 px-8 py-6 overflow-y-auto'}">
                <!-- Page-Specific Main Content -->
                ${activeContentHTML}

                ${tab === 'dashboard' ? `
                <!-- DASHBOARD-ONLY BOTTOM SECTION (Risk, Health, Awareness, Safety Flow) -->
                <div class="border-t border-slate-200/80 pt-6 space-y-7">
                    <!-- ROW 1: Overall Risk Indicator & Bank Repayment Status -->
                    <div class="grid lg:grid-cols-2 gap-6 items-stretch">
                        <div class="flex flex-col space-y-3 h-full">
                            <h3 class="font-extrabold text-xs text-[#5B6472] uppercase tracking-wider">📊 Overall Risk Indicator</h3>
                            ${renderRiskGaugeHTML()}
                        </div>
                        <div class="flex flex-col space-y-3 h-full">
                            <h3 class="font-extrabold text-xs text-[#5B6472] uppercase tracking-wider">🏦 Bank Reconciliation & Repayment Status</h3>
                            ${renderReconciliationHTML()}
                        </div>
                    </div>
                    
                    <!-- ROW 2: Financial Awareness Handbook & Core Safety Flow -->
                    <div class="grid lg:grid-cols-2 gap-6 items-stretch border-t border-slate-200/60 pt-6">
                        <div class="flex flex-col space-y-3 h-full">
                            <h3 class="font-extrabold text-xs text-[#5B6472] uppercase tracking-wider">📚 Financial Awareness</h3>
                            <div id="financial-awareness-card" class="awareness-handbook-card p-5 bg-white flex flex-col justify-between flex-1"></div>
                        </div>
                        <div class="flex flex-col space-y-3 h-full">
                            <h3 class="font-extrabold text-xs text-[#5B6472] uppercase tracking-wider">🔒 Core Safety Flow</h3>
                            ${renderCoreMessageHTML()}
                        </div>
                    </div>
                </div>
                ` : ''}
            </section>

            ${tab === 'dashboard' ? `
            <!-- FIXED FLOATING COMPETITION DEMO MODE (Dashboard Only) -->
            <div class="competition-demo-fixed-container select-none">
                <!-- Floating Overlay Panel -->
                <div id="demo-overlay-panel" class="hidden rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden bg-[#0f172a] max-h-[520px] overflow-y-auto custom-scrollbar animate-fade-in-up">
                    <div class="px-4 py-3 border-b border-slate-700/50 flex justify-between items-center bg-slate-950">
                        <span class="font-extrabold text-xs uppercase tracking-wider text-slate-100">SELECT SIMULATION SCENARIO</span>
                        <button onclick="toggleDemoOverlay();" class="text-slate-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded hover:bg-slate-800">✕</button>
                    </div>
                    <div class="p-4 space-y-3">
                        ${renderCompetitionDemoModeHTML()}
                    </div>
                </div>

                <!-- Fixed Bottom-Right Closed Bar -->
                <div class="competition-demo-bar rounded-2xl border border-slate-700/60 shadow-2xl overflow-hidden bg-[#0f172a] cursor-pointer" onclick="toggleDemoOverlay();">
                    <div class="px-4 py-3 flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <span class="text-emerald-400 text-[10px] animate-pulse">●</span>
                            <span class="font-extrabold text-xs uppercase tracking-wider text-slate-100">COMPETITION DEMO MODE</span>
                        </div>
                        <span id="demo-toggle-arrow" class="text-slate-400 text-xs font-extrabold">▼</span>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    // Fill awareness content ONLY when on dashboard tab
    if (tab === 'dashboard') {
        renderFinancialAwareness();
        drawRiskChart();
        drawReconciliationChart();
    }
    
    initPremiumEffects();
}

function renderScenarioNotificationBanner() {
    const sc = appState.scenario;
    const paidCount = appState.members.filter(m => m.status === 'VERIFIED').length;
    const shortfall = (10 - paidCount) * 1000;

    const scenarios = {
        'A': {
            title: "✓ GROUP PAYMENTS ON TRACK",
            desc: "10 of 10 members have paid. ₹10,000 verified. No outstanding shortfall.",
            color: "border-l-[#15803D] bg-[#ECFDF3] text-[#15803D]"
        },
        'B': {
            title: "⚠ GROUP PAYMENT SHORTFALL",
            desc: `${paidCount} of 10 members have paid. ₹${shortfall.toLocaleString('en-IN')} pending.`,
            color: "border-l-[#D97706] bg-[#FFF7ED] text-[#D97706] animate-pulse-warning"
        },
        'C': {
            title: "🚨 CASH COLLECTION MISMATCH ALERT",
            desc: "Leader collected ₹2,000 cash from 2 members. Total ledger records ₹10,000, but actual bank account received only ₹8,000.",
            color: "border-l-[#DC2626] bg-[#FEF2F2] text-[#DC2626] animate-pulse-danger"
        },
        'D': {
            title: "📋 MAJOR TRANSACTION UNAWARE ALERT",
            desc: "A new bank loan of ₹3,0,000 was sanctioned. 3 members marked themselves as UNAWARE. Dispute raised.",
            color: "border-l-[#2563EB] bg-[#F8FAFC] text-[#2563EB]"
        },
        'E': {
            title: "⚠ UNUSUAL TRANSACTION ANOMALY ALERT",
            desc: "Leader entered an expense of ₹1,50,000. Risk Engine flagged it as anomalous size compared to previous logs.",
            color: "border-l-[#D97706] bg-[#FFF7ED] text-[#D97706]"
        }
    };
    
    const banner = scenarios[sc] || scenarios['A'];
    
    const myPayment = appState.members.find(m => m.id === appState.currentUser.id);
    const isPending = myPayment && myPayment.status === 'PENDING';
    const payBtnHTML = isPending ? `
        <button onclick="initiatePayment();" class="text-xs bg-[#E87545] text-white font-extrabold px-4 py-2.5 rounded-lg hover:bg-[#D66434] transition shrink-0 uppercase tracking-wider shadow-sm mr-2">
            💳 PAY CONTRIBUTION
        </button>
    ` : '';
    
    return `
        <div class="border-l-4 p-4 rounded-r-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 ${banner.color}">
            <div>
                <h4 class="font-extrabold text-sm sm:text-base tracking-tight">${banner.title}</h4>
                <p class="text-xs mt-1 opacity-90 max-w-3xl font-semibold leading-relaxed">${banner.desc}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                ${payBtnHTML}
                <button onclick="resetSystem();" class="text-xs bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 px-3.5 py-2 rounded-lg transition shadow-sm">
                    ↺ Reset Demo
                </button>
            </div>
        </div>
    `;
}

function renderRoleSpecificDashboard() {
    const role = (appState.currentUser && appState.currentUser.role) || 'MEMBER';
    if (role === 'LEADER') {
        return renderLeaderDashboardHTML();
    } else if (role === 'REVIEWER') {
        return renderReviewerDashboardHTML();
    } else {
        return renderMemberDashboardHTML();
    }
}

// --- MEMBER WORKFLOW VIEW ---

function getDemoState() {
    if (!appState.inDemoMode) {
        return appState;
    }
    
    const sc = appState.selectedDemoScenario || 'A';
    
    // Start with a copy of appState
    let state = JSON.parse(JSON.stringify(appState));
    state.scenario = sc;
    
    // Simulate members list (10 members)
    state.members = [
        { id: 1, username: 'lakshmi', full_name: 'Lakshmi Devi', role: 'MEMBER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 10:00:00', txn_id: 'TXN-SHG-DEMO-0001', is_cash_deposit: 0 },
        { id: 2, username: 'anitha', full_name: 'Anitha Kurma', role: 'MEMBER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 10:15:00', txn_id: 'TXN-SHG-DEMO-0002', is_cash_deposit: 0 },
        { id: 3, username: 'sujatha', full_name: 'Sujatha Rao', role: 'LEADER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 10:30:00', txn_id: 'TXN-SHG-DEMO-0003', is_cash_deposit: 0 },
        { id: 4, username: 'radha', full_name: 'Radha Murthy', role: 'MEMBER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 10:45:00', txn_id: 'TXN-SHG-DEMO-0004', is_cash_deposit: 0 },
        { id: 5, username: 'kavitha', full_name: 'Kavitha Reddy', role: 'MEMBER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 11:00:00', txn_id: 'TXN-SHG-DEMO-0005', is_cash_deposit: 0 },
        { id: 6, username: 'maya', full_name: 'Maya Sharma', role: 'MEMBER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 11:15:00', txn_id: 'TXN-SHG-DEMO-0006', is_cash_deposit: 0 },
        { id: 7, username: 'saroja', full_name: 'Saroja Naidu', role: 'MEMBER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 11:30:00', txn_id: 'TXN-SHG-DEMO-0007', is_cash_deposit: 0 },
        { id: 8, username: 'latha', full_name: 'Latha Mangal', role: 'MEMBER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 11:45:00', txn_id: 'TXN-SHG-DEMO-0008', is_cash_deposit: 0 },
        { id: 9, username: 'geetha', full_name: 'Geetha K.', role: 'MEMBER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 12:00:00', txn_id: 'TXN-SHG-DEMO-0009', is_cash_deposit: 0 },
        { id: 10, username: 'shanti', full_name: 'Shanti Priya', role: 'MEMBER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 12:15:00', txn_id: 'TXN-SHG-DEMO-0010', is_cash_deposit: 0 }
    ];
    
    // Simulate user logins
    if (sc === 'C') {
        state.currentUser = { id: 11, username: 'reviewer', full_name: 'Authorized Review Officer', role: 'REVIEWER' };
    } else if (sc === 'E') {
        state.currentUser = { id: 3, username: 'sujatha', full_name: 'Sujatha Rao', role: 'LEADER' };
    } else {
        state.currentUser = { id: 1, username: 'lakshmi', full_name: 'Lakshmi Devi', role: 'MEMBER' };
    }
    
    // Apply changes based on scenario
    if (sc === 'B') {
        // 8 of 10 Paid Shortfall
        state.members[0].status = 'PENDING';
        state.members[0].amount = 0.0;
        state.members[0].payment_date = null;
        state.members[0].txn_id = null;
        
        state.members[9].status = 'PENDING';
        state.members[9].amount = 0.0;
        state.members[9].payment_date = null;
        state.members[9].txn_id = null;
        
        state.riskScore = {
            score: 55,
            level: 'MEDIUM RISK',
            onTimeRate: 80.0,
            daysRemaining: 7,
            shortfall: 2000.0,
            reasons: ["Payment Shortfall of ₹2,000", "Approaching Bank Repayment Deadline (7 days left)"]
        };
        
        state.alerts = [
            { id: 1, type: 'WARNING', title: 'Payment Shortfall Detected', message: 'Group monthly repayment is ₹2,000 short. 8 of 10 members paid. Action required: review outstanding contributions.' }
        ];
        
        state.reconciliation = {
            expected: 10000.0,
            digital: 8000.0,
            cash: 0.0,
            bankReceived: 8000.0,
            ledgerBalance: 8000.0,
            mismatch: false,
            mismatchAmount: 0.0
        };
    } else if (sc === 'C') {
        // Leader Cash Mismatch
        state.members[8].is_cash_deposit = 1;
        state.members[8].txn_id = 'TXN-CASH-0009 [DEMO]';
        
        state.members[9].is_cash_deposit = 1;
        state.members[9].txn_id = 'TXN-CASH-0010 [DEMO]';
        
        state.riskScore = {
            score: 82,
            level: 'HIGH RISK',
            onTimeRate: 100.0,
            daysRemaining: 7,
            shortfall: 0.0,
            reasons: ["Active Bank Reconciliation Mismatch", "2 Cash deposits unverified in bank ledger"]
        };
        
        state.alerts = [
            { id: 2, type: 'CRITICAL', title: 'Cash Reconciliation Mismatch', message: 'Reported cash collections from Geetha K. & Shanti Priya (₹2,000) have not been deposited in bank. Mismatch detected.' }
        ];
        
        state.reconciliation = {
            expected: 10000.0,
            digital: 8000.0,
            cash: 2000.0,
            bankReceived: 8000.0,
            ledgerBalance: 10000.0,
            mismatch: true,
            mismatchAmount: 2000.0
        };
    } else if (sc === 'D') {
        // Unauthorized Loan Review
        state.loans.push({
            id: 2,
            bank_name: 'Andhra Bank',
            amount: 300000.0,
            purpose: 'Unauthorized Dairy Farm Loan',
            status: 'UNDER_REVIEW',
            sanctioned_date: '2026-08-08 10:00:00',
            amount_repaid: 0.0,
            verifications: [
                { username: 'radha', response: 'UNAWARE', reason: 'No discussion held' },
                { username: 'kavitha', response: 'UNAWARE', reason: 'Unaware of this loan' },
                { username: 'maya', response: 'UNAWARE', reason: 'Never signed for this' },
                { username: 'lakshmi', response: 'PENDING', reason: '' }
            ]
        });
        
        state.disputes = [
            { id: 1, transaction_type: 'LOAN', transaction_id: 2, member_name: 'Radha Murthy', reason: 'No group discussion held regarding Andhra Bank Loan.', status: 'PENDING' },
            { id: 2, transaction_type: 'LOAN', transaction_id: 2, member_name: 'Kavitha Reddy', reason: 'Unaware of dairy loan sanction.', status: 'PENDING' }
        ];
        
        state.riskScore = {
            score: 92,
            level: 'HIGH RISK',
            onTimeRate: 100.0,
            daysRemaining: 7,
            shortfall: 0.0,
            reasons: ["Unauthorized Loan Activity Flagged", "Multiple active member disputes open"]
        };
        
        state.alerts = [
            { id: 3, type: 'CRITICAL', title: 'Unauthorized Loan Activity', message: 'Andhra Bank loan (₹3,00,000) flagged by 3 members as UNAWARE of discussions. Disbursement locked.' }
        ];
        
        state.reconciliation = {
            expected: 10000.0,
            digital: 10000.0,
            cash: 0.0,
            bankReceived: 10000.0,
            ledgerBalance: 10000.0,
            mismatch: false,
            mismatchAmount: 0.0
        };
    } else if (sc === 'E') {
        // Large Expense Anomaly
        state.expenses.push({
            id: 3,
            amount: 150000.0,
            purpose: 'Bulk Sewing Machines (Anomalous Size)',
            status: 'PENDING',
            date: '2026-08-08 14:00:00',
            verifications: [
                { username: 'lakshmi', response: 'PENDING', reason: '' }
            ]
        });
        
        state.riskScore = {
            score: 78,
            level: 'HIGH RISK',
            onTimeRate: 100.0,
            daysRemaining: 7,
            shortfall: 0.0,
            reasons: ["Large Expense Anomaly Detected", "Expense draft of ₹1,50,000 is 10x average (₹13,750)"]
        };
        
        state.alerts = [
            { id: 4, type: 'WARNING', title: 'Large Expense Anomaly Flagged', message: 'Expense draft of ₹1,50,000 is 10x average. Requires awareness check from all members.' }
        ];
        
        state.reconciliation = {
            expected: 10000.0,
            digital: 10000.0,
            cash: 0.0,
            bankReceived: 10000.0,
            ledgerBalance: 10000.0,
            mismatch: false,
            mismatchAmount: 0.0
        };
    } else if (sc === 'F') {
        // Repayment Deadline Tomorrow
        state.members[0].status = 'PENDING';
        state.members[0].amount = 0.0;
        state.members[0].payment_date = null;
        state.members[0].txn_id = null;
        
        state.members[9].status = 'PENDING';
        state.members[9].amount = 0.0;
        state.members[9].payment_date = null;
        state.members[9].txn_id = null;
        
        state.riskScore = {
            score: 45,
            level: 'MEDIUM RISK',
            onTimeRate: 80.0,
            daysRemaining: 1,
            shortfall: 2000.0,
            reasons: ["Repayment Deadline is TOMORROW", "Contribution Shortfall of ₹2,000"]
        };
        
        state.alerts = [
            { id: 5, type: 'CRITICAL', title: 'Repayment Deadline Tomorrow', message: 'Bank repayment deadline is TOMORROW. ₹2,000 shortfall must be covered immediately.' }
        ];
        
        state.reconciliation = {
            expected: 10000.0,
            digital: 8000.0,
            cash: 0.0,
            bankReceived: 8000.0,
            ledgerBalance: 8000.0,
            mismatch: false,
            mismatchAmount: 0.0
        };
    } else {
        // Scenario A
        state.riskScore = {
            score: 15,
            level: 'LOW RISK',
            onTimeRate: 100.0,
            daysRemaining: 5,
            shortfall: 0.0,
            reasons: []
        };
        state.alerts = [];
        state.reconciliation = {
            expected: 10000.0,
            digital: 10000.0,
            cash: 0.0,
            bankReceived: 10000.0,
            ledgerBalance: 10000.0,
            mismatch: false,
            mismatchAmount: 0.0
        };
    }
    
    return state;
}

function renderMemberDashboardHTML() {
    const state = appState;
    const myUser = state.currentUser || { id: 1, username: 'lakshmi', full_name: 'Lakshmi Devi', role: 'MEMBER' };
    const myPayment = (state.members || []).find(m => m.username === myUser.username || m.id === myUser.id);
    const paymentStatus = myPayment && myPayment.status === 'VERIFIED';
    
    const paidCount = (state.members || []).filter(m => m.status === 'VERIFIED').length;
    const alertCount = (state.alerts || []).length;
    const score = (state.riskScore && state.riskScore.score) || (paidCount < 10 ? 55 : 15);
    
    let progressColor = "bg-[#E87545]";
    if (paidCount <= 8) {
        progressColor = "bg-[#D97706]";
    } else if (paidCount === 9) {
        progressColor = "bg-[#16A34A]";
    } else if (paidCount >= 10) {
        progressColor = "bg-[#16A34A]";
    }
    
    // Check if there are active loans requiring member verifications/votes
    let verificationsHTML = '';
    
    // Check loans
    (state.loans || []).forEach(loan => {
        const myVote = (loan.verifications || []).find(v => v.username === myUser.username);
        if (loan.status === 'UNDER_REVIEW' || loan.status === 'PENDING_VERIFICATION') {
            const hasVoted = myVote && myVote.response !== 'PENDING';
            let voteSummary = '';
            if (loan.verifications && loan.verifications.length > 0) {
                const unauthCount = loan.verifications.filter(v => v.response === 'UNAWARE' || v.response === 'DISPUTED').length;
                const awareCount = loan.verifications.filter(v => v.response === 'AWARE' || v.response === 'APPROVED').length;
                voteSummary = `
                    <div class="mt-2 flex gap-3 text-[10px]">
                        <span class="text-emerald-600 font-extrabold">✓ ${awareCount} Aware</span>
                        <span class="text-red-600 font-extrabold">⚠ ${unauthCount} Unaware/Disputed</span>
                    </div>
                `;
            }
            
            verificationsHTML += `
                <div class="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2 accent-danger">
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="text-[9px] font-black text-red-600 uppercase tracking-wider block">🚨 Unauthorized Loan Detected</span>
                            <h4 class="font-extrabold text-xs text-slate-800 mt-1">${loan.bank_name} - ₹${loan.amount.toLocaleString('en-IN')}</h4>
                            <p class="text-[10px] text-slate-500 mt-0.5">${loan.purpose}</p>
                            ${voteSummary}
                        </div>
                        ${hasVoted ? `
                            <span class="text-[10px] text-slate-400 font-bold italic">Vote Cast: ${myVote.response}</span>
                        ` : `
                            <div class="flex gap-1.5 shrink-0">
                                <button onclick="castLoanVote(${loan.id}, 'AWARE');" class="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-[9px] px-2.5 py-1 rounded transition uppercase tracking-wider">AWARE</button>
                                <button onclick="castLoanVote(${loan.id}, 'UNAWARE');" class="bg-red-700 hover:bg-red-800 text-white font-bold text-[9px] px-2.5 py-1 rounded transition uppercase tracking-wider">UNAWARE</button>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }
    });

    // Check expenses
    (state.expenses || []).forEach(exp => {
        const myVote = (exp.verifications || []).find(v => v.username === myUser.username);
        if (exp.status === 'PENDING' || exp.status === 'UNDER_REVIEW') {
            const hasVoted = myVote && myVote.response !== 'PENDING';
            
            verificationsHTML += `
                <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 accent-alerts">
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="text-[9px] font-black text-amber-700 uppercase tracking-wider block">⚠️ Unusual Group Expense Flagged</span>
                            <h4 class="font-extrabold text-xs text-slate-800 mt-1">₹${exp.amount.toLocaleString('en-IN')} - ${exp.purpose}</h4>
                            <p class="text-[10px] text-slate-500 mt-0.5">Logged on ${exp.date}</p>
                        </div>
                        ${hasVoted ? `
                            <span class="text-[10px] text-slate-400 font-bold italic">Vote Cast: ${myVote.response}</span>
                        ` : `
                            <div class="flex gap-1.5 shrink-0">
                                <button onclick="castExpenseVote(${exp.id}, 'APPROVED');" class="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-[9px] px-2.5 py-1 rounded transition uppercase tracking-wider">APPROVE</button>
                                <button onclick="castExpenseVote(${exp.id}, 'DISPUTED');" class="bg-red-700 hover:bg-red-800 text-white font-bold text-[9px] px-2.5 py-1 rounded transition uppercase tracking-wider">DISPUTE</button>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }
    });

    // Generate transaction list for recent transactions panel
    let txs = [];
    
    // Member contributions
    (state.members || []).forEach(m => {
        const isVerified = m.status === 'VERIFIED';
        const isCash = m.is_cash_deposit === 1 || m.method === 'CASH';
        const isMySelf = myUser && (m.username === myUser.username || m.id === myUser.id);
        
        if (isVerified || isMySelf) {
            txs.push({
                date: m.payment_date || 'Pending',
                txnId: m.txn_id || (isVerified ? `TXN-SHG-2026-${(m.id || 1).toString().padStart(4, '0')}` : `PEND-SHG-${(m.username || 'MEMBER').toUpperCase()}`),
                type: isCash ? 'Contribution (Cash)' : 'Contribution (Digital)',
                amount: m.amount || 1000.0,
                desc: `${m.full_name} August contribution`,
                status: m.status || 'PENDING',
                risk: isCash ? 'Suspicious' : 'Safe'
            });
        }
    });

    // Add general expenses and loans to transactions list
    state.expenses.forEach(exp => {
        let riskLabel = 'Safe';
        if (exp.amount > 50000) riskLabel = 'Suspicious';
        txs.push({
            date: exp.date,
            txnId: `EXP-00${exp.id}`,
            type: 'Group Expense',
            amount: exp.amount,
            desc: exp.purpose,
            status: exp.status,
            risk: riskLabel
        });
    });
    
    state.loans.forEach(loan => {
        if (loan.id === 2) {
            txs.push({
                date: loan.sanctioned_date,
                txnId: `LOAN-002`,
                type: 'External Loan',
                amount: loan.amount,
                desc: loan.purpose,
                status: loan.status,
                risk: 'Critical'
            });
        }
    });

    txs.sort((a, b) => new Date(b.date === 'Pending' ? '9999-12-31' : b.date) - new Date(a.date === 'Pending' ? '9999-12-31' : a.date));

    const dashboardTxs = txs.slice(0, 5); // display top 5
    const txRows = dashboardTxs.map(tx => {
        const isVerified = tx.status === 'VERIFIED' || tx.status === 'APPROVED';
        const riskColor = tx.risk === 'Safe' ? 'text-[#168A4A]' : tx.risk === 'Suspicious' ? 'text-[#C77700]' : 'text-[#C62828]';
        const riskBadge = tx.risk === 'Safe' ? '🟢 Safe' : tx.risk === 'Suspicious' ? '🟡 Susp' : '🔴 Fraud';
        const hasDate = tx.date && tx.date !== 'Pending';
        const dateText = hasDate ? tx.date.split(' ')[0] : 'Pending';
        const dateClass = hasDate ? 'text-[#333F53]' : 'text-[#D97706] font-bold';
        
        return `
            <tr class="hover:bg-slate-50/50 transition border-b border-slate-100 cursor-pointer" onclick="showReceipt({
                shgName: '${getSHGName()}',
                memberName: '${myUser.full_name}',
                amount: ${tx.amount},
                purpose: '${tx.desc}',
                date: '${tx.date}',
                txnId: '${tx.txnId}',
                status: '${tx.status}',
                message: 'Recorded transaction verified in group ledger.'
            });">
                <td class="px-3 py-2 text-xs font-mono ${dateClass}">${dateText}</td>
                <td class="px-3 py-2 font-mono text-[10px] text-[#5B6472] font-bold">${tx.txnId}</td>
                <td class="px-3 py-2 text-xs font-bold text-[#18233A]">${tx.type}</td>
                <td class="px-3 py-2 text-xs font-extrabold text-[#18233A]">₹${tx.amount.toLocaleString('en-IN')}</td>
                <td class="px-3 py-2">
                    <span class="status-pill text-[9px] px-1.5 py-0.5 rounded-full ${isVerified ? 'status-verified' : 'status-pending'}">
                        ${isVerified ? '✓ PAID' : 'PEND'}
                    </span>
                </td>
                <td class="px-3 py-2 text-xs font-extrabold ${riskColor}">${riskBadge}</td>
            </tr>
        `;
    }).join('');

    const memberRows = state.members.map((m, idx) => {
        const isPaid = m.status === 'VERIFIED';
        const hasDate = m.payment_date && m.payment_date !== 'Pending';
        const dateText = hasDate ? m.payment_date.split(' ')[0] : 'Pending';
        const dateClass = hasDate ? 'text-[#333F53]' : 'text-[#D97706] font-bold';
        
        return `
            <tr class="hover:bg-slate-50/50 transition border-b border-slate-100">
                <td class="px-3 py-2 text-xs font-medium text-[#18233A]">${m.full_name}</td>
                <td class="px-3 py-2 text-[10px] font-mono text-[#5B6472] font-bold">SHG001-M${(idx + 1).toString().padStart(2, '0')}</td>
                <td class="px-3 py-2 text-xs font-bold text-[#18233A]">₹${m.amount ? m.amount.toLocaleString('en-IN') : '1,000'}</td>
                <td class="px-3 py-2">
                    <span class="status-pill text-[9px] px-1.5 py-0.5 rounded-full ${isPaid ? 'status-verified' : 'status-pending'}">
                        ${isPaid ? '✓ PAID' : 'PEND'}
                    </span>
                </td>
                <td class="px-3 py-2 text-xs font-mono ${dateClass}">${dateText}</td>
            </tr>
        `;
    }).join('');

    return `
        <div class="space-y-6">
            <!-- Greeting and SHG Info Row -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 welcome-card-gradient text-white p-6 rounded-2xl relative overflow-hidden">
                <div class="absolute -right-16 -top-16 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl"></div>
                <div>
                    <span class="auth-header-tag text-[10px] font-extrabold text-[#E87545] uppercase tracking-widest block mb-1">Authenticated Session</span>
                    <h2 class="text-2xl font-black text-white leading-tight" style="color: #FFFFFF !important;">Welcome, ${myUser.full_name}</h2>
                    <p class="text-xs font-semibold mt-1" style="color: #CBD5E1 !important;">Group: <span class="font-bold" style="color: #FFFFFF !important;">${getSHGName()}</span> • ID Code: <span class="font-bold" style="color: #FFFFFF !important;">${myUser.member_id_code || 'SHG001-M01'}</span></p>
                </div>
                
                <div class="flex gap-2 items-center">
                    ${verificationsHTML ? `
                        <span class="border border-red-500 bg-red-950/60 text-red-400 font-black text-[9px] px-2.5 py-1.5 rounded-lg tracking-wider uppercase animate-pulse">
                            ⚠️ ACTION REQUIRED
                        </span>
                    ` : ''}
                    <span class="active-member-translucent-badge font-black text-[10px] px-3 py-1.5 rounded-lg tracking-wider uppercase" style="color: #18233A !important; background-color: #FFFFFF !important;">
                        Active Member
                    </span>
                </div>
            </div>

            <!-- Top Row: Horizontal Grid of 5 Summary Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <!-- Card 1: My Contribution Status -->
                <div class="glass-panel p-4 flex flex-col justify-between accent-my rounded-xl border border-slate-205 bg-white relative overflow-hidden">
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">💳 My Contribution Status</span>
                    <div class="flex flex-wrap items-center gap-1.5 mt-2">
                        <span class="text-lg xl:text-xl font-black text-slate-800 whitespace-nowrap shrink-0">₹1,000.00</span>
                        ${paymentStatus ? `
                            <span class="status-pill text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold uppercase shrink-0">
                                ✓ Verified
                            </span>
                        ` : `
                            <span class="status-pill text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap bg-amber-100 text-amber-800 border border-amber-300 font-extrabold uppercase shrink-0 animate-pulse">
                                ⏰ Pending
                            </span>
                        `}
                    </div>
                    ${paymentStatus ? `
                        <button onclick="showReceipt({
                            shgName: '${getSHGName()}',
                            memberName: '${myUser.full_name}',
                            amount: 1000.00,
                            purpose: 'August Monthly Contribution Dues',
                            date: '${myPayment && myPayment.payment_date ? myPayment.payment_date : new Date().toISOString().split('T')[0]}',
                            txnId: '${myPayment && myPayment.txn_id ? myPayment.txn_id : 'TXN-SHG-2026-0001'}',
                            status: 'VERIFIED',
                            message: 'Payment successfully recorded in SHG financial ledger.'
                        });" class="mt-3 text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 rounded transition text-center uppercase tracking-wider w-full">
                            Receipt
                        </button>
                    ` : `
                        <button id="dashboard-pay-btn" onclick="initiatePayment();" class="mt-3 bg-[#E87545] hover:bg-[#D66434] text-white font-extrabold text-[9px] py-1.5 rounded transition shadow-sm w-full uppercase tracking-wider">
                            Pay
                        </button>
                    `}
                </div>

                <!-- Card 2: Group Contribution -->
                <div class="glass-panel p-4 flex flex-col justify-between accent-group rounded-xl border border-slate-202 bg-white">
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">👥 Group Contribution</span>
                    <div class="flex justify-between items-baseline mt-2">
                        <span class="text-lg xl:text-xl font-black text-slate-800">${paidCount}/10 Paid</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-1.5 mt-2.5">
                        <div class="${progressColor} h-1.5 rounded-full transition-all duration-500" style="width: ${paidCount * 10}%"></div>
                    </div>
                    <div class="flex justify-between text-[8px] font-bold mt-2 text-slate-500">
                        <span>Exp: ₹10k</span>
                        <span class="text-amber-700">Pend: ₹${((10 - paidCount) * 1000).toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <!-- Card 3: Payment History -->
                <div class="glass-panel p-4 flex flex-col justify-between rounded-xl border border-slate-202 bg-white">
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">📋 Last Repayment</span>
                    <div class="mt-2">
                        <span class="text-lg xl:text-xl font-black text-slate-800">₹1,000</span>
                        <p class="text-[8px] text-slate-400 mt-1 font-mono truncate">${myPayment && myPayment.payment_date ? 'Verified ' + myPayment.payment_date.split(' ')[0] : 'No recent payments'}</p>
                    </div>
                    <button onclick="appState.activeTab = 'transactions'; renderApp();" class="mt-3 text-[9px] bg-slate-50 hover:bg-slate-100 text-slate-650 font-bold py-1.5 rounded border border-slate-202 transition text-center w-full">
                        History
                    </button>
                </div>

                <!-- Card 4: Financial Health -->
                <div onclick="appState.activeTab = 'security'; renderApp();" class="glass-panel p-4 border border-slate-202 transition cursor-pointer bg-white flex flex-col justify-between rounded-xl">
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">🛡️ Risk Score</span>
                    <div class="flex justify-between items-baseline mt-2">
                        <span class="text-lg xl:text-xl font-black text-slate-800">${score}/100</span>
                    </div>
                    <p class="text-[8px] text-slate-450 mt-2 font-bold uppercase tracking-wider ${score < 50 ? 'text-emerald-700' : score < 80 ? 'text-amber-700' : 'text-red-700'}">${state.riskScore.level}</p>
                </div>

                <!-- Card 5: Alerts -->
                <div onclick="appState.activeTab = 'alerts'; renderApp();" class="glass-panel p-4 border border-slate-202 transition cursor-pointer bg-slate-50/50 flex flex-col justify-between rounded-xl">
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">🚨 Alerts</span>
                    <div class="flex justify-between items-baseline mt-2">
                        <span class="text-lg xl:text-xl font-black text-slate-800">${alertCount} Active</span>
                    </div>
                    <p class="text-[8px] text-slate-400 mt-2 font-bold">${alertCount > 0 ? '⚠️ AT RISK' : '🟢 SYSTEM SAFE'}</p>
                </div>
            </div>

            <!-- Bottom Row: Recent Transactions and Member Directory stacked vertically -->
            <div class="grid grid-cols-1 gap-6">
                <!-- Recent Transactions -->
                <div class="glass-panel p-5 bg-white border border-slate-202 rounded-2xl shadow-sm">
                    <div>
                        <div class="flex justify-between items-center mb-3">
                            <h3 class="font-extrabold text-xs text-slate-800 tracking-wider uppercase">📊 Recent Ledger Transactions</h3>
                            <button onclick="appState.activeTab = 'transactions'; renderApp();" class="text-[9px] font-extrabold text-[#E87545] uppercase hover:underline">Full Passbook →</button>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-slate-50 text-[9px] font-black text-slate-400 uppercase border-b border-slate-200">
                                        <th class="px-3 py-2">Date</th>
                                        <th class="px-3 py-2">Txn ID</th>
                                        <th class="px-3 py-2">Type</th>
                                        <th class="px-3 py-2">Amount</th>
                                        <th class="px-3 py-2">Status</th>
                                        <th class="px-3 py-2">Risk</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${txRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- My SHG Summary -->
                <div class="glass-panel p-5 bg-white border border-slate-202 rounded-2xl flex flex-col justify-between shadow-sm">
                    <div>
                        <div class="flex justify-between items-center mb-3">
                            <h3 class="font-extrabold text-xs text-slate-800 tracking-wider uppercase">👥 Group Member Dues</h3>
                            <button onclick="appState.activeTab = 'shg'; renderApp();" class="text-[9px] font-extrabold text-[#E87545] uppercase hover:underline">View Directory →</button>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-slate-50 text-[9px] font-black text-slate-400 uppercase border-b border-slate-200">
                                        <th class="px-3 py-2">Member Name</th>
                                        <th class="px-3 py-2">Member ID</th>
                                        <th class="px-3 py-2">Amount</th>
                                        <th class="px-3 py-2">Status</th>
                                        <th class="px-3 py-2">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${memberRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Member verification alerts box -->
            ${verificationsHTML ? `
                <div class="space-y-4">
                    <h3 class="font-extrabold text-slate-800 text-sm tracking-wider uppercase">⚠️ Important Approvals & Voting</h3>
                    ${verificationsHTML}
                </div>
            ` : ''}
        </div>
    `;
}



// --- LEADER WORKFLOW VIEW ---
function renderLeaderDashboardHTML() {
    const listItems = appState.members.map(m => {
        const isPaid = m.status === 'VERIFIED';
        return `
            <tr class="hover:bg-slate-50/50 transition">
                <td class="px-4 py-3 text-xs font-bold text-slate-800">${m.full_name}</td>
                <td class="px-4 py-3 text-[10px] font-mono text-slate-500">${m.username === 'sujatha' ? 'SHG001-M03' : 'SHG001-M' + (appState.members.indexOf(m) + 1).toString().padStart(2, '0')}</td>
                <td class="px-4 py-3 text-xs font-semibold text-slate-700">₹${m.amount ? m.amount.toLocaleString('en-IN') : '1,000'}</td>
                <td class="px-4 py-3">
                    <span class="status-pill ${isPaid ? 'status-verified' : 'status-pending'}">
                        ${isPaid ? '✓ PAID' : '⏰ PENDING'}
                    </span>
                </td>
                <td class="px-4 py-3 text-xs text-slate-500">${m.payment_date || '-'}</td>
                <td class="px-4 py-3 font-mono text-[10px]">${m.txn_id ? `<span class="bg-slate-100 px-1 rounded">${m.txn_id}</span>` : '-'}</td>
            </tr>
        `;
    }).join('');

    return `
        <div class="glass-panel p-8 rounded-2xl border border-slate-200 space-y-6">
            <div class="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-5">
                <div>
                    <h2 class="font-extrabold text-2xl text-emerald-950">Leader Management Panel</h2>
                    <p class="text-xs text-slate-500 mt-1">Sujatha Rao (Group Leader) | Mahila Jyothi SHG</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="openExpenseModal();" class="bg-[#E87545] hover:bg-[#D66434] text-white font-bold text-xs py-2 px-3 rounded-lg transition flex items-center gap-1 shadow-sm">
                        ➕ Log Expense
                    </button>
                </div>
            </div>
            
            <!-- Member contribution table -->
            <div class="space-y-3">
                <h3 class="font-bold text-sm text-slate-800 tracking-wider uppercase">Member Contribution Board</h3>
                <div class="overflow-x-auto border border-slate-150 rounded-xl bg-white shadow-sm">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-150">
                                <th class="px-4 py-2.5">Member Name</th>
                                <th class="px-4 py-2.5">ID Code</th>
                                <th class="px-4 py-2.5">Amount</th>
                                <th class="px-4 py-2.5">Status</th>
                                <th class="px-4 py-2.5">Date</th>
                                <th class="px-4 py-2.5">Transaction Ref</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${listItems}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Audit Log header inside Leader View -->
            <div class="space-y-3">
                <h3 class="font-bold text-sm text-slate-800 tracking-wider uppercase">🔒 Group Audit Trail (Platform Logs)</h3>
                <div class="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-4 space-y-2">
                    ${appState.auditLogs.map(log => `
                        <div class="text-[11px] text-slate-600 flex flex-wrap justify-between gap-1 border-b border-slate-200/50 pb-1.5 last:border-0 last:pb-0">
                            <span>
                                <span class="text-slate-400 font-mono">${log.timestamp.split(' ')[1] || log.timestamp}</span> 
                                <strong class="text-slate-700">${log.username}</strong> 
                                <span class="bg-slate-200 px-1 py-0.5 rounded text-[8px] font-bold text-slate-500 uppercase">${log.role}</span>:
                                ${log.action} - ${log.details}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// --- AUTHORIZED REVIEWER WORKFLOW VIEW ---
function renderReviewerDashboardHTML() {
    const listDisputes = appState.disputes.map(d => {
        const isResolved = d.status === 'RESOLVED';
        return `
            <div class="border rounded-xl p-4 space-y-3 bg-white ${isResolved ? 'opacity-60' : 'border-purple-200'}">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="bg-purple-100 text-purple-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">${d.transaction_type} DISPUTE</span>
                        <h4 class="font-extrabold text-sm text-slate-800 mt-1">Dispute: DISP-${d.id.toString().padStart(4, '0')}</h4>
                        <p class="text-[10px] text-slate-400 mt-0.5">Raised by: ${d.full_name} (${d.username}) | Date: ${d.created_at}</p>
                    </div>
                    <span class="status-pill ${isResolved ? 'status-verified' : 'status-review'}">
                        ${d.status}
                    </span>
                </div>
                <div class="bg-slate-50 p-3 rounded-lg border text-xs text-slate-600">
                    <strong>Reason Filed:</strong> "${d.reason}"
                </div>
                
                ${isResolved ? '' : `
                    <div class="flex gap-2 justify-end">
                        <button onclick="resolveDispute('DISP-${d.id.toString().padStart(4, '0')}', 'APPROVED');" class="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-[10px] px-3 py-1.5 rounded-md transition">
                            ✓ Approve Transaction
                        </button>
                        <button onclick="resolveDispute('DISP-${d.id.toString().padStart(4, '0')}', 'CANCELLED');" class="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-md transition">
                            ✗ Cancel Transaction
                        </button>
                    </div>
                `}
            </div>
        `;
    }).join('') || '<div class="text-center text-xs text-slate-400 py-6">No open disputes reported in monitoring registry.</div>';

    return `
        <div class="glass-panel p-8 rounded-2xl border border-slate-200 space-y-6">
            <div class="border-b border-slate-100 pb-5">
                <h2 class="font-extrabold text-2xl text-emerald-950">Authorized Review Registry</h2>
                <p class="text-xs text-slate-500 mt-1">FinTech Platform Audit Officer Panel (SBI & AP-State Gov Monitored)</p>
            </div>
            
<!-- Aggregated Monitoring Stats (Simulated) -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="glass-panel tilt-card p-4 shadow-sm text-center" style="border-top: 3px solid #2563EB !important; border-radius:14px !important;">
                    <span class="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">SHGs Monitored</span>
                    <span class="text-2xl font-black text-slate-800 mt-1 block" data-count-to="125">125</span>
                </div>
                <div class="glass-panel tilt-card p-4 shadow-sm text-center" style="border-top: 3px solid #D97706 !important; border-radius:14px !important;">
                    <span class="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Active Shortfalls</span>
                    <span class="text-2xl font-black text-amber-600 mt-1 block" data-count-to="${appState.scenario === 'B' || appState.scenario === 'F' ? '13' : '12'}">${appState.scenario === 'B' || appState.scenario === 'F' ? '13' : '12'}</span>
                </div>
                <div class="glass-panel tilt-card p-4 shadow-sm text-center" style="border-top: 3px solid #DC2626 !important; border-radius:14px !important;">
                    <span class="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Open Disputes</span>
                    <span class="text-2xl font-black text-red-600 mt-1 block" data-count-to="${appState.disputes.filter(d => d.status === 'OPEN').length}">${appState.disputes.filter(d => d.status === 'OPEN').length}</span>
                </div>
                <div class="glass-panel tilt-card p-4 shadow-sm text-center" style="border-top: 3px solid #DC2626 !important; border-radius:14px !important;">
                    <span class="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Mismatches</span>
                    <span class="text-2xl font-black text-red-600 mt-1 block" data-count-to="${appState.reconciliation.mismatch ? '1' : '0'}">${appState.reconciliation.mismatch ? '1' : '0'}</span>
                </div>
            </div>
            
            <!-- Dispute Registry List -->
            <div class="space-y-4">
                <h3 class="font-bold text-sm text-slate-800 tracking-wider uppercase">Active Disputes & Concerns Registry</h3>
                <div class="space-y-3 max-h-96 overflow-y-auto pr-1">
                    ${listDisputes}
                </div>
            </div>
        </div>
    `;
}

// --- SYSTEM ADMIN WORKFLOW VIEW ---
function renderAdminDashboardHTML() {
    return `
        <div class="glass-panel p-8 rounded-2xl border border-slate-200 space-y-6">
            <div class="border-b border-slate-100 pb-5">
                <h2 class="font-extrabold text-2xl text-emerald-950">System Configuration Dashboard</h2>
                <p class="text-xs text-slate-500 mt-1">Maintain configurations, seed databases, and review live processes.</p>
            </div>
            
            <div class="grid sm:grid-cols-2 gap-6">
                <!-- DB Setup Panel -->
                <div class="border border-slate-200 rounded-xl p-5 space-y-4 bg-white">
                    <h4 class="font-bold text-sm text-slate-800 uppercase tracking-wider">Database Operations</h4>
                    <p class="text-xs text-slate-500">Trigger database re-seeding manually or purge logs for testing.</p>
                    <div class="flex flex-wrap gap-2">
                        <button onclick="resetSystem();" class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-2 rounded-lg transition">
                            PURGE & RESET DB
                        </button>
                    </div>
                </div>
                
                <!-- System Configs -->
                <div class="border border-slate-200 rounded-xl p-5 space-y-4 bg-white">
                    <h4 class="font-bold text-sm text-slate-800 uppercase tracking-wider">Simulated Bank Accounts</h4>
                    <p class="text-xs text-slate-500">Configure simulated bank credentials and reconciliation API targets.</p>
                    <div class="text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-lg space-y-1">
                        <div>Reconciliation Interval: <span class="font-bold text-emerald-700">Real-time (On Event)</span></div>
                        <div>Bank Endpoint: <span class="font-bold text-emerald-700">https://api.sbi.demo/shg/v1/recon</span></div>
                        <div>Audit Integrity: <span class="font-bold text-emerald-700">SHA-256 Chain Signed</span></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- SHARED UI MODULES ---

function renderPassbookHTML() {
    const sc = appState.scenario;
    
    let shgLoanStatus = "VERIFIED";
    if (sc === 'D' || sc === 'B' || sc === 'F') {
        shgLoanStatus = "VERIFICATION REQUIRED";
    }
    
    let transactions = [
        {
            date: '2026-08-08',
            description: 'SHG Loan',
            category: 'Loans',
            amount: 300000.00,
            isCredit: true,
            status: shgLoanStatus
        },
        {
            date: '2026-08-07',
            description: 'Monthly Contribution',
            category: 'Savings',
            amount: 1000.00,
            isCredit: true,
            status: 'VERIFIED'
        },
        {
            date: '2026-08-06',
            description: 'Business Expense',
            category: 'Expenses',
            amount: 25000.00,
            isCredit: false,
            status: 'VERIFIED'
        },
        {
            date: '2026-06-15',
            description: 'Loan Repayment',
            category: 'Repayments',
            amount: 15000.00,
            isCredit: false,
            status: 'VERIFIED'
        }
    ];

    // Sort transactions by date descending
    transactions.sort((a,b) => new Date(b.date) - new Date(a.date));
    
    // Render list
    const passbookItems = transactions.map(t => {
        let statusBadge = '';
        if (t.status === 'VERIFIED') {
            statusBadge = '<span class="status-pill bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase">VERIFIED</span>';
        } else if (t.status === 'VERIFICATION REQUIRED') {
            statusBadge = '<span class="status-pill bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase animate-pulse">VERIFICATION REQUIRED</span>';
        } else {
            statusBadge = `<span class="status-pill bg-slate-100 text-slate-800 border border-slate-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase">${t.status}</span>`;
        }

        return `
            <tr class="hover:bg-slate-50 transition border-b last:border-0 border-slate-100">
                <td class="px-4 py-3 text-xs font-semibold text-slate-500">${t.date}</td>
                <td class="px-4 py-3 text-xs font-bold text-slate-800">${t.description}</td>
                <td class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">${t.category}</td>
                <td class="px-4 py-3 text-xs font-extrabold ${t.isCredit ? 'text-emerald-700' : 'text-red-600'}">
                    ${t.isCredit ? '+' : '-'} ₹${t.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                </td>
                <td class="px-4 py-3 text-right">${statusBadge}</td>
            </tr>
        `;
    }).join('');

    return `
        <div class="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4 bg-white">
            <div class="flex flex-wrap justify-between items-center gap-3 border-b pb-4 border-slate-100">
                <div>
                    <h3 class="font-extrabold text-lg text-emerald-950">📚 Recent Transactions</h3>
                    <p class="text-xs text-slate-500 mt-0.5">Real-time ledger transparency of bank accounts and group assets.</p>
                </div>
                <div class="flex items-center gap-2">
                    <input type="text" id="passbook-search" oninput="filterPassbookTable(this.value);" placeholder="Search transactions..." class="bg-white border text-xs font-semibold py-1.5 px-3 rounded-lg focus:outline-none focus:border-emerald-800 max-w-44 shadow-sm" />
                </div>
            </div>
            
            <div class="overflow-x-auto rounded-xl border border-slate-150 bg-white">
                <table class="w-full text-left border-collapse" id="passbook-table">
                    <thead>
                        <tr class="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase border-b">
                            <th class="px-4 py-2.5">Date</th>
                            <th class="px-4 py-2.5">Description</th>
                            <th class="px-4 py-2.5">Category</th>
                            <th class="px-4 py-2.5">Amount</th>
                            <th class="px-4 py-2.5 text-right">Verification</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${passbookItems || '<tr><td colspan="5" class="text-center py-6 text-xs text-slate-400">No transactions recorded in passbook.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function filterPassbookTable(query) {
    const table = document.getElementById('passbook-table');
    const rows = table.getElementsByTagName('tr');
    const lowerQuery = query.toLowerCase();
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.getElementsByTagName('td');
        let match = false;
        
        for (let j = 0; j < cells.length; j++) {
            if (cells[j].innerText.toLowerCase().includes(lowerQuery)) {
                match = true;
                break;
            }
        }
        
        if (match) row.style.display = '';
        else row.style.display = 'none';
    }
}



function renderRiskGaugeHTML() {
    const rs = appState.riskScore;
    const levelColors = {
        'LOW RISK': 'text-[#15803D] bg-[#ECFDF3] border-[#D1F7C4]',
        'MEDIUM RISK': 'text-[#D97706] bg-[#FFF7ED] border-[#FED7AA] animate-pulse-warning',
        'HIGH RISK': 'text-[#DC2626] bg-[#FEF2F2] border-[#FEE2E2] animate-pulse-danger',
        'URGENT': 'text-[#DC2626] bg-[#FEF2F2] border-[#FEE2E2] font-black animate-pulse'
    };
    
    const badgeColor = levelColors[rs.level] || 'text-slate-700 bg-slate-50 border-slate-100';
    
    // Dynamic score color for SVG circle path
    let scoreColor = 'text-[#15803D]'; // Green
    if (rs.level === 'MEDIUM RISK') {
        scoreColor = 'text-[#D97706]'; // Amber
    } else if (rs.level === 'HIGH RISK' || rs.level === 'URGENT') {
        scoreColor = 'text-[#DC2626]'; // Red
    }
    
    // Explanation text based on shortfall
    const paidCount = appState.members.filter(m => m.status === 'VERIFIED').length;
    const shortfall = (10 - paidCount) * 1000;
    const explanation = shortfall > 0 
        ? "Risk increases because the group has an outstanding contribution shortfall."
        : "Group repayment risk is low because all contributions are verified and on time.";

    return `
        <div class="glass-panel tilt-card p-5 rounded-2xl border border-slate-200 space-y-3 bg-white accent-health flex flex-col justify-between flex-1">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5"><span class="icon-container bg-[#F8FAFC] text-[#2563EB]">🛡️</span> Financial Health</span>
                <span class="border px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider ${badgeColor}">${rs.level}</span>
            </div>
            
            <div class="flex items-center gap-5 py-1">
                <!-- Circular Score Gauge -->
                <div class="w-16 h-16 shrink-0 relative flex items-center justify-center risk-gauge-container">
                    <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path class="text-slate-100" stroke-width="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path class="${scoreColor} risk-gauge-arc" style="animation: sweepArc 1.5s cubic-bezier(0.4,0,0.2,1) forwards;" stroke-dasharray="${rs.score}, 100" stroke-width="3.5" stroke-linecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div class="absolute text-center flex flex-col">
                        <span class="text-sm font-black text-slate-800 leading-none risk-score-number" data-count-to="${rs.score}">${rs.score}</span>
                        <span class="text-[8px] text-slate-400 font-bold">/100</span>
                    </div>
                </div>
                
                <div class="flex-grow grid grid-cols-1 gap-1.5">
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-slate-500 font-medium">Payment Completion:</span>
                        <span class="font-bold text-slate-800">${rs.onTimeRate.toFixed(0)}%</span>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-slate-500 font-medium">Bank Reconciliation:</span>
                        <span class="font-bold ${rs.bankReconciliation === 'VERIFIED' ? 'text-emerald-700' : 'text-red-650'}">${rs.bankReconciliation}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-slate-500 font-medium">Days to Deadline:</span>
                        <span class="font-bold text-slate-800">${rs.daysRemaining} days</span>
                    </div>
                </div>
            </div>
            
            <p class="text-[10px] text-slate-500 font-medium border-t border-slate-100 pt-2 leading-relaxed">
                ${explanation}
            </p>
        </div>
    `;
}

function renderReconciliationHTML() {
    const rs = appState.riskScore;
    const recon = appState.reconciliation;
    
    const amountDue = 10000;
    const verifiedAmount = recon.bankReceived;
    const pendingAmount = amountDue - verifiedAmount;
    
    let deadlineText = "";
    if (appState.scenario === 'B') {
        deadlineText = "3 Days Remaining";
    } else if (appState.scenario === 'F') {
        deadlineText = "DEADLINE TOMORROW";
    } else {
        deadlineText = `${rs.daysRemaining} Days Remaining`;
    }
    
    let riskStatus = "";
    let riskBadgeColor = "";
    if (appState.scenario === 'B') {
        riskStatus = "HIGH RISK";
        riskBadgeColor = "bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2] animate-pulse";
    } else if (appState.scenario === 'F') {
        riskStatus = "URGENT";
        riskBadgeColor = "bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2] animate-pulse font-extrabold";
    } else if (rs.level === 'HIGH' || rs.level === 'HIGH RISK') {
        riskStatus = "HIGH RISK";
        riskBadgeColor = "bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]";
    } else if (rs.level === 'MEDIUM' || rs.level === 'MEDIUM RISK') {
        riskStatus = "MEDIUM RISK";
        riskBadgeColor = "bg-[#FFF7ED] text-[#D97706] border-[#FED7AA]";
    } else {
        riskStatus = "LOW RISK";
        riskBadgeColor = "bg-[#ECFDF3] text-[#15803D] border-[#D1F7C4]";
    }

    let repaymentCardAccent = "accent-repayment"; // Default Teal/Blue
    if (appState.scenario === 'A') {
        repaymentCardAccent = "accent-contribution"; // Green accent
    } else if (appState.scenario === 'B') {
        repaymentCardAccent = "accent-alerts"; // Amber accent
    } else if (appState.scenario === 'F' || appState.scenario === 'C') {
        repaymentCardAccent = "accent-danger"; // Red accent
    }

    return `
        <div class="glass-panel tilt-card p-5 rounded-2xl border border-slate-205 space-y-2.5 bg-white ${repaymentCardAccent} flex flex-col justify-between flex-1">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5"><span class="icon-container bg-[#F8FAFC] text-[#2563EB]">🏦</span> Bank Repayment Status</span>
                <span class="border px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider ${riskBadgeColor}">${riskStatus}</span>
            </div>
            
            <div class="space-y-2">
                <div class="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span class="text-xs text-slate-500 font-medium">Amount Due</span>
                    <span class="text-xs font-bold text-slate-800">₹${amountDue.toLocaleString('en-IN')}</span>
                </div>
                <div class="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span class="text-xs text-slate-500 font-medium">Verified Amount</span>
                    <span class="text-xs font-bold text-emerald-700">₹${verifiedAmount.toLocaleString('en-IN')}</span>
                </div>
                <div class="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span class="text-xs text-slate-500 font-medium">Pending Amount</span>
                    <span class="text-xs font-bold text-red-655">₹${pendingAmount.toLocaleString('en-IN')}</span>
                </div>
                <div class="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span class="text-xs text-slate-500 font-medium">Deadline</span>
                    <span class="text-xs font-bold text-slate-805">${deadlineText}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-slate-500 font-medium">Risk Status</span>
                    <span class="text-xs font-bold text-slate-805">${riskStatus}</span>
                </div>
            </div>
        </div>
    `;
}

function renderImportantAlertsHTML() {
    let alerts = [];
    const sc = appState.scenario;
    const myPayment = appState.members.find(m => m.username === appState.currentUser.username);
    const paymentStatus = myPayment && myPayment.status === 'VERIFIED';
    
    const paidCount = appState.members.filter(m => m.status === 'VERIFIED').length;
    const shortfall = (10 - paidCount) * 1000;
    
    if (appState.currentUser.role === 'MEMBER') {
        if (paymentStatus) {
            alerts.push({
                type: 'success',
                icon: '✓',
                text: 'Your ₹1,000 contribution is verified.'
            });
        } else {
            alerts.push({
                type: 'warning',
                icon: '⚠',
                text: 'Your ₹1,000 monthly contribution is pending.'
            });
        }
    }
    
    if (sc === 'B') {
        if (shortfall > 0) {
            alerts.push({
                type: 'warning',
                icon: '⚠',
                text: `₹${shortfall.toLocaleString('en-IN')} group shortfall remains.`
            });
        }
    } else if (sc === 'F') {
        if (shortfall > 0) {
            alerts.push({
                type: 'warning',
                icon: '⚠',
                text: `₹${shortfall.toLocaleString('en-IN')} group shortfall remains.`
            });
        }
        alerts.push({
            type: 'danger',
            icon: '🚨',
            text: 'Repayment deadline is tomorrow.'
        });
    } else if (sc === 'C') {
        alerts.push({
            type: 'danger',
            icon: '⚠',
            text: 'Bank reconciliation mismatch of ₹2,000 detected.'
        });
    } else if (sc === 'D') {
        alerts.push({
            type: 'warning',
            icon: '⚠',
            text: 'A major transaction requires member verification.'
        });
    } else if (sc === 'E') {
        alerts.push({
            type: 'warning',
            icon: '⚠',
            text: 'A major transaction requires member verification.'
        });
    }
    
    if (alerts.length === 0) return '';
    
    const alertItems = alerts.map(a => {
        let border = 'border-[#CBD5E1]';
        let bg = 'bg-[#F8FAFC]';
        let text = 'text-[#64748B]';
        let iconBg = 'bg-[#E2E8F0]';
        let iconColor = 'text-[#64748B]';
        
        if (a.type === 'success') {
            border = 'border-[#D1F7C4]';
            bg = 'bg-[#ECFDF3]';
            text = 'text-[#15803D]';
            iconBg = 'bg-[#15803D]';
            iconColor = 'text-white';
        } else if (a.type === 'warning') {
            border = 'border-[#FED7AA]';
            bg = 'bg-[#FFF7ED]';
            text = 'text-[#D97706]';
            iconBg = 'bg-[#D97706]';
            iconColor = 'text-white';
        } else if (a.type === 'danger') {
            border = 'border-[#FEE2E2]';
            bg = 'bg-[#FEF2F2]';
            text = 'text-[#DC2626]';
            iconBg = 'bg-[#DC2626]';
            iconColor = 'text-white';
        }
        
        return `
            <div class="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg border ${border} ${bg} ${text} hover:scale-[1.01] transition-transform duration-150">
                <span class="flex items-center justify-center w-5 h-5 rounded-full ${iconBg} ${iconColor} text-[10px] shrink-0 font-bold">${a.icon}</span>
                <span>${a.text}</span>
            </div>
        `;
    }).join('');
    
    return `
        <div class="glass-panel p-4 rounded-xl border border-slate-200 bg-white space-y-2 mb-6 accent-alerts">
            <span class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">🔔 Important Alerts</span>
            <div class="grid gap-2">
                ${alertItems}
            </div>
        </div>
    `;
}

function renderCoreMessageHTML() {
    return `
        <div class="glass-panel p-5 rounded-2xl border border-slate-202 bg-white text-[#172033] flex flex-col justify-between text-center accent-repayment relative overflow-hidden flex-1">
            <div class="flex justify-between items-center border-b border-slate-100 pb-2.5 mb-2.5">
                <h4 class="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🔒</span> Financial Transparency
                </h4>
                <span class="security-flow-badge text-[9px] font-extrabold uppercase tracking-wider bg-[#FFF3EB] text-[#E87545] px-2 py-0.5 rounded-full border border-[#FED7AA]">Security Flow</span>
            </div>
            
            <div class="financial-transparency-flow flex flex-col items-center justify-center gap-1 text-[10px] text-slate-700 font-bold py-1">
                <span class="flow-step-box bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg w-full max-w-[220px]">Digital Payment</span>
                <span class="flow-arrow text-[#E87545] font-bold text-xs">↓</span>
                <span class="flow-step-box bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg w-full max-w-[220px]">Digital Receipt</span>
                <span class="flow-arrow text-[#E87545] font-bold text-xs">↓</span>
                <span class="flow-step-box bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg w-full max-w-[220px]">Bank Verification</span>
                <span class="flow-arrow text-[#E87545] font-bold text-xs">↓</span>
                <span class="flow-step-box bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg w-full max-w-[220px]">Member Visibility</span>
                <span class="flow-arrow text-[#E87545] font-bold text-xs">↓</span>
                <span class="flow-alert-box bg-red-50 border border-red-200 text-red-700 px-3 py-1 rounded-lg w-full max-w-[220px] font-bold">Fraud / Mismatch Alert</span>
            </div>
            
            <p class="text-[11px] text-[#64748B] font-semibold italic mt-3 pt-2 border-t border-slate-100 leading-relaxed">
                "Every member can see where the group's money goes."
            </p>
        </div>
    `;
}

function renderFinancialAwareness() {
    const card = document.getElementById('financial-awareness-card');
    if (!card) return;
    
    const dict = translations[appState.currentLanguage] || translations['en'];
    
    card.innerHTML = `
        <div class="flex flex-col justify-between h-full">
            <div>
                <div class="flex justify-between items-center border-b border-slate-100 pb-2.5 mb-2.5">
                    <h4 class="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span>📖</span> ${dict.title}
                    </h4>
                    <select id="lang-select" onchange="changeLanguage(this.value);" class="bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 py-1 px-2 rounded-lg focus:outline-none cursor-pointer">
                        <option value="en" ${appState.currentLanguage === 'en' ? 'selected' : ''}>English</option>
                        <option value="te" ${appState.currentLanguage === 'te' ? 'selected' : ''}>తెలుగు</option>
                        <option value="hi" ${appState.currentLanguage === 'hi' ? 'selected' : ''}>हिन्दी</option>
                    </select>
                </div>
                
                <p class="text-[10px] text-slate-500 font-medium mb-3">${dict.subtitle}</p>
                
                <!-- Accordion format awareness details -->
                <div class="space-y-2">
                    <div class="awareness-faq-item border border-[#E5E1D8] rounded-xl p-3 bg-white">
                        <button type="button" onclick="toggleAwarenessCollapse(this);" class="awareness-faq-btn w-full text-left font-bold text-xs text-slate-700 flex justify-between items-center focus:outline-none focus:ring-0">
                            <span>${dict.q1}</span>
                            <span class="text-xs text-slate-400 font-bold">+</span>
                        </button>
                        <p class="text-[10px] text-slate-500 mt-1.5 hidden leading-relaxed">${dict.a1}</p>
                    </div>
                    
                    <div class="awareness-faq-item border border-[#E5E1D8] rounded-xl p-3 bg-white">
                        <button type="button" onclick="toggleAwarenessCollapse(this);" class="awareness-faq-btn w-full text-left font-bold text-xs text-slate-700 flex justify-between items-center focus:outline-none focus:ring-0">
                            <span>${dict.q4}</span>
                            <span class="text-xs text-slate-400 font-bold">+</span>
                        </button>
                        <p class="text-[10px] text-slate-500 mt-1.5 hidden leading-relaxed">${dict.a4}</p>
                    </div>
                    
                    <div class="awareness-faq-item border border-[#E5E1D8] rounded-xl p-3 bg-white">
                        <button type="button" onclick="toggleAwarenessCollapse(this);" class="awareness-faq-btn w-full text-left font-bold text-xs text-slate-700 flex justify-between items-center focus:outline-none focus:ring-0">
                            <span>${dict.q5}</span>
                            <span class="text-xs text-slate-400 font-bold">+</span>
                        </button>
                        <p class="text-[10px] text-slate-500 mt-1.5 hidden leading-relaxed">${dict.a5}</p>
                    </div>
                    
                    <div class="awareness-faq-item border border-[#E5E1D8] rounded-xl p-3 bg-white">
                        <button type="button" onclick="toggleAwarenessCollapse(this);" class="awareness-faq-btn w-full text-left font-bold text-xs text-slate-700 flex justify-between items-center focus:outline-none focus:ring-0">
                            <span>${dict.q6}</span>
                            <span class="text-xs text-slate-400 font-bold">+</span>
                        </button>
                        <p class="text-[10px] text-slate-500 mt-1.5 hidden leading-relaxed">${dict.a6}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function toggleAwarenessCollapse(btn) {
    const textNode = btn.nextElementSibling;
    const signNode = btn.querySelector('span:last-child');
    
    if (textNode.classList.contains('hidden')) {
        textNode.classList.remove('hidden');
        signNode.innerText = '−';
    } else {
        textNode.classList.add('hidden');
        signNode.innerText = '+';
    }
}

function renderGeneralReportFormHTML() {
    return `
        <div class="glass-panel p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 class="font-extrabold text-sm text-slate-800 tracking-wider uppercase">📞 Report a Financial Concern</h3>
            <p class="text-xs text-slate-500">Submit a query or report unapproved financial records for review.</p>
            
            <form onsubmit="event.preventDefault(); submitGeneralConcernForm();" class="space-y-3">
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Issue Category</label>
                    <select id="concern-category" class="w-full bg-white border border-slate-200 text-xs font-semibold py-2 px-3 rounded-lg focus:outline-none focus:border-emerald-800">
                        <option value="PAYMENT_MISSING">My Payment is missing in passbook</option>
                        <option value="TRANSACTION_UNRECOGNIZED">I do not recognize a transaction</option>
                        <option value="AMOUNT_INCORRECT">Recorded amount is incorrect</option>
                        <option value="LOAN_INFO_UNRESOLVED">Loan detail is unannounced or incorrect</option>
                        <option value="OTHER">Other general concern</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Describe Concern</label>
                    <textarea id="concern-desc" rows="2" placeholder="Provide transaction date, details, or meeting notes..." class="w-full bg-white border border-slate-200 text-xs font-semibold py-2 px-3 rounded-lg focus:outline-none focus:border-emerald-800" required></textarea>
                </div>
                <button type="submit" class="bg-[#E87545] hover:bg-[#D66434] text-white font-bold text-xs py-2 px-4 rounded-lg transition shadow-sm w-full">
                    Submit Secure Report
                </button>
            </form>
            <div class="text-[9px] text-slate-400 font-medium leading-tight mt-2">
                * Note: Concern logs are recorded in the audit registry for banking officers. SHG-Secure is a prototype tool and does not represent direct government police or legal authorities.
            </div>
        </div>
    `;
}

function submitGeneralConcernForm() {
    const category = document.getElementById('concern-category').value;
    const desc = document.getElementById('concern-desc').value.trim();
    
    setLoading(true);
    const newId = appState.disputes.length + 1;
    appState.disputes.push({
        id: newId,
        transaction_type: 'PAYMENT',
        transaction_id: 1,
        member_name: appState.currentUser.full_name,
        reason: `[Category: ${category}] ${desc}`,
        status: 'PENDING'
    });
    
    appState.auditLogs.unshift({
        id: appState.auditLogs.length + 1,
        event_type: 'CONCERN',
        message: appState.currentUser.full_name + ' logged a concern under category ' + category + '.',
        timestamp: new Date().toISOString().replace('T', ' ').split('.')[0]
    });
    
    showToast(`Concern logged successfully. Ref: DISP-${newId.toString().padStart(4, '0')}`, 'success');
    document.getElementById('concern-desc').value = '';
    setLoading(false);
    renderApp();
}

// Placeholder functions for drawing SVGs or lightweight visual aids
function drawRiskChart() {
    // Done dynamically in render
}

function drawReconciliationChart() {
    // Done dynamically in render
}

// --- COMPETITION TOUR (GUIDED WALKTHROUGH) ---

const guidedTourSteps = [
    {
        title: "Introduction: The Real-World SHG Problem",
        desc: "Under the legacy process, members pay ₹1,000 cash to the leader Sujatha. Sujatha holds the cash, delays deposit, and members remain blind to the bank ledger. Let's see how SHG-Secure protects members.",
        action: () => {
            appState.currentView = 'dashboard';
            handleLoginAction('lakshmi');
        }
    },
    {
        title: "Step 1: Direct Cashless Payment",
        desc: "First, Member Lakshmi logs in. Lakshmi's dashboard shows her monthly contribution status is PENDING. Instead of giving cash to the leader, Lakshmi pays digitally directly to the group's authorized bank account.",
        action: () => {
            appState.currentView = 'dashboard';
            handleLoginAction('lakshmi');
        }
    },
    {
        title: "Step 2: Digital Payment Simulation",
        desc: " Lakshmi clicks 'Pay Contribution Digitally' and selects her payment method (UPI / QR). We simulate the transaction securely.",
        action: () => {
            initiatePayment();
        }
    },
    {
        title: "Step 3: Receipt & Immutable Ledger Log",
        desc: "Payment is successful! A digital receipt is generated with a unique reference ID. This receipt is automatically recorded in the ledger, proving the contribution reached the bank directly.",
        action: () => {
            closePaymentModal();
            confirmSimulatedPayment('UPI');
        }
    },
    {
        title: "Step 4: The 8/10 Payment Shortfall Problem",
        desc: "Now, let's switch to Scenario B. 8 members paid, but 2 are pending. The bank deadline is approaching. The group dashboard displays an orange warning: '₹2,000 Group Repayment Shortfall Risk'. paying members see their own status as PAID, but the group risk is HIGHLIGHTED.",
        action: () => {
            closeReceiptModal();
            triggerScenarioSwitch('B');
        }
    },
    {
        title: "Step 5: Leader Cash Collection Mismatch Alert",
        desc: "What happens if a leader collects cash but delays deposit? Switch to Scenario C. Leader reports ₹10,000 collected (including ₹2,000 cash), but the Bank account received only ₹8,000. The reconciliation engine immediately raises a 'FINANCIAL MISMATCH' alert on everyone's dashboard.",
        action: () => {
            triggerScenarioSwitch('C');
        }
    },
    {
        title: "Step 6: Loan Transparency & Member Voting",
        desc: "Now switch to Scenario D. A bank loan of ₹3,00,000 is sanctioned. Ordinary members Radha, Kavitha, and Maya find themselves unaware of it. Radford disputes it. The loan is immediately flagged 'REQUIRES REVIEW' with member awareness votes displayed.",
        action: () => {
            triggerScenarioSwitch('D');
        }
    },
    {
        title: "Step 7: Reviewer Inspection & Resolution",
        desc: "Finally, let's look at the Authorized Reviewer dashboard. The reviewer can inspect the open disputes raised by members, verify the awareness votes, and either Approve or Cancel the transaction.",
        action: () => {
            handleLoginAction('reviewer');
        }
    },
    {
        title: "Conclusion: Complete Financial Protection",
        desc: "SHG-Secure eliminates transparency blindspots. Every transaction is tracked, verified, and audited. The group remains financially safe and empowered. Click 'Finish Tour' to explore the prototype freely!",
        action: () => {
            appState.currentView = 'dashboard';
            handleLoginAction('lakshmi');
        }
    }
];

function startGuidedDemo() {
    appState.demoGuidedActive = true;
    appState.demoGuidedStep = 0;
    showGuidedStep();
}

function nextGuidedStep() {
    if (appState.demoGuidedStep < guidedTourSteps.length - 1) {
        appState.demoGuidedStep++;
        showGuidedStep();
    } else {
        finishGuidedTour();
    }
}

function prevGuidedStep() {
    if (appState.demoGuidedStep > 0) {
        appState.demoGuidedStep--;
        showGuidedStep();
    }
}

function finishGuidedTour() {
    appState.demoGuidedActive = false;
    const tourDiv = document.getElementById('demo-tour-banner');
    if (tourDiv) tourDiv.classList.add('hidden');
    appState.currentView = 'dashboard';
    handleLoginAction('lakshmi');
}

function showGuidedStep() {
    const step = guidedTourSteps[appState.demoGuidedStep];
    step.action();
    
    let tourDiv = document.getElementById('demo-tour-banner');
    if (!tourDiv) {
        tourDiv = document.createElement('div');
        tourDiv.id = 'demo-tour-banner';
        tourDiv.className = 'fixed bottom-4 left-4 right-4 md:left-1/2 md:transform md:-translate-x-1/2 md:max-w-2xl bg-slate-950 text-white rounded-2xl p-5 shadow-2xl border border-emerald-500 z-50 animate-fade-in-up';
        document.body.appendChild(tourDiv);
    }
    
    tourDiv.classList.remove('hidden');
    tourDiv.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                <span class="text-xs font-bold text-emerald-400 uppercase tracking-widest">Competition Guide Tour (${appState.demoGuidedStep + 1}/${guidedTourSteps.length})</span>
                <button onclick="finishGuidedTour();" class="text-slate-400 hover:text-white text-xs font-semibold">✕ Close</button>
            </div>
            <div>
                <h4 class="font-extrabold text-sm sm:text-base text-slate-100">${step.title}</h4>
                <p class="text-xs text-slate-300 mt-1 leading-relaxed">${step.desc}</p>
            </div>
            <div class="flex justify-between items-center pt-2">
                <button onclick="prevGuidedStep();" class="bg-slate-900 border border-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition ${appState.demoGuidedStep === 0 ? 'opacity-50 pointer-events-none' : ''}">
                    &larr; Prev
                </button>
                <div class="flex gap-2">
                    <button onclick="finishGuidedTour();" class="bg-slate-900 border border-slate-800 text-[10px] font-bold px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition">
                        Skip
                    </button>
                    <button onclick="nextGuidedStep();" class="bg-[#E87545] hover:bg-[#D66434] text-[10px] font-bold px-4 py-1.5 rounded-lg text-white transition shadow-md">
                        ${appState.demoGuidedStep === guidedTourSteps.length - 1 ? 'Finish Tour' : 'Next Step &rarr;'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// --- COMPETITION DEMO MODE DYNAMIC ENGINE ---

const demoResults = {
    'A': {
        status: 'SAFE',
        statusClass: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
        severity: 'LOW',
        severityClass: 'text-emerald-400',
        score: '15 / 100',
        reason: 'All expected monthly contributions (10/10) have been paid digitally and verified directly against the bank statement. No anomalies detected.',
        action: 'No action required. The ledger and bank records are fully reconciled.'
    },
    'B': {
        status: 'SHORTFALL DETECTED',
        statusClass: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
        severity: 'MEDIUM',
        severityClass: 'text-amber-400',
        score: '40 / 100',
        reason: 'Only 8 of 10 members have completed their monthly contribution payments, leaving a group shortfall of ₹2,000. Payment deadline is approaching.',
        action: 'Review the two missing contributions and notify pending members immediately.'
    },
    'C': {
        status: 'MISMATCH DETECTED',
        statusClass: 'text-red-400 bg-red-950/60 border-red-800/60',
        severity: 'HIGH',
        severityClass: 'text-red-400 font-bold',
        score: '82 / 100',
        reason: 'Leader Sujatha Rao recorded collecting ₹2,000 cash from 2 members. However, the bank statement reconciles only ₹8,000 received. Cash has not been deposited in the bank.',
        action: 'Verify cash ledger log records, check leader cash handovers, and audit supporting cash receipts.'
    },
    'D': {
        status: 'UNAUTHORIZED ACTIVITY',
        statusClass: 'text-purple-400 bg-purple-950/60 border-purple-800/60',
        severity: 'CRITICAL',
        severityClass: 'text-purple-400 font-extrabold',
        score: '92 / 100',
        reason: 'A new bank loan of ₹3,00,000 was sanctioned. However, 3 members have raised disputes marking themselves as UNAWARE of this loan approval and group discussion.',
        action: 'Freeze loan disbursements, review bank authorization signatures, and schedule an immediate member meeting.'
    },
    'E': {
        status: 'ANOMALY DETECTED',
        statusClass: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
        severity: 'HIGH',
        severityClass: 'text-amber-400',
        score: '78 / 100',
        reason: 'An expense transaction of ₹1,50,000 was logged by the leader. The AI risk engine flagged this as anomalous because it is 1,090% above the group\'s historic average expense.',
        action: 'Halt expense payouts, audit merchant invoices, and request all group members to vote/verify this transaction.'
    },
    'F': {
        status: 'DEADLINE WARNING',
        statusClass: 'text-red-400 bg-red-950/60 border-red-800/60',
        severity: 'URGENT',
        severityClass: 'text-red-400 font-extrabold',
        score: '45 / 100',
        reason: 'The monthly bank repayment deadline is TOMORROW. A ₹2,000 contribution shortfall remains, putting the entire group at risk of default and interest penalties.',
        action: 'Initiate emergency group funds or contact unpaid members for immediate direct digital deposit.'
    }
};

function renderCompetitionDemoModeHTML() {
    const sc = appState.selectedDemoScenario || 'A';
    const running = appState.demoRunning;
    const completed = appState.demoCompleted;
    const currentStep = appState.demoAnalysisStep;

    const scenarios = [
        { id: 'A', name: 'A. Normal Payments (10/10)', badge: 'GREEN', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
        { id: 'B', name: 'B. 8 of 10 Paid Shortfall', badge: 'RISK', badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
        { id: 'C', name: 'C. Leader Cash Mismatch', badge: 'MISMATCH', badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30' },
        { id: 'D', name: 'D. Unauthorized Loan Review', badge: 'REVIEW', badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
        { id: 'E', name: 'E. Large Expense Anomaly', badge: 'ANOMALY', badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
    ];

    let contentHTML = '';

    if (!running && !completed) {
        contentHTML = `
            <div class="space-y-3 select-none">
                <div class="p-2.5 bg-blue-950/40 border border-blue-800/40 rounded-xl text-[10px] text-blue-300 font-semibold leading-snug">
                    <span class="font-extrabold text-white uppercase tracking-wider block mb-0.5">COMPETITION SIMULATION ACTIVE</span>
                    REAL DATABASE WILL NOT BE PERMANENTLY MODIFIED
                </div>

                <div class="space-y-1.5 pt-1">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">SELECT SCENARIO:</label>
                    ${scenarios.map(s => {
                        const isSel = sc === s.id;
                        const selBorder = isSel ? 'border-blue-500 bg-blue-900/30' : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80';
                        return `
                            <button onclick="selectDemoScenario('${s.id}');" class="w-full text-left p-2.5 rounded-xl border ${selBorder} transition flex items-center justify-between text-xs cursor-pointer">
                                <span class="font-bold text-slate-200 text-[11px] truncate">${s.name}</span>
                                <span class="text-[9px] font-black px-2 py-0.5 rounded-full border ${s.badgeColor} shrink-0 ml-1">${s.badge}</span>
                            </button>
                        `;
                    }).join('')}
                </div>

                <div class="space-y-2 pt-2">
                    <button onclick="runDemoScenario();" class="w-full bg-[#E87545] hover:bg-[#D66434] text-white font-extrabold text-xs py-2.5 rounded-xl transition uppercase tracking-wider text-center shadow-lg border border-[#E87545]/30">
                        ▶ RUN SCENARIO
                    </button>
                    <button onclick="runPresentationTour();" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-[10px] py-2 rounded-xl transition uppercase tracking-wider text-center border border-slate-700/60">
                        🚀 RUN PRESENTATION TOUR
                    </button>
                </div>
            </div>
        `;
    }

    if (running) {
        const steps = [
            "Checking payment...",
            "Member verified",
            "Ledger & cash checked",
            "Risk pattern analyzed"
        ];
        
        contentHTML = `
            <div class="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 select-none">
                <div class="flex items-center gap-2 text-xs font-bold text-cyan-400">
                    <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    Analyzing Scenario...
                </div>
                <div class="space-y-1 pt-1">
                    ${steps.map((text, idx) => {
                        const isDone = currentStep > idx;
                        const isCurrent = currentStep === idx;
                        const icon = isDone ? '✓' : isCurrent ? '↻' : '○';
                        const textClass = isDone ? 'text-emerald-400 font-bold' : isCurrent ? 'text-cyan-400 font-bold animate-pulse' : 'text-slate-500';
                        return `
                            <div class="flex items-center gap-2 text-[11px] ${textClass}">
                                <span class="shrink-0 font-bold">${icon}</span>
                                <span>${text}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    if (completed && sc) {
        const resultData = {
            'A': { title: '✓ NORMAL PAYMENTS (10/10)', risk: 'LOW', riskColor: 'text-emerald-400', desc: 'All 10 members paid ₹1,000 on time. Group balance: ₹2,10,000.' },
            'B': { title: '⚠ 8 OF 10 PAID SHORTFALL', risk: 'MEDIUM', riskColor: 'text-amber-400', desc: 'Expected: ₹10,000 | Received: ₹8,000 | Shortfall: ₹2,000 before deadline.' },
            'C': { title: '🚨 LEADER CASH MISMATCH', risk: 'HIGH', riskColor: 'text-red-400', desc: 'Cash deposit mismatch: Bank received ₹8,000 while ledger logs ₹10,000.' },
            'D': { title: '🚨 UNAUTHORIZED LOAN REVIEW', risk: 'HIGH', riskColor: 'text-purple-400', desc: 'External loan of ₹1,00,000 logged without member votes. Vote required.' },
            'E': { title: '⚠ LARGE EXPENSE ANOMALY', risk: 'HIGH', riskColor: 'text-amber-400', desc: 'Expense of ₹1,50,000 flagged due to anomalous size compared to regular logs.' }
        };

        const res = resultData[sc] || resultData['A'];

        contentHTML = `
            <div class="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 animate-fade-in-up select-none">
                <div class="text-[9px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-800 pb-1">SCENARIO RESULT</div>
                <div class="font-black text-xs uppercase ${res.riskColor}">${res.title}</div>
                <div class="text-[10px] font-bold text-slate-300">Risk Level: <span class="${res.riskColor}">${res.risk}</span></div>
                <p class="text-[10px] text-slate-400 font-medium leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800">${res.desc}</p>
                <button onclick="resetDemoScenario();" class="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-[10px] py-2 rounded-xl transition uppercase tracking-wider text-center border border-slate-700/50">
                    ↺ SELECT ANOTHER SCENARIO
                </button>
            </div>
        `;
    }

    return contentHTML;
}

async function selectDemoScenario(sc) {
    appState.selectedDemoScenario = sc;
    appState.demoRunning = false;
    appState.demoCompleted = false;
    appState.demoAnalysisStep = 0;
    
    if (!appState.inDemoMode) {
        appState.baselineScenario = appState.scenario;
        appState.inDemoMode = true;
    }
    appState.scenario = sc;
    
    setLoading(true);
    try {
        const response = await fetch('/api/switch-scenario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenario: sc })
        });
        const resData = await response.json();
        if (resData.success) {
            await fetchState();
        } else {
            loadLocalMockState(sc);
        }
    } catch (e) {
        loadLocalMockState(sc);
    }
    setLoading(false);
    
    renderApp();
}

async function runDemoScenario() {
    if (!appState.selectedDemoScenario) return;
    
    appState.demoRunning = true;
    appState.demoCompleted = false;
    appState.demoAnalysisStep = 0;
    
    if (!appState.inDemoMode) {
        appState.baselineScenario = appState.scenario;
        appState.inDemoMode = true;
    }
    
    renderDashboard();
    
    // Check animation steps (4 steps)
    const stepsCount = 4;
    for (let step = 1; step <= stepsCount; step++) {
        await new Promise(resolve => setTimeout(resolve, 600));
        appState.demoAnalysisStep = step;
        renderDashboard();
    }
    
    appState.demoRunning = false;
    appState.demoCompleted = true;
    renderDashboard();
}

async function resetDemoScenario() {
    appState.selectedDemoScenario = null;
    appState.demoRunning = false;
    appState.demoCompleted = false;
    appState.demoAnalysisStep = 0;
    
    if (appState.inDemoMode) {
        appState.inDemoMode = false;
        
        setLoading(true);
        try {
            await fetch('/api/switch-scenario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario: appState.baselineScenario })
            });
            await handleLoginAction('lakshmi');
        } catch (e) {
            console.warn("Backend reset failed.");
            loadLocalMockState(appState.baselineScenario);
        }
        setLoading(false);
    }
    
    renderApp();
    showToast("Demo reset to baseline state.", "success");
}

// --- UTILITIES ---

function showToast(msg, type = 'success') {
    // Guard: Never display toast notifications on the login page or when unauthenticated
    if (!appState.authenticated || !appState.currentUser || appState.currentView === 'login' || appState.currentView === 'landing') {
        return;
    }
    
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-4 right-4 max-w-sm z-50 space-y-2';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    const colors = {
        'success': 'bg-emerald-800 text-white border-emerald-900',
        'warning': 'bg-amber-500 text-slate-950 border-amber-600',
        'danger': 'bg-red-700 text-white border-red-800',
        'info': 'bg-blue-600 text-white border-blue-700'
    };
    
    toast.className = `p-4 rounded-xl shadow-lg border text-xs font-bold animate-fade-in-up ${colors[type] || colors['success']}`;
    toast.innerText = msg;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}


function loadLocalMockState(sc) {
    appState.scenario = sc;
    appState.shg = { id: 1, name: "Mahila Jyothi SHG", bank_account_no: "33049182390" };
    
    // Base 10 Members
    appState.members = [
        { id: 1, username: 'lakshmi', full_name: 'Lakshmi Devi', role: 'MEMBER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 10:00:00', txn_id: 'TXN-SHG-DEMO-0001', is_cash_deposit: 0 },
        { id: 2, username: 'anitha', full_name: 'Anitha Reddy', role: 'MEMBER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 10:15:00', txn_id: 'TXN-SHG-DEMO-0002', is_cash_deposit: 0 },
        { id: 3, username: 'sujatha', full_name: 'Sujatha Rao', role: 'LEADER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 10:30:00', txn_id: 'TXN-SHG-DEMO-0003', is_cash_deposit: 0 },
        { id: 4, username: 'radha', full_name: 'Radha Kumari', role: 'MEMBER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 10:45:00', txn_id: 'TXN-SHG-DEMO-0004', is_cash_deposit: 0 },
        { id: 5, username: 'kavitha', full_name: 'Kavitha Patel', role: 'MEMBER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 11:00:00', txn_id: 'TXN-SHG-DEMO-0005', is_cash_deposit: 0 },
        { id: 6, username: 'maya', full_name: 'Maya Devi', role: 'MEMBER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 11:15:00', txn_id: 'TXN-SHG-DEMO-0006', is_cash_deposit: 0 },
        { id: 7, username: 'saroja', full_name: 'Sarojaamma', role: 'MEMBER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 11:30:00', txn_id: 'TXN-SHG-DEMO-0007', is_cash_deposit: 0 },
        { id: 8, username: 'latha', full_name: 'Latha Shenoy', role: 'MEMBER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 11:45:00', txn_id: 'TXN-SHG-DEMO-0008', is_cash_deposit: 0 },
        { id: 9, username: 'geetha', full_name: 'Geetha Nayak', role: 'MEMBER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 12:00:00', txn_id: 'TXN-SHG-DEMO-0009', is_cash_deposit: 0 },
        { id: 10, username: 'shanti', full_name: 'Shanti Priya', role: 'MEMBER', status: 'VERIFIED', amount: 1000.0, payment_date: '2026-08-07 12:15:00', txn_id: 'TXN-SHG-DEMO-0010', is_cash_deposit: 0 }
    ];
    
    // Adjust payments based on scenario
    if (sc === 'B') {
        // Lakshmi and Shanti are pending (to allow Lakshmi to pay in the demo)
        appState.members[0].status = 'PENDING';
        appState.members[0].amount = 0.0;
        appState.members[0].payment_date = null;
        appState.members[0].txn_id = null;
        
        appState.members[9].status = 'PENDING';
        appState.members[9].amount = 0.0;
        appState.members[9].payment_date = null;
        appState.members[9].txn_id = null;
    } else if (sc === 'C') {
        // Cash deposit mismatch
        appState.members[8].is_cash_deposit = 1;
        appState.members[8].txn_id = 'TXN-CASH-0009';
        
        appState.members[9].is_cash_deposit = 1;
        appState.members[9].txn_id = 'TXN-CASH-0010';
    }
    
    // Base Loans
    appState.loans = [
        { id: 1, bank_name: 'State Bank of India', amount: 200000.0, purpose: 'Agricultural Tools', status: 'APPROVED', sanctioned_date: '2026-01-10 11:30:00', amount_repaid: 90000.0, verifications: [] }
    ];
    
    if (sc === 'D') {
        appState.loans.push({
            id: 2,
            bank_name: 'Andhra Bank',
            amount: 300000.0,
            purpose: 'Unauthorized Dairy Farm Loan',
            status: 'UNDER_REVIEW',
            sanctioned_date: '2026-08-08 10:00:00',
            amount_repaid: 0.0,
            verifications: [
                { username: 'radha', response: 'UNAWARE', reason: 'No discussion held' },
                { username: 'kavitha', response: 'UNAWARE', reason: 'Unaware of this loan' },
                { username: 'maya', response: 'UNAWARE', reason: 'Never signed for this' },
                { username: 'lakshmi', response: 'PENDING', reason: '' }
            ]
        });
    }
    
    // Base Expenses
    appState.expenses = [
        { id: 1, amount: 15000.0, purpose: 'Stationery & Register Books', status: 'APPROVED', date: '2026-05-10 11:00:00', verifications: [] },
        { id: 2, amount: 12500.0, purpose: 'Meeting Venue Rent', status: 'APPROVED', date: '2026-06-12 12:00:00', verifications: [] }
    ];
    
    if (sc === 'E') {
        appState.expenses.push({
            id: 3,
            amount: 150000.0,
            purpose: 'Bulk Sewing Machines (Anomalous size)',
            status: 'PENDING',
            date: '2026-08-08 14:00:00',
            verifications: [
                { username: 'lakshmi', response: 'PENDING', reason: '' }
            ]
        });
    }
    
    // Base Disputes
    appState.disputes = [];
    if (sc === 'D') {
        appState.disputes = [
            { id: 1, transaction_type: 'LOAN', transaction_id: 2, member_name: 'Radha Kumari', reason: 'No group discussion held regarding Andhra Bank Loan.', status: 'PENDING' },
            { id: 2, transaction_type: 'LOAN', transaction_id: 2, member_name: 'Kavitha Patel', reason: 'Unaware of dairy loan sanction.', status: 'PENDING' }
        ];
    }
    
    // Base Audit Logs
    appState.auditLogs = [
        { id: 1, event_type: 'SESSION', message: 'User logged in.', timestamp: '2026-08-08 18:00:00' },
        { id: 2, event_type: 'METRIC', message: 'Scenario ' + sc + ' initialized in local fallback mode.', timestamp: '2026-08-08 18:01:00' }
    ];
    
    recalculateLocalRiskAndCollection();
}

function recalculateLocalRiskAndCollection() {
    const sc = appState.scenario;
    const totalMembers = appState.members.length;
    const paidCount = appState.members.filter(m => m.status === 'VERIFIED').length;
    const shortfall = (totalMembers - paidCount) * 1000.0;
    
    // 1. Reconciliation
    if (sc === 'C') {
        appState.reconciliation = {
            mismatch: true,
            mismatchAmount: 2000.0,
            ledgerBalance: 10000.0,
            bankReceived: 8000.0
        };
    } else {
        const collected = paidCount * 1000.0;
        appState.reconciliation = {
            mismatch: false,
            mismatchAmount: 0.0,
            ledgerBalance: collected,
            bankReceived: collected
        };
    }
    
    // 2. Alerts
    appState.alerts = [];
    if (shortfall > 0) {
        if (sc === 'F') {
            appState.alerts.push({ id: 1, type: 'CRITICAL', title: 'Repayment Shortfall Crisis', message: '₹' + shortfall.toLocaleString('en-IN') + ' remains unpaid. Bank repayment deadline is TOMORROW!' });
        } else {
            appState.alerts.push({ id: 1, type: 'WARNING', title: 'Repayment Shortfall Risk', message: '₹' + shortfall.toLocaleString('en-IN') + ' monthly contribution shortfall remains. Bank repayment due in 7 days.' });
        }
    }
    if (sc === 'C') {
        appState.alerts.push({ id: 2, type: 'CRITICAL', title: 'Cash Deposit Reconciliation Mismatch', message: 'Group ledger lists ₹10,000 but bank statements verify only ₹8,000 received. Check cash collections immediately.' });
    }
    if (sc === 'D') {
        const activeUnauth = appState.loans.find(l => l.id === 2);
        if (activeUnauth && activeUnauth.status !== 'APPROVED' && activeUnauth.status !== 'RESOLVED') {
            appState.alerts.push({ id: 3, type: 'CRITICAL', title: 'Unauthorized Transaction Audit Alert', message: '3 members marked themselves UNAWARE of the new ₹3,00,000 Andhra Bank loan. Transaction locked pending resolution.' });
        }
    }
    if (sc === 'E') {
        const activeAnomaly = appState.expenses.find(e => e.id === 3);
        if (activeAnomaly && activeAnomaly.status === 'PENDING') {
            appState.alerts.push({ id: 4, type: 'WARNING', title: 'Unusual Transaction Size Flagged', message: 'Expense draft of ₹1,50,000 is 10x higher than historic average (₹13,750). Mark your awareness vote.' });
        }
    }
    
    // 3. Dynamic Risk Score & Health parameters
    let score = 85;
    let level = 'LOW RISK';
    let daysRemaining = 7;
    let bankReconciliation = 'VERIFIED';
    
    if (sc === 'A') {
        score = 85;
        level = 'LOW RISK';
        daysRemaining = 7;
        bankReconciliation = 'VERIFIED';
    } else if (sc === 'B') {
        score = 40;
        level = 'HIGH RISK';
        daysRemaining = 3;
        bankReconciliation = 'VERIFIED';
    } else if (sc === 'F') {
        score = 15;
        level = 'URGENT';
        daysRemaining = 1;
        bankReconciliation = 'VERIFIED';
    } else if (sc === 'C') {
        score = 35;
        level = 'HIGH RISK';
        daysRemaining = 7;
        bankReconciliation = 'MISMATCH';
    } else if (sc === 'D') {
        score = 50;
        level = 'MEDIUM RISK';
        daysRemaining = 7;
        bankReconciliation = 'VERIFIED';
    } else if (sc === 'E') {
        score = 60;
        level = 'MEDIUM RISK';
        daysRemaining = 7;
        bankReconciliation = 'VERIFIED';
    }
    
    appState.riskScore = {
        score: score,
        level: level,
        shortfall: shortfall,
        daysRemaining: daysRemaining,
        onTimeRate: (paidCount / totalMembers) * 100,
        bankReconciliation: bankReconciliation,
        reasons: []
    };
}

// --- NEW PROFILE & SUB-NAVIGATION RENDERERS ---

function renderSidebarNavigationItemsHTML() {
    const tab = appState.activeTab || 'dashboard';
    const role = (appState.currentUser && appState.currentUser.role) || 'MEMBER';
    
    let items = [];
    if (role === 'ADMIN' || role === 'REVIEWER') {
        items = [
            { id: 'dashboard', name: 'Dashboard', icon: '🏠' },
            { id: 'shg', name: 'SHGs', icon: '👥' },
            { id: 'members', name: 'Members', icon: '👤' },
            { id: 'transactions', name: 'Transactions', icon: '💳' },
            { id: 'security', name: 'Fraud Detection', icon: '🛡️' },
            { id: 'risk_analysis', name: 'Risk Analysis', icon: '📊' },
            { id: 'finances', name: 'Reports', icon: '📈' },
            { id: 'alerts', name: 'Alerts', icon: '🚨' },
            { id: 'settings', name: 'Settings', icon: '⚙️' }
        ];
    } else {
        items = [
            { id: 'dashboard', name: 'Dashboard', icon: '🏠' },
            { id: 'profile', name: 'My Profile', icon: '👤' },
            { id: 'shg', name: 'My SHG', icon: '👥' },
            { id: 'group_chat', name: 'Group Chat', icon: '💬' },
            { id: 'finances', name: 'My Finances', icon: '💰' },
            { id: 'transactions', name: 'My Transactions', icon: '💳' },
            { id: 'security', name: 'My Security', icon: '🛡️' },
            { id: 'alerts', name: 'My Alerts', icon: '🚨' },
            { id: 'report_concern', name: 'Report Concern', icon: '📞' },
            { id: 'settings', name: 'Settings', icon: '⚙️' }
        ];
    }
    
    const activeAlerts = getSynchronizedAlerts().filter(a => a.status === 'ACTIVE' && !(appState.dismissedAlerts || []).includes(a.id));
    const unreadAlertsCount = activeAlerts.length;
    
    return items.map(item => {
        const isActive = tab === item.id;
        const activeClass = isActive ? 'active-menu-item' : '';
        
        let path = '/' + item.id;
        if (item.id === 'dashboard') path = '/dashboard';
        else if (item.id === 'shg') path = '/shg';
        else if (item.id === 'group_chat') path = '/group-chat';
        else if (item.id === 'profile') path = '/profile';
        else if (item.id === 'finances') path = '/finances';
        else if (item.id === 'transactions') path = '/transactions';
        else if (item.id === 'security') path = '/security';
        else if (item.id === 'alerts') path = '/alerts';
        else if (item.id === 'report_concern') path = '/report-concern';
        else if (item.id === 'settings') path = '/settings';
        
        let clickHandler = '';
        if (item.id === 'group_chat') {
            clickHandler = `appState.unreadChatCount = 0; appState.activeTab = 'group_chat'; window.history.pushState(null, '', '${path}'); closeMobileSidebar(); renderApp();`;
        } else {
            clickHandler = `appState.activeTab = '${item.id}'; window.history.pushState(null, '', '${path}'); closeMobileSidebar(); renderApp();`;
        }
        
        let unreadBadge = '';
        if (item.id === 'group_chat' && appState.unreadChatCount > 0) {
            unreadBadge = `<span class="bg-[#DC2626] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ml-auto shrink-0">${appState.unreadChatCount}</span>`;
        } else if (item.id === 'alerts' && unreadAlertsCount > 0) {
            unreadBadge = `<span class="bg-[#DC2626] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ml-auto shrink-0">${unreadAlertsCount}</span>`;
        }
        
        return `
            <button onclick="${clickHandler}" class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold transition ${activeClass}">
                <span class="text-sm">${item.icon}</span>
                <span class="nav-label flex-1 flex justify-between items-center">${item.name} ${unreadBadge}</span>
            </button>
        `;
    }).join('');
}

function renderMemberProfileViewHTML() {
    const user = appState.currentUser;
    const isEdit = appState.profileEditMode;
    const shgName = getSHGName();
    const role = user.role || 'Member';
    const memberId = user.member_id_code || 'SHG001-M01';
    
    const headerHTML = `
        <div class="flex justify-between items-center border-b border-[#D9E1EC] pb-4">
            <div>
                <h2 class="font-black text-2xl text-[#172033]">My Identity & Profile</h2>
                <p class="text-sm text-[#475569] mt-1">Manage your personal credentials and contact details.</p>
            </div>
            ${isEdit ? `
                <div class="flex gap-2">
                    <button onclick="appState.profileEditMode = false; renderApp();" class="text-xs font-bold text-[#475569] bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg">Cancel</button>
                    <button onclick="saveProfileChanges();" class="text-xs font-bold text-white bg-[#E87545] hover:bg-[#D66434] px-4 py-2 rounded-lg">Save Changes</button>
                </div>
            ` : `
                <button onclick="appState.profileEditMode = true; renderApp();" class="text-xs font-bold text-[#E87545] hover:underline">Edit Profile</button>
            `}
        </div>
    `;

    const topSectionHTML = `
        <div class="grid md:grid-cols-2 gap-8 pt-4">
            <div class="flex flex-col items-center p-6 bg-[#F8FAFC] border border-[#D9E1EC] rounded-xl fintech-card">
                <div class="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-5xl mb-4 shadow-sm">
                    ${user.profile_photo || '👩‍🌾'}
                </div>
                <h3 class="text-lg font-black text-[#172033]">${user.full_name}</h3>
                <p class="text-sm text-[#6D5DFB] font-bold">${role} &bull; ${shgName}</p>
                <p class="text-xs text-[#64748B] mt-1 font-mono">Member ID: ${memberId}</p>
                ${isEdit ? `
                    <div class="mt-3 w-full">
                        <label class="block text-[10px] font-bold text-[#475569] mb-1">Photo Emoji (e.g. 👩‍🌾)</label>
                        <input type="text" id="profile-photo" class="w-full p-2 border border-[#CBD5E1] rounded text-sm text-[#172033]" value="${user.profile_photo || '👩‍🌾'}">
                    </div>
                ` : ''}
            </div>

            <div class="space-y-4 flex flex-col justify-center bg-[#F8FAFC] p-6 border border-[#D9E1EC] rounded-xl fintech-card">
                <div>
                    <label class="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">Mobile Number</label>
                    ${isEdit ? `<input type="text" id="profile-mobile" class="w-full p-2 border border-[#CBD5E1] rounded text-sm text-[#172033]" value="${user.mobile || user.phone || '+91 98765 43210'}">` : `<div class="text-sm font-semibold text-[#172033]">${user.mobile || user.phone || '+91 98765 43210'}</div>`}
                </div>
                <div>
                    <label class="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">Email Address</label>
                    ${isEdit ? `<input type="email" id="profile-email" class="w-full p-2 border border-[#CBD5E1] rounded text-sm text-[#172033]" value="${user.email || 'lakshmi@example.com'}">` : `<div class="text-sm font-semibold text-[#172033]">${user.email || 'lakshmi@example.com'}</div>`}
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">Address</label>
                        ${isEdit ? `<input type="text" id="profile-address" class="w-full p-2 border border-[#CBD5E1] rounded text-sm text-[#172033]" value="${user.address || 'H.No 12, Ward 3, Mandya'}">` : `<div class="text-sm font-semibold text-[#172033]">${user.address || 'H.No 12, Ward 3, Mandya'}</div>`}
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">Occupation</label>
                        ${isEdit ? `<input type="text" id="profile-occupation" class="w-full p-2 border border-[#CBD5E1] rounded text-sm text-[#172033]" value="${user.occupation || 'Agriculture'}">` : `<div class="text-sm font-semibold text-[#172033]">${user.occupation || 'Agriculture'}</div>`}
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">Account Status</label>
                    <span class="status-badge-green inline-block text-xs font-bold">Active Member</span>
                </div>
            </div>
        </div>
    `;

    return `
        <div class="space-y-6 animate-fade-in-up bg-white p-6 rounded-xl border border-[#D9E1EC] shadow-sm animate-fade-in-up">
            <!-- PROFILE HEADER -->
            ${headerHTML}

            <!-- TOP PROFILE CARDS -->
            ${topSectionHTML}

            <!-- GRID ROW 1: MEMBER INFORMATION + SHG PARTICIPATION -->
            <div class="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <!-- MEMBER INFORMATION -->
                <div class="bg-white p-5 rounded-xl border border-[#D9E1EC] shadow-sm space-y-3 fintech-card">
                    <h3 class="font-black text-base text-[#172033] border-b border-slate-100 pb-2">Member Information</h3>
                    <div class="space-y-2 text-xs">
                        <div class="flex justify-between items-center py-1 border-b border-slate-50">
                            <span class="text-[#475569]">Full Name</span>
                            <span class="font-bold text-[#172033]">${user.full_name}</span>
                        </div>
                        <div class="flex justify-between items-center py-1 border-b border-slate-50">
                            <span class="text-[#475569]">Member ID</span>
                            <span class="font-mono font-bold text-[#172033]">${memberId}</span>
                        </div>
                        <div class="flex justify-between items-center py-1 border-b border-slate-50">
                            <span class="text-[#475569]">Role</span>
                            <span class="font-bold text-[#172033]">${role}</span>
                        </div>
                        <div class="flex justify-between items-center py-1 border-b border-slate-50">
                            <span class="text-[#475569]">SHG Name</span>
                            <span class="font-bold text-[#172033]">${shgName}</span>
                        </div>
                        <div class="flex justify-between items-center py-1 border-b border-slate-50">
                            <span class="text-[#475569]">Joining Date</span>
                            <span class="font-bold text-[#172033]">15 Jan 2025</span>
                        </div>
                        <div class="flex justify-between items-center py-1">
                            <span class="text-[#475569]">Member Status</span>
                            <span class="status-badge-green font-bold text-[10px]">Active</span>
                        </div>
                    </div>
                </div>

                <!-- SHG PARTICIPATION -->
                <div class="bg-white p-5 rounded-xl border border-[#D9E1EC] shadow-sm space-y-3 fintech-card">
                    <h3 class="font-black text-base text-[#172033] border-b border-slate-100 pb-2">SHG Participation</h3>
                    <div class="space-y-2 text-xs">
                        <div class="flex justify-between items-center py-1 border-b border-slate-50">
                            <span class="text-[#475569]">Group Members</span>
                            <span class="font-bold text-[#172033]">10 Members</span>
                        </div>
                        <div class="flex justify-between items-center py-1 border-b border-slate-50">
                            <span class="text-[#475569]">Monthly Contribution</span>
                            <span class="font-bold text-[#172033]">₹1,000</span>
                        </div>
                        <div class="flex justify-between items-center py-1 border-b border-slate-50">
                            <span class="text-[#475569]">Contribution Status</span>
                            <span class="status-badge-green font-bold text-[10px]">Paid</span>
                        </div>
                        <div class="flex justify-between items-center py-1">
                            <span class="text-[#475569]">Group Role</span>
                            <span class="font-bold text-[#172033]">${role}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- GRID ROW 2: CONTACT INFORMATION + ACCOUNT ACTIVITY -->
            <div class="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <!-- CONTACT INFORMATION -->
                <div class="bg-white p-5 rounded-xl border border-[#D9E1EC] shadow-sm space-y-3 fintech-card">
                    <h3 class="font-black text-base text-[#172033] border-b border-slate-100 pb-2">Contact Information</h3>
                    <div class="space-y-2 text-xs">
                        <div class="flex justify-between items-center py-1 border-b border-slate-50">
                            <span class="text-[#475569]">📱 Mobile Number</span>
                            <span class="font-bold text-[#172033]">${user.mobile || user.phone || '+91 98765 43210'}</span>
                        </div>
                        <div class="flex justify-between items-center py-1">
                            <span class="text-[#475569]">✉ Email Address</span>
                            <span class="font-bold text-[#172033]">${user.email || 'lakshmi@example.com'}</span>
                        </div>
                        <div class="pt-2 flex justify-end">
                            <button onclick="appState.profileEditMode = true; renderApp();" class="btn-sky-custom text-xs px-4 py-2 rounded-lg font-bold">
                                Edit Contact Details
                            </button>
                        </div>
                    </div>
                </div>

                <!-- ACCOUNT ACTIVITY -->
                <div class="bg-white p-5 rounded-xl border border-[#D9E1EC] shadow-sm space-y-3 fintech-card">
                    <h3 class="font-black text-base text-[#172033] border-b border-slate-100 pb-2">Account Activity</h3>
                    <div class="space-y-2 text-xs">
                        <div class="flex justify-between items-center py-1 border-b border-slate-50">
                            <span class="text-[#475569]">Last Login</span>
                            <span class="font-bold text-[#172033]">Today, 10:30 AM</span>
                        </div>
                        <div class="flex justify-between items-center py-1 border-b border-slate-50">
                            <span class="text-[#475569]">Account Status</span>
                            <span class="text-emerald-600 font-bold">✓ Active</span>
                        </div>
                        <div class="flex justify-between items-center py-1 border-b border-slate-50">
                            <span class="text-[#475569]">Profile Status</span>
                            <span class="text-emerald-600 font-bold">✓ Verified</span>
                        </div>
                        <div class="flex justify-between items-center py-1">
                            <span class="text-[#475569]">Security Status</span>
                            <span class="text-emerald-600 font-bold">✓ Protected</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ACCOUNT SECURITY SUMMARY -->
            <div class="bg-white p-5 rounded-xl border border-[#D9E1EC] shadow-sm space-y-3 fintech-card border-t border-slate-100 pt-4">
                <div class="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 class="font-black text-base text-[#172033]">Account Security</h3>
                    <button onclick="appState.activeTab = 'security'; renderApp();" class="text-xs text-[#6D5DFB] hover:underline font-bold">
                        Manage Security &rarr;
                    </button>
                </div>
                <div class="grid grid-cols-3 gap-4 text-xs pt-1">
                    <div class="bg-[#F8FAFC] p-3 rounded-lg border border-[#D9E1EC]">
                        <span class="text-[#64748B] block text-[10px] font-extrabold uppercase mb-1">🔐 Password</span>
                        <span class="text-emerald-600 font-bold">Protected</span>
                    </div>
                    <div class="bg-[#F8FAFC] p-3 rounded-lg border border-[#D9E1EC]">
                        <span class="text-[#64748B] block text-[10px] font-extrabold uppercase mb-1">🛡 Account Security</span>
                        <span class="text-emerald-600 font-bold">Secure</span>
                    </div>
                    <div class="bg-[#F8FAFC] p-3 rounded-lg border border-[#D9E1EC]">
                        <span class="text-[#64748B] block text-[10px] font-extrabold uppercase mb-1">🔔 Notifications</span>
                        <span class="text-emerald-600 font-bold">Enabled</span>
                    </div>
                </div>
            </div>

            <!-- QUICK ACTIONS -->
            <div class="space-y-3 pt-4 border-t border-slate-100">
                <h3 class="font-extrabold text-sm text-[#172033] uppercase tracking-wider">Quick Actions</h3>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button onclick="appState.profileEditMode = true; renderApp();" class="btn-sky-custom text-xs py-3 rounded-lg text-center shadow-sm uppercase font-bold tracking-wider">
                        Edit Profile
                    </button>
                    <button onclick="appState.activeTab = 'shg'; renderApp();" class="btn-sky-custom text-xs py-3 rounded-lg text-center shadow-sm uppercase font-bold tracking-wider">
                        My SHG
                    </button>
                    <button onclick="appState.activeTab = 'finances'; renderApp();" class="btn-sky-custom text-xs py-3 rounded-lg text-center shadow-sm uppercase font-bold tracking-wider">
                        My Finances
                    </button>
                    <button onclick="appState.activeTab = 'security'; renderApp();" class="btn-sky-custom text-xs py-3 rounded-lg text-center shadow-sm uppercase font-bold tracking-wider">
                        My Security
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function saveProfileChanges() {
    setLoading(true);
    const mobile = document.getElementById('profile-mobile').value;
    const email = document.getElementById('profile-email').value;
    const address = document.getElementById('profile-address').value;
    const occupation = document.getElementById('profile-occupation').value;
    const profilePhoto = document.getElementById('profile-photo').value;
    
    appState.currentUser.mobile = mobile;
    appState.currentUser.email = email;
    appState.currentUser.address = address;
    appState.currentUser.occupation = occupation;
    appState.currentUser.profile_photo = profilePhoto;
    
    try {
        const res = await fetch('/api/member/profile/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mobile, email, address, occupation, profile_photo: profilePhoto
            })
        });
        const resData = await res.json();
        if (resData.success) {
            showToast("Profile updated successfully on secure server!", "success");
        } else {
            showToast("Profile updated locally in memory.", "success");
        }
    } catch (e) {
        showToast("Profile updated locally in memory (Demo Mode).", "success");
    }
    setLoading(false);
    renderApp();
}

async function changePasswordAction() {
    setLoading(true);
    const currentPass = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    
    if (!currentPass || !newPass) {
        showToast("Please fill all password fields.", "warning");
        setLoading(false);
        return;
    }
    
    try {
        const res = await fetch('/api/member/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                current_password: currentPass,
                new_password: newPass
            })
        });
        const resData = await res.json();
        if (resData.success) {
            showToast("Password changed successfully on secure server!", "success");
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
        } else {
            showToast(resData.error || "Password change failed.", "danger");
        }
    } catch (e) {
        showToast("Password updated locally in memory (Demo Mode).", "success");
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
    }
    setLoading(false);
    renderApp();
}

function renderMySHGViewHTML() {
    const listItems = appState.members.map((m, idx) => {
        const isPaid = m.status === 'VERIFIED';
        const memberId = getMemberIdForUser(m.username);
        return `
            <tr class="hover:bg-slate-50 transition border-b border-[#E4E0D7]">
                <td class="px-4 py-3 text-sm font-medium text-[#18233A]">${m.full_name}</td>
                <td class="px-4 py-3 text-xs font-mono text-[#5B6472] font-bold">${memberId}</td>
                <td class="px-4 py-3 text-sm font-bold text-[#18233A]">₹1,000</td>
                <td class="px-4 py-3">
                    <span class="status-pill text-[9px] px-2 py-0.5 rounded-full ${isPaid ? 'status-verified' : 'status-pending'}">
                        ${isPaid ? '✓ PAID' : 'PEND'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');

    const memberCardsHTML = appState.members.map((m, idx) => {
        const memberId = getMemberIdForUser(m.username);
        const isCurrentUser = appState.currentUser && m.username === appState.currentUser.username;
        const role = m.role || 'Member';
        
        return `
            <div class="bg-white p-4 rounded-xl border border-[#E4E0D7] shadow-sm flex items-center gap-3 fintech-card">
                <div class="w-10 h-10 rounded-full bg-[#ECE9E1] text-[#E87545] flex items-center justify-center font-bold text-lg shrink-0">
                    👤
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="text-sm font-bold text-[#18233A] truncate block">${m.full_name}</span>
                        ${isCurrentUser ? `
                            <span class="text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded uppercase">
                                YOU
                            </span>
                        ` : ''}
                    </div>
                    <span class="text-xs text-[#5B6472] block font-mono">${memberId}</span>
                    <span class="text-[10px] font-extrabold text-[#E87545] uppercase tracking-wider block mt-0.5">${role}</span>
                </div>
            </div>
        `;
    }).join('');

    const shgName = appState.shg ? appState.shg.name : 'Mahila Jyothi SHG';

    return `
        <div class="bg-white p-6 rounded-xl border border-[#D9E1EC] space-y-6 shadow-sm">
            <!-- 1. MY SHG DETAILS HEADER -->
            <div class="border-b border-[#D9E1EC] pb-4">
                <h2 class="font-black text-2xl text-[#172033]">My SHG Details</h2>
                <p class="text-sm text-[#52627A] mt-1">${shgName} &bull; Established: 15 Jan 2025</p>
            </div>
            
            <!-- 2. GROUP MEMBERS (OUR SHG MEMBERS) -->
            <div class="space-y-3">
                <div>
                    <h3 class="font-black text-lg text-[#172033]">Our SHG Members</h3>
                    <p class="text-xs text-[#52627A]">Meet the members of your Self Help Group</p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    ${memberCardsHTML}
                </div>
            </div>

            <!-- 3. GROUP FINANCIAL OVERVIEW -->
            <div class="space-y-3 pt-4 border-t border-slate-100">
                <h3 class="font-extrabold text-sm text-[#172033] uppercase tracking-wider">Group Financial Overview</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                    <div class="bg-[#F8FAFC] p-4 rounded-xl border border-[#D9E1EC]">
                        <span class="text-[#52627A] block text-xs font-bold uppercase mb-1">Total Members</span>
                        <span class="text-[#172033] font-black block text-lg">10 Members</span>
                    </div>
                    <div class="bg-[#F8FAFC] p-4 rounded-xl border border-[#D9E1EC]">
                        <span class="text-[#52627A] block text-xs font-bold uppercase mb-1">Group Balance</span>
                        <span class="text-[#172033] font-black block text-lg">₹2,10,000</span>
                    </div>
                    <div class="bg-[#F8FAFC] p-4 rounded-xl border border-[#D9E1EC]">
                        <span class="text-[#52627A] block text-xs font-bold uppercase mb-1">Monthly Contribution</span>
                        <span class="text-[#172033] font-black block text-lg">₹1,000 / member</span>
                    </div>
                    <div class="bg-[#F8FAFC] p-4 rounded-xl border border-[#D9E1EC]">
                        <span class="text-[#52627A] block text-xs font-bold uppercase mb-1">Current Cycle</span>
                        <span class="text-[#172033] font-black block text-lg">August 2026</span>
                    </div>
                </div>
            </div>

            <!-- 4. MEMBER PAYMENT STATUS -->
            <div class="space-y-3 pt-4 border-t border-slate-100">
                <h3 class="font-extrabold text-sm text-[#172033] uppercase tracking-wider">Member Payment Status</h3>
                <div class="overflow-x-auto border border-[#D9E1EC] rounded-xl bg-white shadow-sm">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-[#EEF2FF] text-xs font-bold text-[#172033] uppercase border-b border-[#D9E1EC]">
                                <th class="px-4 py-3">Member Name</th>
                                <th class="px-4 py-3">Member ID</th>
                                <th class="px-4 py-3">Expected</th>
                                <th class="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${listItems}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderMyFinancesViewHTML() {
    // 1. Resolve current user payments/status
    const myUser = appState.currentUser || { id: 1, username: 'lakshmi' };
    const myPayment = (appState.members || []).find(m => m.username === myUser.username || m.id === myUser.id);
    const isPaid = myPayment && myPayment.status === 'VERIFIED';
    const paidCount = (appState.members || []).filter(m => m.status === 'VERIFIED').length;
    const totalPaid = paidCount * 1000;
    const pendingDues = isPaid ? 0 : 1000;
    const monthlyContribution = 1000;
    const totalContributionsCount = paidCount;
    const percentage = paidCount * 10;

    // 2. Resolve recent payment history from transactions if available
    const payments = [
        { date: '2026-08-07', id: 'TXN-SHG-DEMO-0001', amount: '₹1,000', status: '✓ PAID' },
        { date: '2026-07-07', id: 'TXN-SHG-DEMO-771239', amount: '₹1,000', status: '✓ PAID' },
        { date: '2026-06-07', id: 'TXN-SHG-DEMO-661023', amount: '₹1,000', status: '✓ PAID' }
    ];

    const paymentRowsHTML = payments.map(p => `
        <tr class="hover:bg-[#F5F3FF] transition border-b border-[#D9E1EC]">
            <td class="px-4 py-3 text-sm font-bold text-[#172033]">${p.date}</td>
            <td class="px-4 py-3 text-xs font-mono text-[#52627A]">${p.id}</td>
            <td class="px-4 py-3 text-sm font-bold text-[#172033]">${p.amount}</td>
            <td class="px-4 py-3">
                <span class="status-badge-green">${p.status}</span>
            </td>
        </tr>
    `).join('');

    return `
        <div class="p-6 rounded-xl space-y-6 shadow-sm fintech-card">
            <!-- HEADER -->
            <div class="border-b border-slate-200/80 pb-4">
                <h2 class="font-black text-2xl">My Finances</h2>
                <p class="text-sm text-secondary mt-1">Overview of your contributions and balances.</p>
            </div>

            <!-- 1. FINANCIAL SUMMARY CARDS -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="p-4 rounded-xl shadow-sm fintech-card">
                    <span class="text-muted block text-[10px] font-extrabold uppercase mb-1">Total Paid</span>
                    <span class="font-black block text-2xl text-primary">₹${totalPaid.toLocaleString()}</span>
                </div>
                <div class="p-4 rounded-xl shadow-sm fintech-card">
                    <span class="text-muted block text-[10px] font-extrabold uppercase mb-1">Pending Dues</span>
                    <span class="font-black block text-2xl text-primary">₹${pendingDues.toLocaleString()}</span>
                </div>
                <div class="p-4 rounded-xl shadow-sm fintech-card">
                    <span class="text-muted block text-[10px] font-extrabold uppercase mb-1">Monthly Contribution</span>
                    <span class="font-black block text-2xl text-primary">₹${monthlyContribution.toLocaleString()}</span>
                </div>
                <div class="p-4 rounded-xl shadow-sm fintech-card">
                    <span class="text-muted block text-[10px] font-extrabold uppercase mb-1">Total Contributions</span>
                    <span class="font-black block text-2xl text-primary">${totalContributionsCount} Months</span>
                </div>
            </div>

            <!-- 2-COLUMN SECTION: PROGRESS + HEALTH -->
            <div class="grid md:grid-cols-2 gap-6">
                <!-- CONTRIBUTION PROGRESS -->
                <div class="p-5 rounded-xl shadow-sm space-y-4 fintech-card">
                    <h3 class="font-black text-base">Contribution Progress</h3>
                    <div class="space-y-2">
                        <div class="flex justify-between text-xs font-bold text-secondary">
                            <span>${totalContributionsCount} / 10 Months Completed</span>
                            <span>${percentage}%</span>
                        </div>
                        <div class="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                            <div class="bg-[#16A34A] h-full" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-2 pt-2 text-center border-t border-slate-100 dark:border-slate-800">
                        <div>
                            <span class="text-[9px] font-extrabold text-muted uppercase block">Paid</span>
                            <span class="text-xs font-bold text-primary">₹8,000</span>
                        </div>
                        <div>
                            <span class="text-[9px] font-extrabold text-muted uppercase block">Remaining</span>
                            <span class="text-xs font-bold text-primary">₹2,000</span>
                        </div>
                        <div>
                            <span class="text-[9px] font-extrabold text-muted uppercase block">Monthly</span>
                            <span class="text-xs font-bold text-primary">₹1,000</span>
                        </div>
                    </div>
                </div>

                <!-- FINANCIAL HEALTH -->
                <div class="p-5 rounded-xl shadow-sm flex flex-col justify-between fintech-card">
                    <h3 class="font-black text-base">Financial Health</h3>
                    <div class="space-y-3 my-auto pt-2">
                        <span class="status-badge-green text-sm inline-block">GOOD / LOW RISK</span>
                        <p class="text-xs text-secondary leading-relaxed">
                            Your contributions are currently up to date. Maintaining consistent monthly cycles protects your group risk score.
                        </p>
                    </div>
                </div>
            </div>

            <!-- PAYMENT HISTORY -->
            <div class="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div class="flex justify-between items-center">
                    <h3 class="font-extrabold text-sm uppercase tracking-wider">Recent Payment History</h3>
                    <button onclick="appState.activeTab = 'transactions'; renderApp();" class="text-xs text-[#E87545] hover:underline font-bold">
                        View All Transactions &rarr;
                    </button>
                </div>
                <div class="overflow-x-auto rounded-xl shadow-sm">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-100 dark:bg-slate-900 text-xs font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                                <th class="px-4 py-3">Date</th>
                                <th class="px-4 py-3">Transaction ID</th>
                                <th class="px-4 py-3">Amount</th>
                                <th class="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${paymentRowsHTML}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 2-COLUMN SECTION: LOAN & REPAYMENT + MONTHLY BREAKDOWN -->
            <div class="grid md:grid-cols-2 gap-6 border-t border-slate-100 pt-4">
                <!-- LOAN & REPAYMENT STATUS -->
                <div class="bg-white p-5 rounded-xl border border-[#D9E1EC] shadow-sm flex flex-col justify-between fintech-card">
                    <h3 class="font-black text-base text-[#172033]">Loan & Repayment Status</h3>
                    <div class="flex flex-col justify-center items-center py-6 text-center">
                        <div class="w-12 h-12 rounded-full bg-[#EEF2FF] text-[#6D5DFB] flex items-center justify-center font-bold text-lg mb-2">
                            ✔
                        </div>
                        <span class="text-sm font-bold text-[#172033]">No Active Loan</span>
                        <p class="text-xs text-[#64748B] mt-1">You currently have no outstanding loan cycles.</p>
                    </div>
                </div>

                <!-- MONTHLY CONTRIBUTION BREAKDOWN (CLEAN VISUAL BAR CHART) -->
                <div class="bg-white p-5 rounded-xl border border-[#E4E0D7] shadow-sm flex flex-col justify-between fintech-card">
                    <div class="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                        <h3 class="font-black text-base text-[#18233A]">Monthly Contribution</h3>
                        <span class="text-[10px] font-extrabold uppercase text-[#E87545] bg-[#FFF3EB] px-2 py-0.5 rounded-full border border-[#FED7AA]">₹1,000 / mo</span>
                    </div>

                    <!-- Chart Container with explicit height and high-contrast styling -->
                    <div class="w-full h-36 flex items-end justify-between gap-2 pt-3 pb-2 px-3 bg-[#FAFAF7] rounded-xl border border-[#E4E0D7]">
                        <!-- March -->
                        <div class="flex flex-col items-center justify-end h-full flex-1 gap-1.5">
                            <span class="text-[10px] font-extrabold text-[#18233A]">₹1,000</span>
                            <div class="w-full max-w-[32px] h-20 bg-[#E87545] rounded-t-md shadow-sm transition hover:brightness-110"></div>
                            <span class="text-[9px] font-extrabold text-[#5B6472] uppercase">Mar</span>
                        </div>
                        <!-- April -->
                        <div class="flex flex-col items-center justify-end h-full flex-1 gap-1.5">
                            <span class="text-[10px] font-extrabold text-[#18233A]">₹1,000</span>
                            <div class="w-full max-w-[32px] h-20 bg-[#E87545] rounded-t-md shadow-sm transition hover:brightness-110"></div>
                            <span class="text-[9px] font-extrabold text-[#5B6472] uppercase">Apr</span>
                        </div>
                        <!-- May -->
                        <div class="flex flex-col items-center justify-end h-full flex-1 gap-1.5">
                            <span class="text-[10px] font-extrabold text-[#18233A]">₹1,000</span>
                            <div class="w-full max-w-[32px] h-20 bg-[#E87545] rounded-t-md shadow-sm transition hover:brightness-110"></div>
                            <span class="text-[9px] font-extrabold text-[#5B6472] uppercase">May</span>
                        </div>
                        <!-- June -->
                        <div class="flex flex-col items-center justify-end h-full flex-1 gap-1.5">
                            <span class="text-[10px] font-extrabold text-[#18233A]">₹1,000</span>
                            <div class="w-full max-w-[32px] h-20 bg-[#E87545] rounded-t-md shadow-sm transition hover:brightness-110"></div>
                            <span class="text-[9px] font-extrabold text-[#5B6472] uppercase">Jun</span>
                        </div>
                        <!-- July -->
                        <div class="flex flex-col items-center justify-end h-full flex-1 gap-1.5">
                            <span class="text-[10px] font-extrabold text-[#18233A]">₹1,000</span>
                            <div class="w-full max-w-[32px] h-20 bg-[#E87545] rounded-t-md shadow-sm transition hover:brightness-110"></div>
                            <span class="text-[9px] font-extrabold text-[#5B6472] uppercase">Jul</span>
                        </div>
                        <!-- August (Current Month) -->
                        <div class="flex flex-col items-center justify-end h-full flex-1 gap-1.5">
                            <span class="text-[10px] font-extrabold ${isPaid ? 'text-[#16834B]' : 'text-[#E87545]'}">₹1,000</span>
                            <div class="w-full max-w-[32px] h-20 ${isPaid ? 'bg-[#16834B]' : 'bg-[#E87545]'} rounded-t-md shadow-sm transition hover:brightness-110"></div>
                            <span class="text-[9px] font-extrabold ${isPaid ? 'text-[#16834B]' : 'text-[#E87545]'} uppercase">Aug</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- QUICK ACTIONS -->
            <div class="space-y-3 pt-4 border-t border-slate-100">
                <h3 class="font-extrabold text-sm text-[#172033] uppercase tracking-wider">Quick Actions</h3>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button onclick="appState.activeTab = 'transactions'; renderApp();" class="btn-sky-custom text-xs py-3 rounded-lg text-center shadow-sm uppercase font-bold tracking-wider">
                        View Passbook
                    </button>
                    <button onclick="appState.activeTab = 'transactions'; renderApp();" class="btn-sky-custom text-xs py-3 rounded-lg text-center shadow-sm uppercase font-bold tracking-wider">
                        View Transactions
                    </button>
                    <button onclick="appState.activeTab = 'shg'; renderApp();" class="btn-sky-custom text-xs py-3 rounded-lg text-center shadow-sm uppercase font-bold tracking-wider">
                        Check Payment Status
                    </button>
                    <button onclick="appState.activeTab = 'concern'; renderApp();" class="btn-sky-custom text-xs py-3 rounded-lg text-center shadow-sm uppercase font-bold tracking-wider">
                        Report Concern
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderMyTransactionsViewHTML() {
    const listItems = [
        { date: '15 Aug 2026', id: 'TXN-001', amount: '₹1,000', status: '✓ Verified', color: 'text-green-600' },
        { date: '15 Jul 2026', id: 'TXN-002', amount: '₹1,000', status: '✓ Verified', color: 'text-green-600' },
        { date: '15 Jun 2026', id: 'TXN-003', amount: '₹1,000', status: '✓ Verified', color: 'text-green-600' }
    ].map(t => `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
            <td class="px-4 py-3 text-sm font-bold text-slate-800">${t.date}</td>
            <td class="px-4 py-3 text-xs font-mono text-slate-500">${t.id}</td>
            <td class="px-4 py-3 text-sm font-bold text-slate-800">${t.amount}</td>
            <td class="px-4 py-3 text-xs font-bold ${t.color}">${t.status}</td>
            <td class="px-4 py-3 text-right">
                <button onclick="showToast('Receipt downloaded', 'success')" class="text-xs text-[#2563EB] hover:underline font-bold">Download Receipt</button>
            </td>
        </tr>
    `).join('');

    return `
        <div class="bg-white p-6 rounded-xl border border-slate-200 space-y-6 shadow-sm">
            <div class="border-b border-slate-100 pb-4">
                <h2 class="font-black text-2xl text-slate-800">Transaction History</h2>
                <p class="text-sm text-slate-500 mt-1">Your recent payments and contributions.</p>
            </div>
            <div class="overflow-x-auto border border-slate-200 rounded-xl">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                            <th class="px-4 py-3">Date</th>
                            <th class="px-4 py-3">Transaction ID</th>
                            <th class="px-4 py-3">Amount</th>
                            <th class="px-4 py-3">Status</th>
                            <th class="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${listItems}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}



function renderMySecurityViewHTML() {
    return `
        <div class="space-y-6">
            <div class="border-b border-slate-200 pb-4">
                <h2 class="font-black text-2xl text-[#172033]">My Security</h2>
                <p class="text-sm text-[#475569] mt-1">Manage your account security and verify transaction safety.</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- 1. PASSWORD & LOGIN SECURITY -->
                <div class="bg-white p-5 rounded-xl border border-[#D8E1EC] shadow-sm space-y-4 fintech-card">
                    <h3 class="text-md font-bold text-[#172033] flex items-center gap-2">
                        <span>🔐</span> Password & Login Security
                    </h3>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">Current Password</label>
                            <input type="password" class="w-full p-2.5 border border-[#D8E1EC] rounded-lg text-sm bg-white text-[#172033]" value="********">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">New Password</label>
                            <input type="password" id="new-pwd-input" oninput="const val = this.value; const ind = document.getElementById('pwd-strength-indicator'); if(!val){ind.className='hidden';}else if(val.length < 6){ind.textContent='Password strength: Weak'; ind.className='text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded mt-1 inline-block';}else if(val.length < 10){ind.textContent='Password strength: Medium'; ind.className='text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded mt-1 inline-block';}else{ind.textContent='Password strength: Strong'; ind.className='text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded mt-1 inline-block';}" class="w-full p-2.5 border border-[#D8E1EC] rounded-lg text-sm bg-white text-[#172033]" placeholder="Enter new password">
                            <span id="pwd-strength-indicator" class="hidden"></span>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-[#475569] uppercase tracking-wider mb-1">Confirm New Password</label>
                            <input type="password" class="w-full p-2.5 border border-[#D8E1EC] rounded-lg text-sm bg-white text-[#172033]" placeholder="Confirm new password">
                        </div>
                        <button onclick="showToast('Password updated securely', 'success')" class="w-full bg-[#E87545] hover:bg-[#D66434] text-white font-bold text-xs py-3 rounded-lg transition uppercase tracking-wider shadow-sm">
                            Update Password
                        </button>
                    </div>
                </div>

                <!-- 2. ACCOUNT SECURITY STATUS -->
                <div class="bg-white p-5 rounded-xl border border-[#D8E1EC] shadow-sm space-y-4 fintech-card">
                    <h3 class="text-md font-bold text-[#172033] flex items-center gap-2">
                        <span>🛡️</span> Account Security Status
                    </h3>
                    <div class="space-y-3.5 pt-1">
                        <div class="flex items-center justify-between py-1 border-b border-slate-100">
                            <span class="text-sm text-[#475569]">Security Level</span>
                            <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 badge-enabled-active" style="color: #0B1F18 !important; -webkit-text-fill-color: #0B1F18 !important; font-weight: 800 !important; opacity: 1 !important; text-shadow: none !important;">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> SECURE
                            </span>
                        </div>
                        <div class="flex items-center justify-between py-1 border-b border-slate-100">
                            <span class="text-sm text-[#475569]">Password Protection</span>
                            <span class="text-xs font-bold text-emerald-600 flex items-center gap-1">✓ Active</span>
                        </div>
                        <div class="flex items-center justify-between py-1 border-b border-slate-100">
                            <span class="text-sm text-[#475569]">Login Protection</span>
                            <span class="text-xs font-bold text-emerald-600 flex items-center gap-1">✓ Enabled</span>
                        </div>
                        <div class="flex items-center justify-between py-1 border-b border-slate-100">
                            <span class="text-sm text-[#475569]">Session Protection</span>
                            <span class="text-xs font-bold text-emerald-600 flex items-center gap-1">✓ Active</span>
                        </div>
                        <div class="flex items-center justify-between py-1">
                            <span class="text-sm text-[#475569]">Last Security Check</span>
                            <span class="text-xs font-bold text-emerald-600 flex items-center gap-1">✓ Verified</span>
                        </div>
                    </div>
                </div>

                <!-- 3. TWO-STEP VERIFICATION -->
                <div class="bg-white p-5 rounded-xl border border-[#D8E1EC] shadow-sm space-y-4 fintech-card">
                    <h3 class="text-md font-bold text-[#172033] flex items-center gap-2">
                        <span>🔑</span> Two-Step Verification
                    </h3>
                    <div class="space-y-3">
                        <p class="text-xs text-[#475569]">Protect your SHG account with an additional verification step.</p>
                        <div class="flex items-center justify-between p-2.5 border border-[#D8E1EC] rounded-lg">
                            <span class="text-sm font-semibold text-[#172033]">Two-Step Verification (Demo Preference)</span>
                            <input type="checkbox" checked class="w-4 h-4 text-[#2563EB] rounded">
                        </div>
                        <div class="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg">
                            <p class="text-xs font-semibold text-[#166534]">✓ Your account has additional login protection enabled (Demo preference).</p>
                        </div>
                    </div>
                </div>

                <!-- 4. LOGIN ACTIVITY -->
                <div class="bg-white p-5 rounded-xl border border-[#D8E1EC] shadow-sm space-y-4 fintech-card">
                    <h3 class="text-md font-bold text-[#172033] flex items-center gap-2">
                        <span>💻</span> Recent Login Activity
                    </h3>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between p-2.5 border border-[#D8E1EC] rounded-lg text-left">
                            <div>
                                <p class="text-sm font-bold text-[#172033]">Chrome • Windows</p>
                                <p class="text-xs text-[#475569]">Today</p>
                            </div>
                            <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 badge-enabled-active" style="color: #0B1F18 !important; -webkit-text-fill-color: #0B1F18 !important; font-weight: 800 !important; opacity: 1 !important; text-shadow: none !important;">Active</span>
                        </div>
                        <div class="flex items-center justify-between p-2.5 border border-[#D8E1EC] rounded-lg text-left">
                            <div>
                                <p class="text-sm font-bold text-[#172033]">Chrome • Windows</p>
                                <p class="text-xs text-[#475569]">Yesterday</p>
                            </div>
                            <span class="text-xs font-bold text-[#475569]">Successful</span>
                        </div>
                        <div class="flex items-center justify-between p-2.5 border border-[#D8E1EC] rounded-lg text-left">
                            <div>
                                <p class="text-sm font-bold text-[#172033]">Mobile Browser</p>
                                <p class="text-xs text-[#475569]">2 days ago</p>
                            </div>
                            <span class="text-xs font-bold text-[#475569]">Successful</span>
                        </div>
                        <div class="flex justify-end pt-1">
                            <button onclick="showToast('Demo: Full security log visible on admin dashboard.', 'info')" class="text-xs font-bold text-[#2563EB] hover:underline">VIEW ALL ACTIVITY →</button>
                        </div>
                    </div>
                </div>

                <!-- 5. SECURITY ALERTS -->
                <div class="bg-white p-5 rounded-xl border border-[#D8E1EC] shadow-sm space-y-4 fintech-card">
                    <h3 class="text-md font-bold text-[#172033] flex items-center gap-2">
                        <span>🚨</span> Security Alerts
                    </h3>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between p-2.5 border border-[#D8E1EC] rounded-lg">
                            <span class="text-sm font-semibold text-[#172033]">Unusual Login Alerts</span>
                            <input type="checkbox" checked class="w-4 h-4 text-[#2563EB] rounded">
                        </div>
                        <div class="flex items-center justify-between p-2.5 border border-[#D8E1EC] rounded-lg">
                            <span class="text-sm font-semibold text-[#172033]">Transaction Security Alerts</span>
                            <input type="checkbox" checked class="w-4 h-4 text-[#2563EB] rounded">
                        </div>
                        <div class="flex items-center justify-between p-2.5 border border-[#D8E1EC] rounded-lg">
                            <span class="text-sm font-semibold text-[#172033]">Loan Activity Alerts</span>
                            <input type="checkbox" checked class="w-4 h-4 text-[#2563EB] rounded">
                        </div>
                        <div class="flex items-center justify-between p-2.5 border border-[#D8E1EC] rounded-lg">
                            <span class="text-sm font-semibold text-[#172033]">Suspicious Activity Alerts</span>
                            <input type="checkbox" checked class="w-4 h-4 text-[#2563EB] rounded">
                        </div>
                    </div>
                </div>

                <!-- 6. SESSION SECURITY -->
                <div class="bg-white p-5 rounded-xl border border-[#D8E1EC] shadow-sm space-y-4 fintech-card">
                    <h3 class="text-md font-bold text-[#172033] flex items-center gap-2">
                        <span>⏱️</span> Session Security
                    </h3>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-xs font-bold text-[#475569] mb-1">Automatic Logout</label>
                            <select class="w-full p-2.5 border border-[#D8E1EC] rounded-lg text-sm bg-white text-[#172033]">
                                <option>15 minutes</option>
                                <option selected>30 minutes</option>
                                <option>1 hour</option>
                            </select>
                        </div>
                        <div class="flex justify-between items-center py-1">
                            <span class="text-sm text-[#475569]">Active Sessions</span>
                            <span class="text-sm font-bold text-[#172033]">1 Active</span>
                        </div>
                        <div class="flex justify-between items-center py-1 border-b border-slate-100">
                            <span class="text-sm text-[#475569]">Current Device</span>
                            <span class="text-sm font-bold text-[#172033]">Chrome • Windows</span>
                        </div>
                        <button onclick="showToast('Demo: Other sessions terminated.', 'success')" class="w-full p-2.5 bg-[#F1F5F9] border border-[#D8E1EC] text-[#172033] font-bold text-xs rounded-lg hover:bg-[#E2E8F0] transition">
                            SIGN OUT OTHER SESSIONS
                        </button>
                    </div>
                </div>
            </div>

            <!-- 7. FINANCIAL SECURITY PROTECTION -->
            <div class="bg-white p-5 rounded-xl border border-[#D8E1EC] shadow-sm space-y-4 fintech-card">
                <h3 class="text-md font-bold text-[#172033] flex items-center gap-2">
                    <span>💰</span> Financial Security
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-3">
                        <div class="flex items-center justify-between py-1.5 border-b border-slate-100">
                            <span class="text-sm text-[#475569]">Transaction Verification</span>
                            <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 badge-enabled-active" style="color: #0B1F18 !important; -webkit-text-fill-color: #0B1F18 !important; font-weight: 800 !important; opacity: 1 !important; text-shadow: none !important;">Enabled</span>
                        </div>
                        <div class="flex items-center justify-between py-1.5 border-b border-slate-100">
                            <span class="text-sm text-[#475569]">Payment Confirmation</span>
                            <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 badge-enabled-active" style="color: #0B1F18 !important; -webkit-text-fill-color: #0B1F18 !important; font-weight: 800 !important; opacity: 1 !important; text-shadow: none !important;">Enabled</span>
                        </div>
                        <div class="flex items-center justify-between py-1.5">
                            <span class="text-sm text-[#475569]">Unauthorized Transaction Detection</span>
                            <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 badge-enabled-active" style="color: #0B1F18 !important; -webkit-text-fill-color: #0B1F18 !important; font-weight: 800 !important; opacity: 1 !important; text-shadow: none !important;">Active</span>
                        </div>
                    </div>
                    <div class="p-4 bg-[#F8FAFC] border border-[#D8E1EC] rounded-lg flex flex-col justify-center">
                        <p class="text-xs font-semibold text-[#475569] leading-relaxed">
                            "SHG-Secure helps members identify unexpected or unauthorized financial activity through transaction visibility and alerts."
                        </p>
                    </div>
                </div>
            </div>

            <!-- 8. SECURITY TIPS -->
            <div class="bg-white p-5 rounded-xl border border-[#D8E1EC] shadow-sm space-y-4 fintech-card">
                <h3 class="text-md font-bold text-[#172033] flex items-center gap-2">
                    <span>💡</span> Security Tips
                </h3>
                <ul class="list-disc pl-5 text-xs text-[#475569] space-y-2">
                    <li>Never share your PIN or password.</li>
                    <li>Verify every group payment before confirming.</li>
                    <li>Keep digital receipts for every transaction.</li>
                    <li>Report unknown transactions immediately.</li>
                    <li>Check your group ledger regularly.</li>
                </ul>
            </div>
        </div>
    `;
}

function getSynchronizedAlerts() {
    const alerts = [];
    const myUser = appState.currentUser || { id: 1, username: 'lakshmi', full_name: 'Lakshmi Devi' };
    
    // 1. Check Flagged / Unusual Expenses (e.g. ₹1,50,000 Dairy feed & packaging expense)
    (appState.expenses || []).forEach(exp => {
        if (exp.status === 'PENDING' || exp.status === 'UNDER_REVIEW' || exp.amount > 50000) {
            const myVote = (exp.verifications || []).find(v => v.username === myUser.username);
            const hasVoted = myVote && myVote.response && myVote.response !== 'PENDING';
            const voteText = hasVoted ? myVote.response : null;
            
            alerts.push({
                id: `exp-${exp.id}`,
                type: 'EXPENSE_ANOMALY',
                severity: 'HIGH / ANOMALY',
                severityBadge: 'HIGH / ANOMALY',
                title: 'UNUSUAL GROUP EXPENSE FLAGGED',
                amount: exp.amount,
                formattedAmount: `₹${Number(exp.amount).toLocaleString('en-IN')}`,
                description: exp.purpose,
                date: exp.date,
                voteCast: voteText,
                canVote: !hasVoted,
                txType: 'EXPENSE',
                txId: exp.id,
                source: 'expense',
                status: 'ACTIVE',
                isUnread: true
            });
        }
    });

    // 2. Check Flagged / Unauthorized Loans (e.g. ₹3,00,000 Andhra Bank loan)
    (appState.loans || []).forEach(loan => {
        if (loan.status === 'UNDER_REVIEW' || loan.status === 'PENDING_VERIFICATION' || loan.id === 2) {
            const myVote = (loan.verifications || []).find(v => v.username === myUser.username);
            const hasVoted = myVote && myVote.response && myVote.response !== 'PENDING';
            const voteText = hasVoted ? myVote.response : null;
            
            let awareCount = 0;
            let unauthCount = 0;
            if (loan.verifications && loan.verifications.length > 0) {
                unauthCount = loan.verifications.filter(v => v.response === 'UNAWARE' || v.response === 'DISPUTED').length;
                awareCount = loan.verifications.filter(v => v.response === 'AWARE' || v.response === 'APPROVED').length;
            }

            alerts.push({
                id: `loan-${loan.id}`,
                type: 'UNAUTHORIZED_LOAN',
                severity: 'CRITICAL / FRAUD',
                severityBadge: 'CRITICAL / FRAUD',
                title: 'UNAUTHORIZED LOAN DETECTED',
                amount: loan.amount,
                formattedAmount: `₹${Number(loan.amount).toLocaleString('en-IN')}`,
                description: `${loan.bank_name} - ${loan.purpose}`,
                date: loan.sanctioned_date || '2026-08-08 10:00:00',
                voteCast: voteText,
                canVote: !hasVoted,
                awareCount: awareCount,
                unauthCount: unauthCount,
                txType: 'LOAN',
                txId: loan.id,
                source: 'loan',
                status: 'ACTIVE',
                isUnread: true
            });
        }
    });

    // 3. Database Risk Alerts (from risk_alerts table in SQLite)
    (appState.alerts || []).forEach(al => {
        const isExpAlert = al.alert_type === 'UNUSUAL_ACTIVITY' && al.description.includes('1,50,000');
        const isLoanAlert = al.alert_type === 'UNUSUAL_ACTIVITY' && al.description.includes('3,00,000');
        
        if (!isExpAlert && !isLoanAlert) {
            let title = 'RISK ALERT';
            let severity = 'WARNING';
            if (al.alert_type === 'SHORTFALL') {
                title = 'REPAYMENT SHORTFALL ALERT';
                severity = 'MEDIUM / WARNING';
            } else if (al.alert_type === 'DEADLINE') {
                title = 'DEADLINE CRITICAL WARNING';
                severity = 'CRITICAL';
            } else if (al.alert_type === 'MISMATCH') {
                title = 'LEDGER MISMATCH DETECTED';
                severity = 'HIGH';
            }

            alerts.push({
                id: `risk-${al.id}`,
                type: al.alert_type,
                severity: severity,
                severityBadge: al.alert_type === 'DEADLINE' ? 'CRITICAL' : 'WARNING',
                title: title,
                amount: null,
                formattedAmount: null,
                description: al.description,
                date: al.created_at || '2026-08-08 18:00:00',
                voteCast: null,
                canVote: false,
                source: 'risk_alert',
                status: al.status,
                isUnread: true
            });
        }
    });

    // 4. Payment verified status notification
    const myPayment = (appState.members || []).find(m => m.username === myUser.username || m.id === myUser.id);
    if (myPayment && myPayment.status === 'VERIFIED') {
        alerts.push({
            id: `pay-verified-${myUser.id}`,
            type: 'PAYMENT_VERIFIED',
            severity: 'SAFE / SUCCESS',
            severityBadge: 'SUCCESS',
            title: 'PAYMENT VERIFIED',
            amount: 1000,
            formattedAmount: '₹1,000',
            description: `Your August contribution of ₹1,000 was verified successfully. Txn ID: ${myPayment.txn_id || 'TXN-SHG-2026-0001'}`,
            date: myPayment.payment_date || '2026-08-07 10:00:00',
            voteCast: null,
            canVote: false,
            source: 'payment',
            status: 'RESOLVED',
            isUnread: false
        });
    }

    return alerts;
}

function renderMyAlertsViewHTML() {
    const rawAlerts = getSynchronizedAlerts();
    const dismissed = appState.dismissedAlerts || [];
    const alerts = rawAlerts.filter(a => !dismissed.includes(a.id));

    let alertsListHTML = '';
    if (alerts.length === 0) {
        alertsListHTML = `
            <div class="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <span class="text-3xl block mb-2">🎉</span>
                <h4 class="font-extrabold text-sm text-slate-800">All Clear! No Active Security Alerts</h4>
                <p class="text-xs text-slate-500 mt-1">Your group transactions and ledger verifications are up to date.</p>
            </div>
        `;
    } else {
        alertsListHTML = alerts.map(alert => {
            if (alert.type === 'EXPENSE_ANOMALY') {
                return `
                    <div class="p-5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3 shadow-sm accent-alerts transition">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div class="flex items-center gap-2">
                                <span class="text-base">⚠️</span>
                                <span class="text-xs font-black text-amber-800 uppercase tracking-wider">${alert.title}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">${alert.severityBadge}</span>
                                <button onclick="dismissAlert('${alert.id}');" class="text-xs text-slate-400 hover:text-slate-700 font-bold ml-1">✕</button>
                            </div>
                        </div>
                        <div>
                            <h4 class="font-black text-sm text-slate-900">${alert.formattedAmount} — ${alert.description}</h4>
                            <p class="text-xs text-slate-500 font-medium mt-0.5">Logged on ${alert.date}</p>
                        </div>
                        <div class="flex flex-wrap justify-between items-center pt-2 border-t border-amber-200/60 text-xs">
                            ${alert.voteCast ? `
                                <span class="text-[11px] font-bold text-slate-700">Vote Cast: <span class="font-black ${alert.voteCast === 'UNAWARE' || alert.voteCast === 'DISPUTED' ? 'text-red-700' : 'text-emerald-800'}">${alert.voteCast}</span></span>
                            ` : `
                                <div class="flex gap-2">
                                    <button onclick="castExpenseVote(${alert.txId}, 'APPROVED');" class="bg-emerald-800 hover:bg-emerald-950 text-white font-extrabold text-[10px] px-3 py-1.5 rounded transition uppercase tracking-wider">APPROVE</button>
                                    <button onclick="castExpenseVote(${alert.txId}, 'DISPUTED');" class="bg-red-700 hover:bg-red-800 text-white font-extrabold text-[10px] px-3 py-1.5 rounded transition uppercase tracking-wider">DISPUTE</button>
                                </div>
                            `}
                            <span class="text-[10px] text-slate-400 font-semibold italic">Requires Member Consensus</span>
                        </div>
                    </div>
                `;
            } else if (alert.type === 'UNAUTHORIZED_LOAN') {
                return `
                    <div class="p-5 bg-red-50/80 border border-red-200 rounded-xl space-y-3 shadow-sm accent-danger transition">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div class="flex items-center gap-2">
                                <span class="text-base">🚨</span>
                                <span class="text-xs font-black text-red-700 uppercase tracking-wider">${alert.title}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-200/80 text-red-900 border border-red-300">${alert.severityBadge}</span>
                                <button onclick="dismissAlert('${alert.id}');" class="text-xs text-slate-400 hover:text-slate-700 font-bold ml-1">✕</button>
                            </div>
                        </div>
                        <div>
                            <h4 class="font-black text-sm text-slate-900">${alert.formattedAmount} — ${alert.description}</h4>
                            <p class="text-xs text-slate-500 font-medium mt-0.5">Logged on ${alert.date}</p>
                            ${alert.awareCount !== undefined ? `
                                <div class="mt-2 flex gap-3 text-[11px]">
                                    <span class="text-emerald-700 font-black">✓ ${alert.awareCount} Aware</span>
                                    <span class="text-red-700 font-black">⚠ ${alert.unauthCount} Unaware/Disputed</span>
                                </div>
                            ` : ''}
                        </div>
                        <div class="flex flex-wrap justify-between items-center pt-2 border-t border-red-200/60 text-xs">
                            ${alert.voteCast ? `
                                <span class="text-[11px] font-bold text-slate-700">Vote Cast: <span class="font-black ${alert.voteCast === 'UNAWARE' || alert.voteCast === 'DISPUTED' ? 'text-red-700' : 'text-emerald-800'}">${alert.voteCast}</span></span>
                            ` : `
                                <div class="flex gap-2">
                                    <button onclick="castLoanVote(${alert.txId}, 'AWARE');" class="bg-emerald-800 hover:bg-emerald-950 text-white font-extrabold text-[10px] px-3 py-1.5 rounded transition uppercase tracking-wider">AWARE</button>
                                    <button onclick="castLoanVote(${alert.txId}, 'UNAWARE');" class="bg-red-700 hover:bg-red-800 text-white font-extrabold text-[10px] px-3 py-1.5 rounded transition uppercase tracking-wider">UNAWARE</button>
                                </div>
                            `}
                            <span class="text-[10px] text-slate-400 font-semibold italic">Unauthorized Loan Sanction</span>
                        </div>
                    </div>
                `;
            } else if (alert.type === 'PAYMENT_VERIFIED') {
                return `
                    <div class="p-4 bg-green-50 border border-green-200 rounded-xl flex justify-between items-center gap-3">
                        <div class="min-w-0 flex-1">
                            <span class="alert-title text-green-800 font-bold text-sm block">Payment Verified</span>
                            <span class="alert-message text-green-700 text-xs block mt-0.5">${alert.description}</span>
                            <span class="text-[10px] text-slate-400 font-semibold block mt-0.5">${alert.date}</span>
                        </div>
                        <button onclick="dismissAlert('${alert.id}');" class="alert-dismiss-btn text-xs font-bold text-green-700 hover:underline cursor-pointer shrink-0 whitespace-nowrap ml-2">Dismiss</button>
                    </div>
                `;
            } else {
                return `
                    <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl flex justify-between items-center gap-3">
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                                <span class="alert-title text-amber-800 font-bold text-sm block">${alert.title}</span>
                                <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">${alert.severityBadge}</span>
                            </div>
                            <span class="alert-message text-amber-900 text-xs block mt-1">${alert.description}</span>
                            <span class="text-[10px] text-slate-400 font-semibold block mt-0.5">${alert.date}</span>
                        </div>
                        <button onclick="dismissAlert('${alert.id}');" class="alert-dismiss-btn text-xs font-bold text-amber-800 hover:underline cursor-pointer shrink-0 whitespace-nowrap ml-2">Dismiss</button>
                    </div>
                `;
            }
        }).join('');
    }

    return `
        <div class="bg-white p-6 rounded-xl border border-slate-200 space-y-6 shadow-sm fintech-card">
            <div class="border-b border-slate-100 pb-4 flex justify-between items-start gap-3">
                <div class="min-w-0 flex-1">
                    <h2 class="font-black text-2xl text-slate-800">My Alerts</h2>
                    <p class="text-sm text-slate-500 mt-1">Notifications about your group, transactions, and security flags.</p>
                </div>
                <button onclick="clearAllAlerts();" class="text-xs text-slate-500 hover:text-slate-800 font-bold underline shrink-0 whitespace-nowrap pt-1">Clear All</button>
            </div>
            <div class="space-y-3">
                ${alertsListHTML}
            </div>
        </div>
    `;
}

function dismissAlert(alertId) {
    if (!appState.dismissedAlerts) appState.dismissedAlerts = [];
    if (!appState.dismissedAlerts.includes(alertId)) {
        appState.dismissedAlerts.push(alertId);
    }
    showToast("Alert dismissed", "info");
    renderApp();
}

function clearAllAlerts() {
    const rawAlerts = getSynchronizedAlerts();
    appState.dismissedAlerts = rawAlerts.map(a => a.id);
    showToast("All alerts cleared", "success");
    renderApp();
}

function getMemberIdForUser(username) {
    const mapping = {
        'lakshmi': 'SHG001-M01',
        'anitha': 'SHG001-M02',
        'sujatha': 'SHG001-M03',
        'radha': 'SHG001-M04',
        'kavitha': 'SHG001-M05',
        'maya': 'SHG001-M06',
        'saroja': 'SHG001-M07',
        'latha': 'SHG001-M08',
        'geetha': 'SHG001-M09',
        'shanti': 'SHG001-M10'
    };
    return mapping[username] || 'N/A';
}

function renderMySettingsViewHTML() {
    const user = appState.currentUser || {};
    const username = user.username || '';
    const memberId = getMemberIdForUser(username);
    const shgName = appState.shg ? appState.shg.name : 'Mahila Jyothi SHG';
    const role = user.role || 'Member';
    const status = 'ACTIVE';

    return `
        <div class="space-y-6">
            <div class="border-b border-slate-200 pb-4">
                <h2 class="font-black text-2xl text-[#172033]">Settings</h2>
                <p class="text-sm text-[#475569] mt-1">Application preferences and security controls.</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- 1. LANGUAGE & REGION -->
                <div class="bg-white p-5 rounded-xl border border-[#D8E1EC] shadow-sm space-y-4 fintech-card">
                    <h3 class="text-md font-bold text-[#172033] flex items-center gap-2">
                        <span>🌐</span> Language & Region
                    </h3>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-xs font-bold text-[#475569] mb-1">Language</label>
                            <select class="w-full p-2.5 border border-[#D8E1EC] rounded-lg text-sm bg-white text-[#172033] focus:outline-none focus:border-[#2563EB]">
                                <option value="en">English</option>
                                <option value="te">Telugu</option>
                                <option value="hi">Hindi</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-[#475569] mb-1">Region</label>
                            <select class="w-full p-2.5 border border-[#D8E1EC] rounded-lg text-sm bg-white text-[#172033] focus:outline-none focus:border-[#2563EB]">
                                <option value="in">India</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- 2. NOTIFICATION PREFERENCES -->
                <div class="bg-white p-5 rounded-xl border border-[#D8E1EC] shadow-sm space-y-4 fintech-card">
                    <h3 class="text-md font-bold text-[#172033] flex items-center gap-2">
                        <span>🔔</span> Notification Preferences
                    </h3>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between p-2.5 border border-[#D8E1EC] rounded-lg">
                            <span class="text-sm font-semibold text-[#172033]">Email Notifications</span>
                            <input type="checkbox" checked class="w-4 h-4 text-[#2563EB] rounded">
                        </div>
                        <div class="flex items-center justify-between p-2.5 border border-[#D8E1EC] rounded-lg">
                            <span class="text-sm font-semibold text-[#172033]">SMS Alerts</span>
                            <input type="checkbox" checked class="w-4 h-4 text-[#2563EB] rounded">
                        </div>
                        <div class="flex items-center justify-between p-2.5 border border-[#D8E1EC] rounded-lg">
                            <span class="text-sm font-semibold text-[#172033]">Push Notifications</span>
                            <input type="checkbox" checked class="w-4 h-4 text-[#2563EB] rounded">
                        </div>
                        <div class="flex items-center justify-between p-2.5 border border-[#D8E1EC] rounded-lg">
                            <span class="text-sm font-semibold text-[#172033]">Payment Alerts</span>
                            <input type="checkbox" checked class="w-4 h-4 text-[#2563EB] rounded">
                        </div>
                        <div class="flex items-center justify-between p-2.5 border border-[#D8E1EC] rounded-lg">
                            <span class="text-sm font-semibold text-[#172033]">Loan / Repayment Reminders</span>
                            <input type="checkbox" checked class="w-4 h-4 text-[#2563EB] rounded">
                        </div>
                        <div class="flex items-center justify-between p-2.5 border border-[#D8E1EC] rounded-lg">
                            <span class="text-sm font-semibold text-[#172033]">Security Alerts (Required)</span>
                            <input type="checkbox" checked disabled class="w-4 h-4 text-[#2563EB] rounded cursor-not-allowed">
                        </div>
                    </div>
                </div>

                <!-- 3. APPEARANCE & THEME -->
                <div class="bg-white p-5 rounded-xl border border-[#E4E0D7] shadow-sm space-y-4 fintech-card">
                    <div class="flex justify-between items-center border-b border-slate-100 pb-2.5">
                        <h3 class="font-extrabold text-sm text-[#18233A] uppercase tracking-wider flex items-center gap-2">
                            <span>🎨</span> Appearance & Theme
                        </h3>
                        <span id="theme-active-badge" class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${getTheme() === 'dark' ? 'bg-[#172554] text-[#38BDF8] border border-[#38BDF8]/40' : 'bg-[#FFF3EB] text-[#E87545] border border-[#FED7AA]'}">
                            ${getTheme() === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}
                        </span>
                    </div>
                    <div class="space-y-3">
                        <label class="block text-xs font-bold text-[#5B6472] mb-1">Select Interface Theme</label>
                        <div class="grid grid-cols-2 gap-3">
                            <button id="theme-btn-light" type="button" onclick="setTheme('light')" class="theme-control-btn ${getTheme() === 'light' ? 'active-theme-btn' : 'inactive-theme-btn'} flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-extrabold transition shadow-sm cursor-pointer" title="Switch to Light Theme">
                                <span>☀️</span> Light Mode
                            </button>
                            <button id="theme-btn-dark" type="button" onclick="setTheme('dark')" class="theme-control-btn ${getTheme() === 'dark' ? 'active-theme-btn' : 'inactive-theme-btn'} flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-extrabold transition shadow-sm cursor-pointer" title="Switch to Dark Theme">
                                <span>🌙</span> Dark Mode
                            </button>
                        </div>
                        <p class="text-[11px] text-[#5B6472] mt-1">Preference is automatically synchronized and saved across all pages and sessions.</p>
                    </div>
                </div>

                <!-- 4. SECURITY SETTINGS -->
                <div class="bg-white p-5 rounded-xl border border-[#D8E1EC] shadow-sm space-y-4 fintech-card">
                    <h3 class="text-md font-bold text-[#172033] flex items-center gap-2">
                        <span>🛡️</span> Security
                    </h3>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between py-1.5 border-b border-slate-100">
                            <span class="text-sm font-semibold text-[#172033]">Login Security</span>
                            <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 badge-enabled-active" style="color: #0B1F18 !important; -webkit-text-fill-color: #0B1F18 !important; font-weight: 800 !important; opacity: 1 !important; text-shadow: none !important;">Enabled</span>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-[#475569] mb-1">Session Timeout</label>
                            <select class="w-full p-2 border border-[#D8E1EC] rounded-lg text-sm bg-white text-[#172033]">
                                <option>15 minutes</option>
                                <option selected>30 minutes</option>
                                <option>1 hour</option>
                            </select>
                        </div>
                        <div class="flex items-center justify-between p-2.5 border border-[#D8E1EC] rounded-lg">
                            <span class="text-sm font-semibold text-[#172033]">Two-Step Verification</span>
                            <input type="checkbox" checked class="w-4 h-4 text-[#2563EB] rounded">
                        </div>
                        <div class="flex justify-between items-center pt-1.5">
                            <span class="text-xs text-[#64748B]">Last active session info</span>
                            <button onclick="showToast('Demo Mode: Session log clean.', 'info')" class="text-xs font-bold text-[#2563EB] hover:underline">View Activity →</button>
                        </div>
                    </div>
                </div>

                <!-- 5. PRIVACY -->
                <div class="bg-white p-5 rounded-xl border border-[#D8E1EC] shadow-sm space-y-4 fintech-card">
                    <h3 class="text-md font-bold text-[#172033] flex items-center gap-2">
                        <span>🔒</span> Privacy
                    </h3>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between p-2.5 border border-[#D8E1EC] rounded-lg">
                            <span class="text-sm font-semibold text-[#172033]">Show Financial Details</span>
                            <input type="checkbox" checked class="w-4 h-4 text-[#2563EB] rounded">
                        </div>
                        <div class="flex items-center justify-between p-2.5 border border-[#D8E1EC] rounded-lg">
                            <span class="text-sm font-semibold text-[#172033]">Allow Security Notifications</span>
                            <input type="checkbox" checked class="w-4 h-4 text-[#2563EB] rounded">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-[#475569] mb-1">Data Visibility</label>
                            <select class="w-full p-2 border border-[#D8E1EC] rounded-lg text-sm bg-white text-[#172033]">
                                <option>Group Members Only</option>
                                <option>Public (Restricted)</option>
                                <option>Private (Self Only)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- 6. ACCOUNT INFORMATION -->
                <div class="bg-white p-5 rounded-xl border border-[#D8E1EC] shadow-sm space-y-4 fintech-card">
                    <h3 class="text-md font-bold text-[#172033] flex items-center gap-2">
                        <span>👤</span> Account
                    </h3>
                    <div class="space-y-2.5 pt-1">
                        <div class="flex justify-between items-center py-1.5 border-b border-slate-100">
                            <span class="text-sm text-[#475569]">Member ID</span>
                            <span class="text-sm font-bold text-[#172033]">${memberId}</span>
                        </div>
                        <div class="flex justify-between items-center py-1.5 border-b border-slate-100">
                            <span class="text-sm text-[#475569]">Group</span>
                            <span class="text-sm font-bold text-[#172033]">${shgName}</span>
                        </div>
                        <div class="flex justify-between items-center py-1.5 border-b border-slate-100">
                            <span class="text-sm text-[#475569]">Account Type</span>
                            <span class="text-sm font-bold text-[#172033]">${role}</span>
                        </div>
                        <div class="flex justify-between items-center py-1.5">
                            <span class="text-sm text-[#475569]">Status</span>
                            <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 badge-enabled-active" style="color: #0B1F18 !important; -webkit-text-fill-color: #0B1F18 !important; font-weight: 800 !important; opacity: 1 !important; text-shadow: none !important;">${status}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 7. HELP & SUPPORT -->
            <div class="bg-white p-5 rounded-xl border border-[#D8E1EC] shadow-sm space-y-4 fintech-card">
                <h3 class="text-md font-bold text-[#172033] flex items-center gap-2">
                    <span>❓</span> Help & Support
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <button onclick="showToast('Demo: FAQ documentation loaded.', 'info')" class="flex items-center justify-between p-3 border border-[#D8E1EC] rounded-lg hover:bg-slate-50 transition text-left">
                        <div>
                            <p class="text-sm font-bold text-[#172033]">FAQ</p>
                            <p class="text-xs text-[#475569]">Browse guide files</p>
                        </div>
                        <span class="text-xs font-bold text-[#2563EB]">Open FAQ →</span>
                    </button>
                    
                    <button onclick="appState.activeTab = 'report_concern'; window.history.pushState(null, '', '/report-concern'); renderApp();" class="flex items-center justify-between p-3 border border-[#D8E1EC] rounded-lg hover:bg-slate-50 transition text-left">
                        <div>
                            <p class="text-sm font-bold text-[#172033]">Report Concern</p>
                            <p class="text-xs text-[#475569]">Submit security issues</p>
                        </div>
                        <span class="text-xs font-bold text-[#2563EB]">Report Concern →</span>
                    </button>
                    
                    <button onclick="showToast('Demo Mode: Support line open at support@shg-secure.org', 'info')" class="flex items-center justify-between p-3 border border-[#D8E1EC] rounded-lg hover:bg-slate-50 transition text-left">
                        <div>
                            <p class="text-sm font-bold text-[#172033]">Contact Support</p>
                            <p class="text-xs text-[#475569]">Talk to security team</p>
                        </div>
                        <span class="text-xs font-bold text-[#2563EB]">Contact Support →</span>
                    </button>
                </div>
            </div>

            <!-- 8. SAVE PREFERENCES BUTTON -->
            <div class="pt-4 flex justify-end">
                <button onclick="showToast('Preferences saved successfully', 'success')" class="bg-[#E87545] hover:bg-[#D66434] text-white font-bold text-xs py-3 px-8 rounded-lg transition uppercase tracking-wider shadow-md">
                    Save Preferences
                </button>
            </div>
        </div>
    `;
}


function runPresentationTour() {
    showToast("Starting Competition Presentation Tour...", "info");
    const scenarios = ['A', 'B', 'C', 'D', 'E'];
    let i = 0;
    const interval = setInterval(() => {
        if (i < scenarios.length) {
            selectDemoScenario(scenarios[i]);
            i++;
        } else {
            clearInterval(interval);
            showToast("Presentation Tour Completed!", "success");
        }
    }, 2500);
}

function toggleDemoOverlay() {
    const overlay = document.getElementById('demo-overlay-panel');
    const arrow = document.getElementById('demo-toggle-arrow');
    if (!overlay) return;
    
    if (overlay.classList.contains('hidden')) {
        overlay.classList.remove('hidden');
        if (arrow) arrow.textContent = '▲';
    } else {
        overlay.classList.add('hidden');
        if (arrow) arrow.textContent = '▼';
    }
}


function initApp() {
    fetchState();
}


function clearToasts() {
    const container = document.getElementById('toast-container');
    if (container) container.innerHTML = '';
}

function renderGroupChatViewHTML() {
    const isLeader = appState.currentUser && (appState.currentUser.role === 'LEADER' || appState.currentUser.username === 'lakshmi');
    
    const membersListHTML = appState.members.map(m => {
        const isOnline = true;
        return `
            <div class="flex items-center gap-2 py-1.5 border-b border-[#E2E8F0] last:border-0">
                <span class="w-2 h-2 rounded-full ${isOnline ? 'bg-[#16A34A]' : 'bg-slate-300'}"></span>
                <span class="text-xs font-bold text-[#172033] truncate">${m.full_name}</span>
            </div>
        `;
    }).join('');

    return `
        <div class="chat-container fintech-card">
            <!-- Header bar (Compact Auto Height) -->
            <div class="chat-header flex justify-between items-center shrink-0 flex-wrap gap-2">
                <div>
                    <h2 class="font-black text-lg sm:text-xl text-[#18233A] leading-tight">💬 SHG Group Chat</h2>
                    <p class="text-[11px] text-[#5B6472] mt-0.5">${getSHGName()} &bull; <span class="text-[#16834B] font-bold">● 10 Members Online</span></p>
                </div>
                
                <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <!-- Search bar -->
                    <div class="relative w-40 sm:w-56">
                        <input type="text" id="chat-search" oninput="filterChatMessages(this.value)" placeholder="🔍 Search messages..." class="w-full text-xs p-2 rounded-lg border border-[#E4E0D7] focus:outline-none bg-white text-[#18233A]" />
                    </div>
                    <!-- View Members Toggle (Mobile only) -->
                    <button onclick="toggleMembersPanel()" class="lg:hidden text-xs text-[#18233A] font-bold border border-[#E4E0D7] px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 transition shadow-sm">
                        👤 Members
                    </button>
                </div>
            </div>

            <!-- Announcements Area (Compact Auto Height) -->
            <div id="chat-announcements-container" class="chat-announcements-container shrink-0">
                ${renderAnnouncementsSectionHTML(isLeader)}
            </div>

            <!-- Main Layout: Chat Area + Side panel (Chat takes remaining viewport space) -->
            <div class="chat-main-section">
                <!-- Left Panel: Chat messages stream (75%) -->
                <div class="chat-stream-column">
                    <!-- Messages Stream Area (Scrolls internally, receives all remaining space) -->
                    <div id="chat-messages-stream" class="chat-messages">
                        <!-- Load messages dynamically -->
                    </div>

                    <!-- Message Input Composer (Fixed at bottom of chat card) -->
                    <div class="chat-composer">
                        <button onclick="showToast('Attachments are view-only in demo mode', 'info')" class="p-2.5 border border-[#E4E0D7] bg-white rounded-lg hover:bg-slate-50 text-[#5B6472] font-bold shrink-0 transition" title="Add Attachment">
                            📎
                        </button>
                        <input type="text" id="chat-input-field" placeholder="Write a message..." 
                            onkeydown="if(event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendChatMessage(); }"
                            class="flex-1 text-xs sm:text-sm p-2.5 rounded-lg border border-[#E4E0D7] focus:outline-none bg-white text-[#18233A]" />
                        <button onclick="sendChatMessage()" class="bg-[#E87545] hover:bg-[#D66434] text-white px-4 sm:px-5 py-2.5 text-xs uppercase tracking-wider font-bold shadow-sm rounded-lg shrink-0 transition">
                            Send ➤
                        </button>
                    </div>
                </div>

                <!-- Right Panel: Members Panel (25%) -->
                <div id="chat-members-panel" class="hidden lg:block space-y-2 bg-white lg:bg-transparent absolute lg:relative z-10 right-0 top-0 shadow-lg lg:shadow-none p-3 lg:p-0 rounded-xl">
                    <div class="flex justify-between items-center border-b border-[#E4E0D7] pb-1">
                        <h4 class="font-bold text-xs uppercase tracking-wider text-[#18233A]">Group Members</h4>
                        <span class="text-[10px] bg-[#ECE9E1] text-[#18233A] px-2 py-0.5 rounded-full font-bold border border-[#DDD8CC]">10 Online</span>
                    </div>
                    <div class="space-y-0.5">
                        ${membersListHTML}
                    </div>

                    <!-- Group Info Summary -->
                    <div class="border-t border-[#E4E0D7] pt-2 mt-2 space-y-1">
                        <h5 class="font-bold text-[10px] uppercase tracking-wider text-[#5B6472]">Group Info</h5>
                        <div class="text-[10px] space-y-0.5 text-[#5B6472]">
                            <div>Group: <span class="font-bold text-[#18233A]">${getSHGName()}</span></div>
                            <div>Leader: <span class="font-bold text-[#18233A]">Lakshmi Devi</span></div>
                            <div>Cycle: <span class="font-bold text-[#18233A]">Monthly</span></div>
                            <div>Status: <span class="text-[#16834B] font-bold">✓ Active</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderAnnouncementsSectionHTML(isLeader) {
    if (!appState.announcements || appState.announcements.length === 0) {
        return isLeader ? `
            <div class="flex justify-between items-center bg-[#FFFFFF] p-2 rounded-xl border border-[#E4E0D7]">
                <span class="text-xs text-[#5B6472] italic">No active announcements.</span>
                <button onclick="addAnnouncementPrompt()" class="text-xs text-[#18233A] hover:underline font-bold">+ Post Announcement</button>
            </div>
        ` : '';
    }
    
    return appState.announcements.map(a => `
        <div class="chat-announcement-box bg-[#FFFFFF] border border-[#E4E0D7] p-2.5 rounded-xl text-[#18233A] relative shadow-sm flex flex-col gap-1">
            <div class="flex justify-between items-start">
                <span class="text-[10px] font-black tracking-wider uppercase text-[#18233A]">📢 IMPORTANT ANNOUNCEMENT</span>
                <div class="flex gap-2">
                    ${isLeader ? `
                        <button onclick="removeAnnouncement(${a.id})" class="text-[10px] text-[#C62828] hover:underline font-bold">Remove</button>
                    ` : ''}
                </div>
            </div>
            <p class="text-xs font-semibold text-[#18233A] leading-snug">${a.text}</p>
            <div class="flex justify-between items-center text-[9px] text-[#5B6472] font-medium border-t border-[#E4E0D7] pt-1 mt-0.5">
                <span>Posted by: <strong class="text-[#18233A]">${a.postedBy}</strong></span>
                <span>Date: ${a.date}</span>
            </div>
        </div>
    `).join('') + (isLeader ? `
        <div class="text-right mt-1">
            <button onclick="addAnnouncementPrompt()" class="text-[11px] text-[#E87545] hover:underline font-bold">+ Post Another</button>
        </div>
    ` : '');
}

function renderChatMessagesList(messages) {
    const stream = document.getElementById('chat-messages-stream');
    if (!stream) return;
    
    if (messages.length === 0) {
        stream.innerHTML = `<div class="flex items-center justify-center h-full text-xs text-[#5B6472] italic">No messages found.</div>`;
        return;
    }
    
    const isLeader = appState.currentUser && (appState.currentUser.role === 'LEADER' || appState.currentUser.username === 'lakshmi');
    
    stream.innerHTML = messages.map((m, idx) => {
        const isSelf = appState.currentUser && m.username === appState.currentUser.username;
        const alignClass = isSelf ? 'justify-end' : 'justify-start';
        const bgClass = isSelf ? 'bg-[#18233A] text-[#FAFAF7] rounded-tr-none shadow-sm' : 'bg-[#FAFAF7] text-[#18233A] rounded-tl-none border border-[#E4E0D7] shadow-sm';
        const nameColor = isSelf ? 'text-[#18233A] text-right' : 'text-[#18233A]';
        
        const avatarEmoji = m.username === 'lakshmi' ? '👩' : (m.username === 'anitha' ? '👩‍🦰' : (m.username === 'sujatha' ? '👱‍♀️' : '👤'));
        
        return `
            <div class="chat-message-row flex ${alignClass} w-full animate-fade-in-up gap-2 items-start">
                ${!isSelf ? `
                    <div class="chat-avatar w-7 h-7 rounded-full bg-[#ECE9E1] text-[#18233A] flex items-center justify-center font-bold text-xs shrink-0 border border-[#DDD8CC]">
                        ${avatarEmoji}
                    </div>
                ` : ''}
                <div class="chat-bubble-wrapper max-w-[75%] sm:max-w-[70%]">
                    <div class="sender-row flex items-center gap-2 ${isSelf ? 'justify-end' : ''} px-1 mb-1">
                        <span class="text-[10px] font-bold uppercase tracking-wide ${nameColor}">${m.sender}</span>
                        <span class="text-[9px] text-[#5B6472]">${m.time}</span>
                        ${m.pinned ? `
                            <span class="text-[9px] text-[#E87545] font-bold">📌 Pinned</span>
                        ` : ''}
                    </div>
                    <div class="message-bubble p-2 sm:p-2.5 rounded-2xl shadow-sm relative ${bgClass}">
                        <p class="text-xs sm:text-sm font-normal whitespace-pre-wrap leading-relaxed">${m.message}</p>
                        
                        <!-- Leader context actions -->
                        ${isLeader ? `
                            <div class="message-actions mt-1 pt-1 border-t ${isSelf ? 'border-slate-600' : 'border-[#E4E0D7]'} flex gap-3 text-[10px] font-bold">
                                <button onclick="pinChatMessage(${idx})" class="${isSelf ? 'text-slate-300 hover:text-white' : 'text-[#18233A] hover:underline'}">
                                    ${m.pinned ? 'Unpin' : 'Pin'}
                                </button>
                                <button onclick="deleteChatMessage(${idx})" class="text-[#C62828] hover:underline">
                                    Delete
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
                ${isSelf ? `
                    <div class="chat-avatar w-7 h-7 rounded-full bg-[#ECE9E1] text-[#18233A] flex items-center justify-center font-bold text-xs shrink-0 border border-[#DDD8CC]">
                        ${avatarEmoji}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    stream.scrollTop = stream.scrollHeight;
}

function renderChatMessagesOnly() {
    const isLeader = appState.currentUser && (appState.currentUser.role === 'LEADER' || appState.currentUser.username === 'lakshmi');
    const announcementsContainer = document.getElementById('chat-announcements-container');
    if (announcementsContainer) {
        announcementsContainer.innerHTML = renderAnnouncementsSectionHTML(isLeader);
    }
    renderChatMessagesList(appState.chatMessages);
}

function sendChatMessage() {
    const input = document.getElementById('chat-input-field');
    if (!input) return;
    const msgText = input.value.trim();
    if (!msgText) return;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
    
    appState.chatMessages.push({
        sender: appState.currentUser ? appState.currentUser.full_name : 'Lakshmi Devi',
        username: appState.currentUser ? appState.currentUser.username : 'lakshmi',
        message: msgText,
        time: timeStr,
        date: dateStr
    });
    
    input.value = '';
    renderChatMessagesOnly();
}

function filterChatMessages(query) {
    const q = query.toLowerCase();
    const messages = appState.chatMessages;
    const filtered = q ? messages.filter(m => m.message.toLowerCase().includes(q) || m.sender.toLowerCase().includes(q)) : messages;
    renderChatMessagesList(filtered);
}

function toggleMembersPanel() {
    const panel = document.getElementById('chat-members-panel');
    if (panel) {
        panel.classList.toggle('hidden');
        panel.classList.toggle('block');
    }
}
window.toggleMembersPanel = toggleMembersPanel;

function deleteChatMessage(index) {
    appState.chatMessages.splice(index, 1);
    renderChatMessagesOnly();
}

// Global scope hooks for onclick bindings in string templates
window.sendChatMessage = sendChatMessage;
window.filterChatMessages = filterChatMessages;
window.deleteChatMessage = deleteChatMessage;

function pinChatMessage(index) {
    const msg = appState.chatMessages[index];
    if (msg) {
        msg.pinned = !msg.pinned;
        showToast(msg.pinned ? 'Message pinned' : 'Message unpinned', 'success');
        renderChatMessagesOnly();
    }
}
window.pinChatMessage = pinChatMessage;

function addAnnouncementPrompt() {
    const text = prompt('Enter the announcement text:');
    if (!text) return;
    appState.announcements.push({
        id: Date.now(),
        text: text,
        postedBy: appState.currentUser ? `Group Leader (${appState.currentUser.full_name})` : 'Group Leader',
        date: new Date().toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
    });
    renderChatMessagesOnly();
}
window.addAnnouncementPrompt = addAnnouncementPrompt;

function removeAnnouncement(id) {
    appState.announcements = appState.announcements.filter(a => a.id !== id);
    renderChatMessagesOnly();
}
window.removeAnnouncement = removeAnnouncement;

// Hook into renderApp to automatically boot and populate chat frames on view switch
const _oldRenderApp = renderApp;
renderApp = function() {
    _oldRenderApp();
    if (appState.activeTab === 'group_chat') {
        renderChatMessagesOnly();
    }
};


// Delegated 3D mouse/cursor micro-lighting interaction for premium cards
document.addEventListener('mousemove', (e) => {
    const card = e.target.closest('.fintech-card, .glass-panel');
    if (!card) return;
    if (window.matchMedia('(hover: none)').matches) return;
    
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Very gentle subtle tilt (max 1.2 deg) with realistic top-left elevation
    const rotateX = ((centerY - y) / centerY) * 1.2;
    const rotateY = ((x - centerX) / centerX) * 1.2;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
});

document.addEventListener('mouseout', (e) => {
    const card = e.target.closest('.fintech-card, .glass-panel');
    if (!card) return;
    const related = e.relatedTarget;
    if (related && card.contains(related)) return;
    
    card.style.transform = '';
    card.style.boxShadow = '';
});

