import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

FEATURE_COLUMNS = [
    "days_present_ratio",
    "checkin_time_std_dev",
    "gps_boundary_score",
    "device_shared_count",
    "impossible_travel_count",
    "peer_checkin_correlation",
    "bank_change_velocity",
    "completeness_score",
    "deduction_ratio",
    "login_to_checkin_gap",
]


def _flag_reasons(row: dict, verdict: str) -> list[str]:
    reasons: list[str] = []
    if row["days_present_ratio"] < 0.3:
        reasons.append("Attended less than 30% of working days this month.")
    if row["days_present_ratio"] == 0.0:
        reasons.append("Zero attendance recorded for the entire month.")
    if row["checkin_time_std_dev"] < 3.0 and row["days_present"] > 5:
        reasons.append("Check-in times are suspiciously consistent - possible proxy clocking.")
    if row["gps_boundary_score"] > 0.5:
        reasons.append("Repeatedly checks in at the exact edge of the geofence - possible GPS spoofing.")
    if row["device_shared_count"] >= 2:
        reasons.append(f"Check-in device shared with {int(row['device_shared_count'])} other workers - possible buddy-punching ring.")
    if row["impossible_travel_count"] >= 1:
        reasons.append(f"Recorded {int(row['impossible_travel_count'])} physically impossible location jump(s) this month.")
    if row["peer_checkin_correlation"] >= 0.95:
        reasons.append("Check-in timestamps are 95%+ correlated with another worker - possible proxy attendance.")
    if row["bank_change_velocity"] >= 0.67:
        reasons.append("Bank account changed multiple times in the past 90 days.")
    if row["completeness_score"] < 0.3:
        reasons.append("Worker profile has minimal information - common in ghost worker registrations.")
    if row["deduction_ratio"] < 0.01 and row["gross_salary"] > 0:
        reasons.append("Paycheck has zero deductions across multiple months - atypical for a legitimate employee.")
    if row["login_to_checkin_gap"] > 120:
        reasons.append("Never logs into the system near check-in time - digital presence not confirmed.")
    if not reasons and verdict == "VERIFIED":
        return ["No anomalies detected. Attendance and behaviour patterns are consistent."]
    if not reasons:
        return ["Statistical anomaly detected. Manual review recommended."]
    return reasons


def run_ghost_detection(feature_rows: list[dict]) -> list[dict]:
    """Run Isolation Forest ghost-worker scoring for a company's feature rows."""

    if not feature_rows:
        return []
    df = pd.DataFrame(feature_rows)
    if len(df) < 5:
        return [
            {
                **row,
                "trust_score": 50.0,
                "anomaly_score": 0.0,
                "verdict": "SUSPICIOUS",
                "flag_reasons": ["Insufficient workforce data for statistical analysis. Manual review required."],
                "feature_values": {column: row.get(column, 0.0) for column in FEATURE_COLUMNS},
            }
            for row in feature_rows
        ]
    x = df[FEATURE_COLUMNS].fillna(0.0)
    scaler = StandardScaler()
    x_scaled = scaler.fit_transform(x)
    model = IsolationForest(contamination=0.10, n_estimators=200, random_state=42, max_samples="auto")
    model.fit_predict(x_scaled)
    raw_scores = model.score_samples(x_scaled)
    min_score = raw_scores.min()
    max_score = raw_scores.max()
    trust_scores = np.full(len(raw_scores), 50.0) if min_score == max_score else ((raw_scores - min_score) / (max_score - min_score)) * 100
    results = []
    for index, row in df.iterrows():
        trust = round(float(trust_scores[index]), 2)
        verdict = "VERIFIED" if trust >= 70 else "SUSPICIOUS" if trust >= 40 else "FLAGGED"
        row_dict = row.to_dict()
        results.append(
            {
                "worker_id": row_dict["worker_id"],
                "worker_name": row_dict["worker_name"],
                "role_name": row_dict["role_name"],
                "gross_salary": float(row_dict["gross_salary"]),
                "days_present": int(row_dict["days_present"]),
                "days_absent": int(row_dict["days_absent"]),
                "trust_score": trust,
                "anomaly_score": round(float(raw_scores[index]), 6),
                "verdict": verdict,
                "flag_reasons": _flag_reasons(row_dict, verdict),
                "feature_values": {column: float(row_dict.get(column, 0.0)) for column in FEATURE_COLUMNS},
            }
        )
    return results

