// SENTRY // Fraud & Risk Operations Console Dataset
// Visual-First Architecture: Chart Curves, Radial Donut Data, Geolocation Hops & Card Skins

const SENTRY_DATA = {
  systemMetrics: {
    shift: "Day Operations (EMEA / AMER)",
    analyst: "Hannah Cole",
    analystRole: "Senior Fraud Analyst (L3)",
    openAlertsCount: 24,
    criticalQueueCount: 8,
    mttdSeconds: 42,
    mttrMinutes: 3.4,
    falsePositiveRate: "2.1%",
    totalExaminedToday: 142,
    autoBlockedToday: 1840,
    riskAppetiteThreshold: 75
  },

  alerts: [
    {
      id: "ALT-8921",
      caseId: "CASE-4401",
      customer: {
        id: "CUST-90412",
        name: "Eleanor Vance",
        email: "e.vance@vancetech.io",
        phone: "+1 (212) 555-0194",
        accountAge: "4y 2m",
        kycLevel: "Verified Tier 3",
        trustTier: "Gold (At Risk)",
        lifetimeVolume: "$482,900",
        priorDisputes: 0,
        activeCards: 3,
        avgMonthlySpend: "$9,400",
        homeLocation: "New York, USA"
      },
      cardVisual: {
        type: "Visa Business Platinum",
        panMasked: "•••• 8912",
        cardholder: "ELEANOR VANCE",
        expiry: "08/29",
        gradient: "linear-gradient(135deg, #FE678A 0%, #FF85A0 100%)",
        brand: "VISA",
        chipColor: "#FDE047",
        status: "FLAGGED_FOR_FREEZE"
      },
      transaction: {
        id: "TX-9904218",
        amount: 8450.00,
        currency: "USD",
        amountFormatted: "$8,450.00",
        type: "Instant External Wire",
        merchant: "Panama Global Vault Remit SA",
        mcc: "6051 — Quasi-Cash / Currency",
        paymentMethod: "Business Checking (•••• 8912)",
        timestamp: "Today 01:14 UTC (6m ago)",
        velocity10m: "$8,450.00",
        velocity24h: "$14,800.00",
        baselineNormal: "$120.00"
      },
      // Velocity curve: 7 intervals leading up to current spike
      velocityCurve: {
        labels: ["00:00", "00:20", "00:40", "00:50", "01:00", "01:10", "01:14"],
        baselineValues: [85, 120, 90, 110, 130, 120, 125],
        actualValues:   [85, 120, 90, 110, 480, 2400, 8450],
        spikeValue: "$8,450",
        spikeLabel: "ANOMALOUS OUTBOUND WIRE"
      },
      // Geolocation hop diagram
      geoHop: {
        origin: { name: "New York (Billing)", lat: 40.71, lon: -74.00, ip: "72.14.201.12", country: "US" },
        destination: { name: "Amsterdam (Tor Exit)", lat: 52.36, lon: 4.90, ip: "185.220.101.44", country: "NL" },
        distanceKm: "5,860 km",
        timeDeltaMin: "42 min",
        speedKmh: "8,790 km/h",
        isImpossible: true,
        verdict: "IMPOSSIBLE TRAVEL: Mach 7.1 Velocity Violation"
      },
      beneficiary: {
        name: "Panama Wire Escrow Trust 9812-X",
        bank: "Banco Nacional de Panamá",
        accountNumber: "PA89-0120-0094-1182-9901",
        addedAgo: "18m before transaction",
        isNew: true,
        riskRating: "CRITICAL_WATCHLIST",
        fatfJurisdiction: "High Scrutiny (FATF Gray List)"
      },
      device: {
        fingerprint: "fp_9f4b23_c91d8e",
        osReported: "macOS 14.5 (Safari)",
        actualHardware: "Linux x86_64 (Puppeteer Headless)",
        isMismatch: true,
        isTor: true,
        isVpn: true,
        screenRes: "1920x1080 (Virtual)",
        deviceHistory: "First seen 42 min ago"
      },
      riskSpectrum: {
        totalScore: 94,
        grade: "HIGH_RISK",
        recommendation: "BLOCK & FREEZE ACCOUNT",
        breakdown: [
          { category: "Device Spoofing", score: 32, max: 35, color: "#FE678A", icon: "laptop" },
          { category: "Impossible Travel", score: 28, max: 30, color: "#FE678A", icon: "plane" },
          { category: "Velocity Spike", score: 22, max: 20, color: "#4496C8", icon: "trendingUp" },
          { category: "New Beneficiary", score: 12, max: 15, color: "#4496C8", icon: "bank" }
        ]
      },
      entityGraph: [
        { from: "Customer: Eleanor Vance", to: "Account ••••8912", status: "clean", label: "Owner (4y)" },
        { from: "Account ••••8912", to: "Tor Exit Amsterdam", status: "danger", label: "Hijacked Session" },
        { from: "Tor Exit Amsterdam", to: "Panama Wire Escrow", status: "danger", label: "Outbound $8,450" }
      ],
      timeline: [
        { time: "3 mo ago", title: "Authorized Baseline", desc: "Routine payroll from New York MacBook Pro (IP 72.14.x)", type: "clean" },
        { time: "Yesterday 22:14", title: "Password Reset OTP", desc: "Recovery link triggered via Android Chrome mobile", type: "warning" },
        { time: "Today 00:32", title: "Tor Exit Node Login", desc: "Amsterdam IP 185.220.x, Linux Puppeteer headless user-agent", type: "critical" },
        { time: "Today 00:56", title: "Beneficiary Added", desc: "Panama Wire Escrow Trust linked without step-up auth", type: "critical" },
        { time: "Today 01:14 (NOW)", title: "Outbound Wire ($8,450)", desc: "Rule 402 & Rule 109 triggered. Held in analyst queue", type: "current" }
      ],
      triggeredRules: [
        { id: "RULE-402", name: "NEW_BENEFICIARY_AMOUNT_GT_5K", severity: "CRITICAL" },
        { id: "RULE-109", name: "IMPOSSIBLE_TRAVEL_GEO_DELTA", severity: "CRITICAL" },
        { id: "RULE-214", name: "TOR_DATACENTER_PROXY_INGRESS", severity: "HIGH" }
      ],
      status: "HIGH_RISK",
      ruleConflict: false,
      analystDecision: null
    },

    {
      id: "ALT-8920",
      caseId: "CASE-4402",
      customer: {
        id: "CUST-38109",
        name: "Marcus Aurelius Thorne",
        email: "m.thorne@thorne-holdings.co.uk",
        phone: "+44 20 7946 0912",
        accountAge: "6y 8m",
        kycLevel: "Verified Tier 1",
        trustTier: "VIP Platinum",
        lifetimeVolume: "$2,450,000",
        priorDisputes: 0,
        activeCards: 4,
        avgMonthlySpend: "$28,000",
        homeLocation: "London, UK"
      },
      cardVisual: {
        type: "Metal World Elite Debit",
        panMasked: "•••• 4091",
        cardholder: "MARCUS A THORNE",
        expiry: "11/28",
        gradient: "linear-gradient(135deg, #4496C8 0%, #68B4E2 100%)",
        brand: "MASTERCARD",
        chipColor: "#E2E8F0",
        status: "RULE_CONFLICT_HOLD"
      },
      transaction: {
        id: "TX-9904215",
        amount: 4200.00,
        currency: "EUR",
        amountFormatted: "€4,200.00",
        type: "POS Chip & PIN / Luxury Hotel",
        merchant: "Hôtel Plaza Athénée Paris",
        mcc: "7011 — Luxury Lodging & Resorts",
        paymentMethod: "Metal Platinum Debit (•••• 4091)",
        timestamp: "Today 01:08 UTC (12m ago)",
        velocity10m: "€4,200.00",
        velocity24h: "€4,200.00",
        baselineNormal: "€1,200.00"
      },
      velocityCurve: {
        labels: ["00:00", "00:20", "00:40", "00:50", "01:00", "01:05", "01:08"],
        baselineValues: [200, 350, 280, 420, 500, 450, 480],
        actualValues:   [200, 350, 280, 420, 500, 450, 4200],
        spikeValue: "€4,200",
        spikeLabel: "HOTEL CHECK-IN AUTHORIZATION"
      },
      geoHop: {
        origin: { name: "London (Billing)", lat: 51.50, lon: -0.12, ip: "82.165.197.1", country: "GB" },
        destination: { name: "Paris (Hotel POS)", lat: 48.85, lon: 2.35, ip: "194.199.228.18", country: "FR" },
        distanceKm: "340 km",
        timeDeltaMin: "4h 20m",
        speedKmh: "78 km/h",
        isImpossible: false,
        verdict: "PLAUSIBLE TRAVEL: Eurostar Train Transit Match"
      },
      beneficiary: {
        name: "Hôtel Plaza Athénée Paris",
        bank: "BNP Paribas SA",
        accountNumber: "FR76-3000-4001-2800-0194",
        addedAgo: "Point of Sale Merchant",
        isNew: false,
        riskRating: "TIER_1_REPUTABLE",
        fatfJurisdiction: "Standard EEA"
      },
      device: {
        fingerprint: "fp_pos_ingenico_plaza",
        osReported: "Ingenico POS Terminal",
        actualHardware: "EMV Chip & Contactless Reader",
        isMismatch: false,
        isTor: false,
        isVpn: false,
        screenRes: "Embedded Display",
        deviceHistory: "Verified via Visa 3DS 2.2"
      },
      riskSpectrum: {
        totalScore: 62,
        grade: "RULE_CONFLICT",
        recommendation: "OVERRIDE & ALLOW (VIP TRAVEL)",
        breakdown: [
          { category: "Geo Cross-Border Rule 301", score: 40, max: 40, color: "#FE678A", icon: "alertTriangle" },
          { category: "VIP Whitelist Policy 012", score: -20, max: 20, color: "#4496C8", icon: "shieldCheck" },
          { category: "Reputable Merchant Score", score: 2, max: 20, color: "#4496C8", icon: "bank" },
          { category: "Spend Within VIP Tier", score: 0, max: 20, color: "#4496C8", icon: "checkCircle" }
        ]
      },
      entityGraph: [
        { from: "Customer: Marcus Thorne", to: "Card ••••4091", status: "clean", label: "VIP Platinum" },
        { from: "Card ••••4091", to: "Paris Eurostar Terminal", status: "clean", label: "Transit Validated" },
        { from: "Paris Eurostar Terminal", to: "Hôtel Plaza Athénée", status: "warning", label: "Rule Conflict Hold" }
      ],
      timeline: [
        { time: "2 days ago", title: "CRM Travel Notice", desc: "Private banker logged upcoming 1-week Paris trip", type: "clean" },
        { time: "Yesterday 18:40", title: "London Heathrow Coffee", desc: "Verified contactless payment at Heathrow T5 (£4.80)", type: "clean" },
        { time: "Today 01:08 (NOW)", title: "Hotel Deposit (€4,200)", desc: "Rule 301 Foreign Hold triggered vs Rule 012 VIP Exemption", type: "warning" }
      ],
      triggeredRules: [
        { id: "RULE-301", name: "FOREIGN_MCC_LUXURY_HOLD", severity: "HIGH" },
        { id: "RULE-012", name: "VIP_PRIVATE_WEALTH_EXEMPTION", severity: "LOW" }
      ],
      status: "RULE_CONFLICT",
      ruleConflict: true,
      analystDecision: null
    },

    {
      id: "ALT-8919",
      caseId: "CASE-4403",
      customer: {
        id: "CUST-10492",
        name: "Devon Bradley",
        email: "d_bradley9921@temp-mail.org",
        phone: "+1 (415) 555-0812",
        accountAge: "6 days",
        kycLevel: "Tier 1 Unverified",
        trustTier: "New Untrusted",
        lifetimeVolume: "$38.50",
        priorDisputes: 1,
        activeCards: 1,
        avgMonthlySpend: "$0.00",
        homeLocation: "Oakland, USA"
      },
      cardVisual: {
        type: "Virtual E-Debit",
        panMasked: "•••• 1084",
        cardholder: "DEVON BRADLEY",
        expiry: "03/27",
        gradient: "linear-gradient(135deg, #322761 0%, #141527 100%)",
        brand: "VISA",
        chipColor: "#4496C8",
        status: "FROZEN_CARDING"
      },
      transaction: {
        id: "TX-9904209",
        amount: 14.99,
        currency: "USD",
        amountFormatted: "$14.99",
        type: "E-Commerce CNP / Bot Probe",
        merchant: "Steam Games Store",
        mcc: "5816 — Digital Games",
        paymentMethod: "Virtual Debit (•••• 1084)",
        timestamp: "Today 01:02 UTC (18m ago)",
        velocity10m: "48 tx / 90 sec",
        velocity24h: "142 tx",
        baselineNormal: "1 tx / week"
      },
      velocityCurve: {
        labels: ["00:55", "00:58", "01:00", "01:01", "01:02", "01:02:30", "01:02:45"],
        baselineValues: [0, 0, 0, 1, 1, 1, 1],
        actualValues:   [0, 2, 8, 19, 34, 42, 48],
        spikeValue: "48 req/90s",
        spikeLabel: "CARDING VELOCITY PROBE"
      },
      geoHop: {
        origin: { name: "Oakland (Registered)", lat: 37.80, lon: -122.27, ip: "12.180.99.1", country: "US" },
        destination: { name: "Frankfurt (Proxy Swarm)", lat: 50.11, lon: 8.68, ip: "104.244.72.115", country: "DE" },
        distanceKm: "8,920 km",
        timeDeltaMin: "Instantaneous",
        speedKmh: "Infinite (Bot)",
        isImpossible: true,
        verdict: "DATACENTER BOTNET: 84 Disparate PANs Tested"
      },
      beneficiary: {
        name: "Valve Corporation",
        bank: "Wells Fargo NA",
        accountNumber: "US94-WFFG-0021-9481-0012",
        addedAgo: "Merchant Gateway",
        isNew: false,
        riskRating: "HIGH_TARGET_DIGITAL_GOODS",
        fatfJurisdiction: "Standard US"
      },
      device: {
        fingerprint: "fp_botnet_cluster_mirai",
        osReported: "Windows 10 (Chrome)",
        actualHardware: "Selenium / Python Automated Container",
        isMismatch: true,
        isTor: false,
        isVpn: true,
        screenRes: "800x600 (Virtual)",
        deviceHistory: "Linked to 84 stolen PANs"
      },
      riskSpectrum: {
        totalScore: 99,
        grade: "HIGH_RISK",
        recommendation: "PERMANENT CARD & IP LOCK",
        breakdown: [
          { category: "Carding Velocity", score: 40, max: 40, color: "#FE678A", icon: "zap" },
          { category: "Cross-PAN Fingerprint Leak", score: 35, max: 35, color: "#FE678A", icon: "laptop" },
          { category: "Disposable Email Domain", score: 14, max: 15, color: "#FE678A", icon: "alertTriangle" },
          { category: "Datacenter Hosting", score: 10, max: 10, color: "#4496C8", icon: "shield" }
        ]
      },
      entityGraph: [
        { from: "Bot Swarm: Frankfurt", to: "Card ••••1084", status: "danger", label: "CVV Brute Force" },
        { from: "Card ••••1084", to: "Steam Merchant", status: "danger", label: "48 Micro-charges" }
      ],
      timeline: [
        { time: "6 days ago", title: "Account Created", desc: "Disposable email @temp-mail.org bypassed regex", type: "warning" },
        { time: "Today 01:00", title: "CVV Brute Force", desc: "34 micro-charges ($1.00 - $3.00) initiated across digital merchants", type: "critical" },
        { time: "Today 01:02 (NOW)", title: "Rate Limit Tripped", desc: "Rule 001 triggered. Card air-gapped by Sentry Autopilot", type: "critical" }
      ],
      triggeredRules: [
        { id: "RULE-001", name: "CARDING_VELOCITY_RAPID_FIRE", severity: "CRITICAL" },
        { id: "RULE-509", name: "BOTNET_FINGERPRINT_CLUSTER", severity: "CRITICAL" }
      ],
      status: "FROZEN",
      ruleConflict: false,
      analystDecision: "AUTOMATED_FROZEN"
    }
  ],

  rulesInventory: [
    {
      id: "RULE-402",
      name: "NEW_BENEFICIARY_HIGH_AMOUNT",
      category: "Account Takeover & Wires",
      status: "ACTIVE",
      logic: "Beneficiary Creation Timestamp < 2h AND Wire Amount > $5,000 USD",
      action: "HOLD_TRANSACTION_FOR_ANALYST_QUEUE",
      triggered24h: 38,
      falsePositiveRate: "1.8%",
      author: "Fintech Risk Policy L3"
    },
    {
      id: "RULE-109",
      name: "IMPOSSIBLE_TRAVEL_GEO_DELTA",
      category: "Network & Location",
      status: "ACTIVE",
      logic: "Distance(Session_N, Session_N-1) / Delta_Time > 900 km/h",
      action: "SUSPEND_SESSION_AND_REQUIRE_STEP_UP",
      triggered24h: 84,
      falsePositiveRate: "3.2%",
      author: "Fraud Engineering Team"
    },
    {
      id: "RULE-001",
      name: "CARDING_VELOCITY_RAPID_FIRE",
      category: "Carding & Bot Defense",
      status: "ACTIVE",
      logic: "Count(Transactions) > 10 in 60s from Same Fingerprint OR IP",
      action: "IMMEDIATE_CARD_LOCK_AND_IP_DROP",
      triggered24h: 312,
      falsePositiveRate: "0.1%",
      author: "Autonomous Edge Enforcer"
    },
    {
      id: "RULE-301",
      name: "FOREIGN_MCC_LUXURY_HOLD",
      category: "Cross-Border Fraud",
      status: "ACTIVE",
      logic: "Country(Transaction) != Country(Account) AND MCC in [7011, 5732, 5944] AND Amount > $3,000",
      action: "INTERACTIVE_HOLD",
      triggered24h: 64,
      falsePositiveRate: "12.4%",
      author: "Legacy AML Compliance",
      hasConflictNotice: "Conflicts with RULE-012 on VIP accounts"
    },
    {
      id: "RULE-012",
      name: "VIP_PRIVATE_WEALTH_EXEMPTION",
      category: "VIP Experience",
      status: "ACTIVE",
      logic: "TrustTier == 'VIP Platinum' AND AccountAge > 3y AND PriorDisputes == 0",
      action: "BYPASS_FRICTION_SEND_SILENT_SMS",
      triggered24h: 19,
      falsePositiveRate: "0.0%",
      author: "Private Banking Risk Policy"
    }
  ],

  auditLog: [
    {
      id: "AUD-99120",
      timestamp: "2026-09-16 01:22:14 UTC",
      actor: "Hannah Cole (Senior Analyst)",
      entity: "ALT-8919 / CUST-10492",
      action: "PERMANENT_FREEZE_ACCOUNT",
      rationale: "Carding bot swarm confirmed. 48 rapid attempts with disposable email domain and datacenter proxy.",
      verdict: "CONFIRMED_FRAUD",
      riskScoreAfter: 99
    },
    {
      id: "AUD-99119",
      timestamp: "2026-09-16 01:04:38 UTC",
      actor: "SENTRY Autopilot Engine",
      entity: "TX-9904209",
      action: "VELOCITY_AUTO_RATE_LIMIT",
      rationale: "Threshold exceeded: 48 attempts in 90 seconds. Rule 001 triggered.",
      verdict: "SYSTEM_CONTAINMENT",
      riskScoreAfter: 99
    },
    {
      id: "AUD-99118",
      timestamp: "2026-09-16 00:32:10 UTC",
      actor: "Sarah Jenkins (Risk Manager)",
      entity: "ALT-8894 / CUST-77219",
      action: "APPROVE_AND_UNFREEZE",
      rationale: "Customer contacted via verified branch phone callback. Legitimate equipment purchase for consulting firm.",
      verdict: "FALSE_POSITIVE_RESOLVED",
      riskScoreAfter: 12
    }
  ]
};

