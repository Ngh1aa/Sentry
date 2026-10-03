from pathlib import Path

root = Path(__file__).resolve().parents[2]
path = root / 'js' / 'secondary.js'
text = path.read_text(encoding='utf-8')

replacements = {
    "Understand what is driving fraud, where analyst effort is going, and whether automated controls are reducing loss without excessive customer friction.":
        "Explore synthetic scenario patterns and the measurement surfaces planned for validation. Outcome claims remain unmeasured until compatible evidence exists.",
    "[['Range', state.analyticsRange.toUpperCase()], ['Alerts', totalAlerts.toLocaleString()], ['Blocked', totalBlocked.toLocaleString()], ['Model health', 'Stable']]":
        "[['Range', state.analyticsRange.toUpperCase()], ['Alerts', `${totalAlerts.toLocaleString()} scenario`], ['Blocked', `${totalBlocked.toLocaleString()} scenario`], ['Evidence', '0 / 0 verified']]",
    "{label:'Fraud loss prevented', value:'$1.84M', note:'30-day confirmed blocked exposure'},":
        "{label:'Evidence status', value:'NOT MEASURED', note:'0 verified DIRECT_USER · 0 verified PROXY sessions'},",
    "{label:'False positive rate', value:'2.1%', note:'0.9pp below operating threshold', tone:'purple'},":
        "{label:'Prevented fraud loss', value:'NOT MEASURED', note:'Requires compatible post-change operational evidence', tone:'purple'},",
    "{label:'Mean time to decide', value:'3.4m', note:'↓ 18% after split-workspace rollout', tone:'pink'},":
        "{label:'False positive rate', value:'NOT MEASURED', note:'No validated production or participant outcome yet', tone:'pink'},",
    "{label:'Auto-decision coverage', value:'82%', note:'Manual review reserved for ambiguous risk', tone:'muted'}":
        "{label:'Mean time to decide', value:'NOT MEASURED', note:'No validated baseline or post-change timing evidence yet', tone:'muted'}",
    "Approval share is stable while step-up challenges fell 2.3pp, indicating less customer friction without a corresponding rise in confirmed fraud.":
        "Scenario distribution only — no validated change in customer friction or confirmed fraud is claimed.",
    "Current shift quality and speed":
        "Synthetic shift dataset · not validated analyst performance",
    "Rules contributing most to review volume and containment":
        "Synthetic rule activity · prototype stress-test data, not production performance",
}

for old, new in replacements.items():
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'Expected one match for {old!r}, found {count}')
    text = text.replace(old, new, 1)

path.write_text(text, encoding='utf-8')
print('patched js/secondary.js truthful analytics boundary')
