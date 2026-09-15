// SENTRY // Fraud & Risk Operations Console Dataset
// Realistic banking and fintech fraud investigation intelligence (Zero lorem ipsum)

const SENTRY_DATA = {
  systemMetrics: {
    shift: "Day Operations (EMEA / AMER)",
    analyst: "Đỗ Anh Nghĩa",
    analystRole: "Senior Fraud Analyst (L3)",
    openAlertsCount: 24,
    criticalQueueCount: 8,
    mttdSeconds: 42, // Mean Time to Detect
    mttrMinutes: 3.4, // Mean Time to Resolve
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
        accountAge: "4 years, 2 months",
        kycLevel: "Verified (Tier 3 Institutional)",
        trustTier: "Gold (Degraded to At-Risk)",
        lifetimeVolume: "$482,900 USD",
        priorDisputes: 0,
        activeCards: 3,
        avgMonthlySpend: "$9,400 USD",
        homeLocation: "New York, USA (10021)"
      },
      transaction: {
        id: "TX-9904218",
        amount: 8450.00,
        currency: "USD",
        amountFormatted: "$8,450.00 USD",
        type: "Instant External Wire / Quasi-Cash",
        merchant: "Panama Global Vault Remit SA",
        mcc: "6051 — Non-Financial Institutions / Foreign Currency",
        paymentMethod: "Business Checking (•••• 8912)",
        timestamp: "2026-09-16 01:14:22 UTC (6m ago)",
        channel: "Web Portal Ingress",
        authStatus: "HELD_FOR_REVIEW",
        velocity10m: "$8,450.00 (Baseline: $120.00)",
        velocity24h: "$14,800.00 (Baseline: $850.00)"
      },
      beneficiary: {
        name: "Panama Wire Escrow Trust 9812-X",
        bank: "Banco Nacional de Panamá",
        accountNumber: "PA89-0120-0094-1182-9901",
        addedAgo: "18 minutes before transaction",
        isNew: true,
        riskRating: "CRITICAL_WATCHLIST",
        fatfJurisdiction: "High Scrutiny Jurisdictions"
      },
      device: {
        fingerprint: "fp_9f4b23_c91d8e",
        osReported: "macOS 14.5 (Sonoma)",
        browserReported: "Safari 17.4",
        canvasHashMatch: false,
        canvasReportedOS: "Linux x86_64 / Puppeteer Headless",
        webrtcLeakIp: "185.220.101.44",
        screenRes: "1920x1080 (Virtual Display)",
        timezoneMismatch: true,
        timezoneClient: "UTC+00:00",
        timezoneBilling: "America/New_York (UTC-04:00)",
        hardwareConcurrency: 4,
        deviceHistory: "Never seen prior to 42 minutes ago"
      },
      network: {
        ip: "185.220.101.44",
        asn: "AS9009 Tor Relay Community",
        country: "Netherlands",
        city: "Amsterdam",
        isVpn: true,
        isTor: true,
        isProxy: true,
        distanceFromBilling: "5,860 km",
        travelVelocity: "8,790 km/h (Impossible Travel)",
        connectionType: "Datacenter / Tor Exit"
      },
      riskSpectrum: {
        totalScore: 94,
        grade: "HIGH_RISK",
        recommendation: "IMMEDIATE_ACCOUNT_FREEZE",
        breakdown: [
          { category: "Device Mismatch & Spoofing", score: 32, max: 35, color: "#DC2626" },
          { category: "Tor Exit & Impossible Travel", score: 28, max: 30, color: "#EA580C" },
          { category: "Velocity & Amount Deviation", score: 22, max: 20, color: "#DC2626" },
          { category: "New High-Risk Beneficiary", score: 12, max: 15, color: "#D97706" }
        ]
      },
      timeline: [
        {
          timestamp: "3 months ago",
          event: "Baseline Account Behavior",
          detail: "Routine corporate payroll transfers from authorized MacBook Pro (New York, residential IP 72.14.x).",
          type: "clean"
        },
        {
          timestamp: "Yesterday 22:14 UTC",
          event: "Password Reset Triggered",
          detail: "Automated password recovery link requested via SMS OTP. User Agent: Android / Chrome mobile.",
          type: "warning"
        },
        {
          timestamp: "Today 00:32 UTC (42m ago)",
          event: "New Device Session Initiated",
          detail: "Login from Tor Exit Node (Amsterdam, 185.220.101.44). Canvas fingerprint mismatch detected.",
          type: "critical"
        },
        {
          timestamp: "Today 00:56 UTC (18m ago)",
          event: "New Beneficiary Added",
          detail: "Added Panama Wire Escrow Trust 9812-X without biometric step-up re-authentication.",
          type: "critical"
        },
        {
          timestamp: "Today 01:14 UTC (CURRENT)",
          event: "Outbound Wire Dispatched ($8,450.00)",
          detail: "Transaction automatically flagged by Rule 402 and Rule 109. Held in analyst queue.",
          type: "current"
        }
      ],
      triggeredRules: [
        {
          id: "RULE-402",
          name: "NEW_BENEFICIARY_HIGH_AMOUNT",
          condition: "Beneficiary age < 2h AND Amount > $5,000 USD",
          severity: "CRITICAL",
          action: "HOLD_AND_ESCALATE"
        },
        {
          id: "RULE-109",
          name: "IMPOSSIBLE_TRAVEL_GEO_DELTA",
          condition: "Velocity between sessions > 900 km/h",
          severity: "CRITICAL",
          action: "FLAG_ACCOUNT_TAKEOVER"
        },
        {
          id: "RULE-214",
          name: "TOR_EXIT_DATACENTER_PROXY",
          condition: "IP reputation score < 10 OR ASN in Tor Relay registry",
          severity: "HIGH",
          action: "STEP_UP_AUTH"
        }
      ],
      signals: [
        { name: "ML Anomaly Score", value: "0.96 (Top 0.1% Outlier)", status: "danger" },
        { name: "Behavioral Keystroke Dynamics", value: "0.24 (Robotic cadence / Auto-fill)", status: "danger" },
        { name: "Beneficiary Bank FATF Rating", value: "Gray List (Panama Jurisdiction)", status: "warning" },
        { name: "Account Age Trust Buffer", value: "High (4+ Years)", status: "positive" }
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
        accountAge: "6 years, 8 months",
        kycLevel: "Verified (Private Wealth Tier 1)",
        trustTier: "VIP Platinum",
        lifetimeVolume: "$2,450,000 USD",
        priorDisputes: 0,
        activeCards: 4,
        avgMonthlySpend: "$28,000 USD",
        homeLocation: "London, UK (SW1X 7LY)"
      },
      transaction: {
        id: "TX-9904215",
        amount: 4200.00,
        currency: "EUR",
        amountFormatted: "€4,200.00 EUR ($4,580 USD)",
        type: "POS Card Present / Luxury Hospitality",
        merchant: "Hôtel Plaza Athénée Paris",
        mcc: "7011 — Hotels, Motels & Resorts",
        paymentMethod: "Metal Platinum Debit (•••• 4091)",
        timestamp: "2026-09-16 01:08:10 UTC (12m ago)",
        channel: "EMV Chip & PIN",
        authStatus: "RULE_CONFLICT_PAUSE",
        velocity10m: "€4,200.00 (Normal for hotel check-in)",
        velocity24h: "€4,200.00 (Baseline: €1,200.00)"
      },
      beneficiary: {
        name: "Hôtel Plaza Athénée",
        bank: "BNP Paribas SA",
        accountNumber: "FR76-3000-4001-2800-0194",
        addedAgo: "Point of Sale Merchant",
        isNew: false,
        riskRating: "TIER_1_REPUTABLE",
        fatfJurisdiction: "Standard EEA"
      },
      device: {
        fingerprint: "fp_physical_pos_terminal",
        osReported: "Ingenico POS Terminal OS",
        browserReported: "N/A (Chip Contactless)",
        canvasHashMatch: true,
        canvasReportedOS: "Embedded Hardware",
        webrtcLeakIp: "N/A",
        screenRes: "N/A",
        timezoneMismatch: false,
        timezoneClient: "Europe/Paris (UTC+02:00)",
        timezoneBilling: "Europe/London (UTC+01:00)",
        hardwareConcurrency: 1,
        deviceHistory: "Terminal verified with Visa 3D Secure 2.2"
      },
      network: {
        ip: "194.199.228.18",
        asn: "AS5410 Orange France Commercial",
        country: "France",
        city: "Paris",
        isVpn: false,
        isTor: false,
        isProxy: false,
        distanceFromBilling: "340 km (Eurostar Corridor)",
        travelVelocity: "85 km/h (Normal rail transit)",
        connectionType: "Commercial Merchant Leased Line"
      },
      riskSpectrum: {
        totalScore: 62,
        grade: "RULE_CONFLICT",
        recommendation: "MANUAL_SUPERVISOR_OVERRIDE",
        breakdown: [
          { category: "Geo Cross-Border Rule 301", score: 40, max: 40, color: "#EA580C" },
          { category: "VIP Whitelist Policy 012", score: -20, max: 20, color: "#059669" },
          { category: "Merchant Reputation Score", score: 2, max: 20, color: "#059669" },
          { category: "Amount Within VIP Baseline", score: 0, max: 20, color: "#059669" }
        ]
      },
      timeline: [
        {
          timestamp: "2 days ago",
          event: "CRM Travel Notice Logged",
          detail: "Client notified private banker of 1-week business trip to Paris fashion week.",
          type: "clean"
        },
        {
          timestamp: "Yesterday 18:40 UTC",
          event: "London Heathrow Terminal 5 Coffee",
          detail: "Verified Chip transaction at Caffè Nero LHR (£4.80).",
          type: "clean"
        },
        {
          timestamp: "Today 01:08 UTC (CURRENT)",
          event: "Hotel Deposit Charge (€4,200.00)",
          detail: "Triggered Rule 301 (Cross-border foreign currency block) conflicting with Rule 012 (VIP bypass).",
          type: "warning"
        }
      ],
      triggeredRules: [
        {
          id: "RULE-301",
          name: "FOREIGN_MCC_LUXURY_HOLD",
          condition: "Transaction Country != Account Country AND Amount > $3,000",
          severity: "HIGH",
          action: "AUTO_HOLD",
          conflictWith: "RULE-012"
        },
        {
          id: "RULE-012",
          name: "VIP_PRIVATE_WEALTH_EXEMPTION",
          condition: "Trust Tier == 'VIP Platinum' AND Prior Disputes == 0",
          severity: "LOW",
          action: "ALLOW_WITH_SMS_NOTIFICATION",
          conflictWith: "RULE-301"
        }
      ],
      signals: [
        { name: "Rule Conflict State", value: "Rule 301 (Hold) vs Rule 012 (Allow VIP)", status: "warning" },
        { name: "CRM Travel Notice Match", value: "Documented Paris Stay in Salesforce", status: "positive" },
        { name: "3DS Authentication", value: "Cryptographically Verified (Frictionless)", status: "positive" },
        { name: "Dispute Likelihood Score", value: "0.01% (Extremely Low)", status: "positive" }
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
        kycLevel: "Tier 1 Basic (Unverified SSN)",
        trustTier: "New Untrusted",
        lifetimeVolume: "$38.50 USD",
        priorDisputes: 1,
        activeCards: 1,
        avgMonthlySpend: "$0.00 USD",
        homeLocation: "Oakland, USA (94601)"
      },
      transaction: {
        id: "TX-9904209",
        amount: 14.99,
        currency: "USD",
        amountFormatted: "$14.99 USD",
        type: "E-Commerce CNP / Carding Velocity Probe",
        merchant: "Steam Games Online Store",
        mcc: "5816 — Digital Goods / Games",
        paymentMethod: "Virtual Debit (•••• 1084)",
        timestamp: "2026-09-16 01:02:45 UTC (18m ago)",
        channel: "Direct API Integration",
        authStatus: "BLOCKED_VELOCITY",
        velocity10m: "48 transactions attempted in 90 seconds",
        velocity24h: "142 transactions attempted"
      },
      beneficiary: {
        name: "Valve Corporation",
        bank: "Wells Fargo NA",
        accountNumber: "US94-WFFG-0021-9481-0012",
        addedAgo: "Merchant Gateway",
        isNew: false,
        riskRating: "DIGITAL_GOODS_HIGH_TARGET",
        fatfJurisdiction: "Standard US"
      },
      device: {
        fingerprint: "fp_botnet_cluster_mirai",
        osReported: "Windows 10",
        browserReported: "Chrome 122.0",
        canvasHashMatch: false,
        canvasReportedOS: "Python Requests / Selenium Automation",
        webrtcLeakIp: "104.244.72.115",
        screenRes: "800x600 (Automated Container)",
        timezoneMismatch: true,
        timezoneClient: "UTC+00:00",
        timezoneBilling: "America/Los_Angeles (UTC-07:00)",
        hardwareConcurrency: 2,
        deviceHistory: "Associated with 84 disparate credit cards in last 3 hours"
      },
      network: {
        ip: "104.244.72.115",
        asn: "AS396982 DigitalOcean Bulletproof Proxy",
        country: "Germany",
        city: "Frankfurt",
        isVpn: true,
        isTor: false,
        isProxy: true,
        distanceFromBilling: "8,920 km",
        travelVelocity: "Infinite (Cloud Datacenter Bot)",
        connectionType: "Datacenter Swarm"
      },
      riskSpectrum: {
        totalScore: 99,
        grade: "HIGH_RISK",
        recommendation: "PERMANENT_IP_RANGE_AND_CARD_BLOCK",
        breakdown: [
          { category: "Carding Botnet Velocity", score: 40, max: 40, color: "#DC2626" },
          { category: "Fingerprint Re-use across 84 PANs", score: 35, max: 35, color: "#DC2626" },
          { category: "Disposable Email Domain", score: 14, max: 15, color: "#DC2626" },
          { category: "Datacenter ASN Hosting", score: 10, max: 10, color: "#DC2626" }
        ]
      },
      timeline: [
        {
          timestamp: "6 days ago",
          event: "Account Created with Temp Email",
          detail: "Domain @temp-mail.org bypassed legacy regex check.",
          type: "warning"
        },
        {
          timestamp: "Today 01:00:10 UTC",
          event: "Automated CVV Brute Force Starts",
          detail: "34 micro-charges ($1.00 - $3.00) initiated across digital goods merchants.",
          type: "critical"
        },
        {
          timestamp: "Today 01:02:45 UTC (CURRENT)",
          event: "Automated Rate Limit Intercept",
          detail: "Card locked by Sentry Autonomous Velocity Engine. Bot isolated.",
          type: "critical"
        }
      ],
      triggeredRules: [
        {
          id: "RULE-001",
          name: "CARDING_VELOCITY_RAPID_FIRE",
          condition: "Transaction attempts > 10 in 60 seconds",
          severity: "CRITICAL",
          action: "HARD_BLOCK_AND_PURGE"
        },
        {
          id: "RULE-509",
          name: "BOTNET_FINGERPRINT_CLUSTER",
          condition: "Fingerprint seen across > 5 distinct PANs in 24h",
          severity: "CRITICAL",
          action: "CLUSTER_AIRGAP"
        }
      ],
      signals: [
        { name: "Bot Cadence Confidence", value: "99.9% (Inhuman timing variance < 2ms)", status: "danger" },
        { name: "Cross-Card Fingerprint Leak", value: "84 Stolen Cards Identified", status: "danger" },
        { name: "Email Domain Reputation", value: "Disposable / Ephemeral (0/100)", status: "danger" },
        { name: "CVV Retry Count", value: "19 failures before success", status: "danger" }
      ],
      status: "FROZEN",
      ruleConflict: false,
      analystDecision: "AUTOMATED_FROZEN"
    },

    {
      id: "ALT-8918",
      caseId: "CASE-4404",
      customer: {
        id: "CUST-88201",
        name: "Claire Dupont",
        email: "claire.dupont@orange.fr",
        phone: "+33 6 12 34 56 78",
        accountAge: "2 years, 4 months",
        kycLevel: "Verified (Tier 2 Consumer)",
        trustTier: "Silver Standard",
        lifetimeVolume: "$34,200 USD",
        priorDisputes: 2,
        activeCards: 2,
        avgMonthlySpend: "$1,800 USD",
        homeLocation: "Lyon, France (69002)"
      },
      transaction: {
        id: "TX-9904188",
        amount: 1890.00,
        currency: "EUR",
        amountFormatted: "€1,890.00 EUR ($2,060 USD)",
        type: "High-Ticket Consumer Electronics",
        merchant: "Fnac Darty Online Lyon",
        mcc: "5732 — Electronic Sales",
        paymentMethod: "Visa Contactless Virtual (•••• 6712)",
        timestamp: "2026-09-16 00:48:12 UTC (32m ago)",
        channel: "Mobile App (iOS)",
        authStatus: "NEEDS_VERIFICATION",
        velocity10m: "€1,890.00 (Single purchase)",
        velocity24h: "€1,890.00 (Baseline: €150.00)"
      },
      beneficiary: {
        name: "Fnac Direct",
        bank: "Société Générale",
        accountNumber: "FR76-3000-3000-8812-0041",
        addedAgo: "Merchant Direct",
        isNew: false,
        riskRating: "DOMESTIC_MERCHANT",
        fatfJurisdiction: "Standard EEA"
      },
      device: {
        fingerprint: "fp_iphone_15_claire_lyon",
        osReported: "iOS 17.5.1",
        browserReported: "Mobile Safari / Fnac App Wrapper",
        canvasHashMatch: true,
        canvasReportedOS: "Apple iPhone 15 Pro",
        webrtcLeakIp: "92.184.108.12",
        screenRes: "393x852 (Mobile Retina)",
        timezoneMismatch: false,
        timezoneClient: "Europe/Paris (UTC+02:00)",
        timezoneBilling: "Europe/Paris (UTC+02:00)",
        hardwareConcurrency: 6,
        deviceHistory: "Known device (18 months in continuous use)"
      },
      network: {
        ip: "92.184.108.12",
        asn: "AS3215 Orange Mobile 5G Lyon",
        country: "France",
        city: "Lyon",
        isVpn: false,
        isTor: false,
        isProxy: false,
        distanceFromBilling: "3.2 km (Resident Home Cell Tower)",
        travelVelocity: "0 km/h (Local Stationary)",
        connectionType: "Cellular 5G"
      },
      riskSpectrum: {
        totalScore: 54,
        grade: "NEEDS_VERIFICATION",
        recommendation: "OUT_OF_BAND_SMS_OR_BIOMETRIC_PUSH",
        breakdown: [
          { category: "Historical Dispute Pattern (Friendly Fraud)", score: 30, max: 40, color: "#EA580C" },
          { category: "Amount Spike vs 90d Baseline", score: 20, max: 30, color: "#D97706" },
          { category: "Device & Network Familiarity", score: 4, max: 20, color: "#059669" }
        ]
      },
      timeline: [
        {
          timestamp: "6 months ago",
          event: "First Dispute Logged (€420)",
          detail: "Claimed 'Item Not Received' on luxury cosmetics; merchant contested, bank settled.",
          type: "warning"
        },
        {
          timestamp: "2 months ago",
          event: "Second Dispute Logged (€310)",
          detail: "Claimed unauthorized family member purchase on PlayStation Network.",
          type: "warning"
        },
        {
          timestamp: "Today 00:48 UTC (CURRENT)",
          event: "High-Ticket iPhone 16 Order (€1,890.00)",
          detail: "Device matches 100%, but high chargeback probability model flags potential friendly fraud.",
          type: "warning"
        }
      ],
      triggeredRules: [
        {
          id: "RULE-204",
          name: "REPEAT_DISPUTE_CUSTOMER_SPIKE",
          condition: "Prior Disputes >= 2 AND Transaction Amount > $1,000",
          severity: "MEDIUM",
          action: "REQUIRE_BIOMETRIC_STEP_UP"
        }
      ],
      signals: [
        { name: "Friendly Fraud Propensity", value: "68% Likelihood (First-Party Dispute)", status: "warning" },
        { name: "Device Legitimacy Score", value: "99.8% (Verified Claire's Personal iPhone)", status: "positive" },
        { name: "Local Cell Tower Triangulation", value: "3.2 km from registered billing address", status: "positive" },
        { name: "Merchant Delivery Method", value: "In-Store Click & Collect (Requires National ID)", status: "positive" }
      ],
      status: "NEEDS_VERIFICATION",
      ruleConflict: false,
      analystDecision: null
    },

    {
      id: "ALT-8917",
      caseId: "CASE-4405",
      customer: {
        id: "CUST-55194",
        name: "Liam O'Connor",
        email: "liam.oconnor@dublin-tech.ie",
        phone: "+353 87 123 4567",
        accountAge: "3 years, 1 month",
        kycLevel: "Verified (Tier 2)",
        trustTier: "Standard Clean",
        lifetimeVolume: "$18,400 USD",
        priorDisputes: 0,
        activeCards: 1,
        avgMonthlySpend: "$620 USD",
        homeLocation: "Dublin, Ireland (D02)"
      },
      transaction: {
        id: "TX-9904120",
        amount: 42.50,
        currency: "EUR",
        amountFormatted: "€42.50 EUR ($46.20 USD)",
        type: "Recurring Merchant Subscription",
        merchant: "Spotify Ireland AB",
        mcc: "5815 — Digital Media & Audio",
        paymentMethod: "Visa Debit (•••• 3319)",
        timestamp: "2026-09-16 00:12:00 UTC (1h 8m ago)",
        channel: "Card on File Recurring",
        authStatus: "SETTLED_ALLOW",
        velocity10m: "€42.50 (Exact monthly cadence)",
        velocity24h: "€42.50 (Baseline: €42.50)"
      },
      beneficiary: {
        name: "Spotify AB",
        bank: "SEB Bank Stockholm",
        accountNumber: "SE49-5000-0000-0192-8812",
        addedAgo: "Stored Token (36 months)",
        isNew: false,
        riskRating: "ESTABLISHED_GLOBAL_MERCHANT",
        fatfJurisdiction: "Standard EU"
      },
      device: {
        fingerprint: "fp_recurring_server_batch",
        osReported: "Server-to-Server Token",
        browserReported: "N/A (Card on File)",
        canvasHashMatch: true,
        canvasReportedOS: "N/A",
        webrtcLeakIp: "N/A",
        screenRes: "N/A",
        timezoneMismatch: false,
        timezoneClient: "Europe/Dublin",
        timezoneBilling: "Europe/Dublin",
        hardwareConcurrency: 1,
        deviceHistory: "36th consecutive monthly billing cycle"
      },
      network: {
        ip: "193.182.8.44",
        asn: "AS8403 Spotify Direct Peering",
        country: "Ireland",
        city: "Dublin",
        isVpn: false,
        isTor: false,
        isProxy: false,
        distanceFromBilling: "0 km",
        travelVelocity: "0 km/h",
        connectionType: "Direct Merchant Gateway"
      },
      riskSpectrum: {
        totalScore: 4,
        grade: "LOW_RISK",
        recommendation: "AUTO_ALLOW_RECURRING",
        breakdown: [
          { category: "Tokenized Recurring Merchant", score: 2, max: 40, color: "#059669" },
          { category: "36-Month Immaculate History", score: 2, max: 30, color: "#059669" }
        ]
      },
      timeline: [
        {
          timestamp: "3 years ago",
          event: "Subscription Created",
          detail: "Initial 3DS card verification completed with Bank of Ireland.",
          type: "clean"
        },
        {
          timestamp: "Today 00:12 UTC (1h ago)",
          event: "Monthly Bill Executed (€42.50)",
          detail: "Processed with zero anomalies. Model score 4/100.",
          type: "clean"
        }
      ],
      triggeredRules: [],
      signals: [
        { name: "Subscription Integrity", value: "Valid recurring tokenized mandate", status: "positive" },
        { name: "Chargeback History", value: "0 complaints in 36 months", status: "positive" }
      ],
      status: "RESOLVED",
      ruleConflict: false,
      analystDecision: "AUTOMATED_ALLOW"
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
      author: "Legacy AML Compliance (Candidate for Rule Refinement)",
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
      actor: "Đỗ Anh Nghĩa (Senior Analyst)",
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