// ---------------------------------------------------------------------------
// Workflow seed (cases, customers, extra ledger rows, analytics series).
// This file is the single seed for the local data store (js/store.js). User changes
// are written to sessionStorage and never back into this file.
// ---------------------------------------------------------------------------
SENTRY_DATA.cases = [
  { id: "CASE-4401", alertIds: ["ALT-8921"], priority: "P0 CRITICAL", status: "UNDER_REVIEW", owner: "Hannah Cole", queue: "ATO / Wire", sla: "08m 14s", opened: "18m ago", customerId: "CUST-90412", customer: "Eleanor Vance", amount: "$8,450.00", risk: 94, title: "NEW BENEFICIARY AMOUNT GT 5K", summary: "Instant External Wire to Panama Global Vault Remit SA", notes: [], evidence: [], resolution: null },
  { id: "CASE-4402", alertIds: ["ALT-8920"], priority: "P1 CONFLICT", status: "CONFLICT_TRIAGE", owner: "Hannah Cole", queue: "VIP Exceptions", sla: "32m 00s", opened: "24m ago", customerId: "CUST-38109", customer: "Marcus Aurelius Thorne", amount: "€4,200.00", risk: 62, title: "FOREIGN MCC LUXURY HOLD", summary: "Card present POS at Hôtel Plaza Athénée Paris", notes: [], evidence: [], resolution: null },
  { id: "CASE-4403", alertIds: ["ALT-8919"], priority: "P0 AUTO", status: "CONTAINED", owner: "SENTRY Autopilot", queue: "Carding Swarm", sla: "COMPLETED", opened: "41m ago", customerId: "CUST-10492", customer: "Devon Bradley", amount: "$14.99", risk: 99, title: "CARDING VELOCITY RAPID FIRE", summary: "48 micro-transactions at Steam Games Store", notes: [], evidence: [], resolution: null },
  { id: "CASE-4398", alertIds: [], priority: "P1 HIGH", status: "PENDING_EVIDENCE", owner: "Mina Patel", queue: "Account Defense", sla: "51m 20s", opened: "11m ago", customerId: "CUST-77219", customer: "Sarah Keene", amount: "$12,840.00", risk: 81, title: "SESSION TAKEOVER, DEVICE RESET", summary: "Credential reset followed by high-value equipment purchase",
    drivers: [{ category: "Device reset", score: 29 }, { category: "Credential change", score: 25 }, { category: "Spend anomaly", score: 27 }],
    timeline: [{ time: "00:44", title: "Password reset", desc: "Recovery completed from a new Android device." }, { time: "00:52", title: "New device trusted", desc: "Device enrolled without historical cookie continuity." }, { time: "01:06", title: "Purchase held", desc: "$12.8k electronics authorization routed to review." }],
    notes: [{ id: "N-1", author: "Mina Patel", at: "2026-09-16 00:58 UTC", text: "Requested device trust history from the identity team." }], evidence: [{ id: "E-1", name: "device-trust-history.pdf", addedBy: "Mina Patel", at: "2026-09-16 01:02 UTC" }], resolution: null },
  { id: "CASE-4396", alertIds: [], priority: "P2 MEDIUM", status: "AWAITING_CUSTOMER", owner: "Leo Martins", queue: "Disputes", sla: "2h 18m", opened: "36m ago", customerId: "CUST-22018", customer: "Nora Jensen", amount: "$1,298.40", risk: 58, title: "FRIENDLY FRAUD, SUBSCRIPTION CLUSTER", summary: "Repeated dispute pattern across digital subscriptions",
    drivers: [{ category: "Dispute velocity", score: 22 }, { category: "Merchant pattern", score: 18 }, { category: "Account history", score: 18 }],
    timeline: [{ time: "Yesterday", title: "Third dispute filed", desc: "Digital merchant dispute submitted within 14 days." }, { time: "Today 00:18", title: "Pattern linked", desc: "Three related merchants identified by descriptor similarity." }],
    notes: [], evidence: [], resolution: null },
  { id: "CASE-4391", alertIds: [], priority: "P2 REVIEW", status: "SUPERVISOR_REVIEW", owner: "Sarah Jenkins", queue: "Merchant Risk", sla: "3h 42m", opened: "1h ago", customerId: "MERCH-1182", customer: "Atlas Tickets GmbH", amount: "€94,210.00", risk: 73, title: "MERCHANT BURST, REFUND IMBALANCE", summary: "Refund ratio rose 4.8× against 30-day baseline",
    drivers: [{ category: "Refund ratio", score: 31 }, { category: "Burst velocity", score: 24 }, { category: "Entity graph", score: 18 }],
    timeline: [{ time: "23:10", title: "Refund spike begins", desc: "86 refunds initiated in a 22-minute window." }, { time: "00:03", title: "Reserve threshold crossed", desc: "Merchant reserve moved above configured threshold." }],
    notes: [], evidence: [], resolution: null }
];

SENTRY_DATA.extraCustomers = [
  { id: "CUST-77219", name: "Sarah Keene", email: "s.keene@northline.co", trustTier: "Silver", accountAge: "2y 9m", lifetimeVolume: "$118,240", disputes: 1, risk: 81, segment: "Business", status: "REVIEW", devices: 4, home: "Chicago, USA" },
  { id: "CUST-22018", name: "Nora Jensen", email: "nora.jensen@mailbox.dk", trustTier: "Standard", accountAge: "1y 4m", lifetimeVolume: "$31,980", disputes: 3, risk: 58, segment: "Consumer", status: "MONITOR", devices: 2, home: "Copenhagen, DK" },
  { id: "CUST-66104", name: "Amir Haddad", email: "amir@starlane.ae", trustTier: "Gold", accountAge: "5y 1m", lifetimeVolume: "$614,320", disputes: 0, risk: 22, segment: "Private Wealth", status: "CLEAR", devices: 5, home: "Dubai, UAE" },
  { id: "CUST-51029", name: "Maya Ito", email: "maya@shiro-studio.jp", trustTier: "Standard", accountAge: "3y 7m", lifetimeVolume: "$76,430", disputes: 0, risk: 34, segment: "Business", status: "CLEAR", devices: 3, home: "Tokyo, JP" }
];

SENTRY_DATA.auditLog.push(
  { id: "AUD-99117", timestamp: "2026-09-15 23:51:12 UTC", actor: "SENTRY Rule Service", entity: "RULE-301", action: "POLICY_EVALUATED", rationale: "Cross-border luxury hold evaluated against VIP exemption path.", verdict: "CONFLICT_ROUTED", riskScoreAfter: 62 },
  { id: "AUD-99116", timestamp: "2026-09-15 23:42:09 UTC", actor: "Mina Patel (Fraud Analyst)", entity: "CASE-4398", action: "EVIDENCE_REQUESTED", rationale: "Requested device trust history and customer callback before final disposition.", verdict: "PENDING_EVIDENCE", riskScoreAfter: 81 },
  { id: "AUD-99115", timestamp: "2026-09-15 23:18:44 UTC", actor: "SENTRY Auth Gateway", entity: "CUST-66104", action: "STEP_UP_PASSED", rationale: "Biometric challenge completed on a previously trusted mobile device.", verdict: "ALLOWED_CLEAN", riskScoreAfter: 18 }
);

// Daily operational series: 90 days ending on the scenario date.
// Deterministic (seeded PRNG) so every reset produces identical numbers.
// Seeded series used by the analytics workspace.
SENTRY_DATA.analyticsDaily = (() => {
  let seed = 4401;
  const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const typologies = ["Account takeover", "Carding / bots", "Friendly fraud", "Merchant abuse"];
  const channels = ["Wire", "Card", "ACH"];
  const end = Date.UTC(2026, 8, 16);
  const rows = [];
  for (let d = 89; d >= 0; d--) {
    const date = new Date(end - d * 86400000).toISOString().slice(0, 10);
    const weekday = new Date(end - d * 86400000).getUTCDay();
    typologies.forEach((typology, ti) => {
      channels.forEach((channel, ci) => {
        const base = [9, 14, 6, 4][ti] * [0.8, 1.4, 0.6][ci] * (weekday === 0 || weekday === 6 ? 0.7 : 1);
        const alerts = Math.max(0, Math.round(base * (0.6 + rand() * 0.9)));
        const blocked = Math.round(alerts * (0.18 + rand() * 0.14));
        const stepUp = Math.round(alerts * (0.05 + rand() * 0.06));
        const escalated = Math.round(alerts * (0.02 + rand() * 0.04));
        rows.push({ date, typology, channel, alerts, blocked, stepUp, escalated, approved: Math.max(0, alerts - blocked - stepUp - escalated) });
      });
    });
  }
  return rows;
})();
SENTRY_DATA.scenarioDate = "2026-09-16";
