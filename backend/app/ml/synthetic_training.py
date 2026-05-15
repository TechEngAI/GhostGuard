from pathlib import Path
import random

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report
from sklearn.preprocessing import StandardScaler


try:
    from faker import Faker

    fake = Faker("en_NG")
except ModuleNotFoundError:
    fake = None

FIRST_NAMES = ["Amina", "Chukwuemeka", "Tunde", "Ngozi", "Ifeoma", "Sadiq", "Temitope", "Kemi", "Ibrahim", "Efe"]
LAST_NAMES = ["Okafor", "Balogun", "Eze", "Adebayo", "Nwosu", "Abubakar", "Okonkwo", "Ogunleye", "Usman", "Etuk"]

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

ROLES = {
    "Operations Manager": {"salary": 450000, "work_type": "ONSITE"},
    "Engineer": {"salary": 320000, "work_type": "HYBRID"},
    "HR Officer": {"salary": 250000, "work_type": "HYBRID"},
    "Accountant": {"salary": 280000, "work_type": "HYBRID"},
    "Security Officer": {"salary": 120000, "work_type": "ONSITE"},
    "Cleaner": {"salary": 90000, "work_type": "ONSITE"},
    "Customer Support": {"salary": 180000, "work_type": "REMOTE"},
    "IT Admin": {"salary": 300000, "work_type": "HYBRID"},
}


def random_device() -> str:
    return f"DEV-{random.randint(10000, 99999)}"


def fake_name() -> str:
    if fake:
        return fake.name()
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def fake_account() -> str:
    if fake:
        return fake.bban()
    return "".join(str(random.randint(0, 9)) for _ in range(10))


def generate_worker_type() -> str:
    roll = random.random()
    if roll < 0.10:
        return "FLAGGED"
    if roll < 0.25:
        return "SUSPICIOUS"
    return "VERIFIED"


def clipped_normal(mean: float, std: float, low: float, high: float) -> float:
    return round(float(np.clip(np.random.normal(mean, std), low, high)), 3)


def feature_value(label: str, name: str) -> float:
    ranges = {
        "days_present_ratio": {"VERIFIED": (0.72, 0.12, 0.45, 1.0), "SUSPICIOUS": (0.48, 0.16, 0.18, 0.80), "FLAGGED": (0.25, 0.18, 0.0, 0.58)},
        "checkin_time_std_dev": {"VERIFIED": (18, 7, 8, 30), "SUSPICIOUS": (7, 3, 2, 12), "FLAGGED": (3, 2, 0, 6)},
        "gps_boundary_score": {"VERIFIED": (0.12, 0.10, 0, 0.35), "SUSPICIOUS": (0.42, 0.18, 0.10, 0.75), "FLAGGED": (0.65, 0.20, 0.30, 1.0)},
        "peer_checkin_correlation": {"VERIFIED": (0.42, 0.18, 0.05, 0.80), "SUSPICIOUS": (0.78, 0.12, 0.45, 0.97), "FLAGGED": (0.90, 0.08, 0.65, 1.0)},
        "bank_change_velocity": {"VERIFIED": (0.12, 0.12, 0, 0.45), "SUSPICIOUS": (0.50, 0.20, 0.12, 0.95), "FLAGGED": (0.88, 0.35, 0.25, 1.8)},
        "completeness_score": {"VERIFIED": (0.84, 0.12, 0.55, 1.0), "SUSPICIOUS": (0.55, 0.17, 0.25, 0.85), "FLAGGED": (0.32, 0.20, 0.0, 0.70)},
        "deduction_ratio": {"VERIFIED": (0.10, 0.04, 0.02, 0.20), "SUSPICIOUS": (0.04, 0.025, 0.0, 0.10), "FLAGGED": (0.015, 0.02, 0.0, 0.07)},
        "login_to_checkin_gap": {"VERIFIED": (18, 15, 1, 70), "SUSPICIOUS": (85, 45, 20, 180), "FLAGGED": (170, 120, 45, 600)},
    }
    mean, std, low, high = ranges[name][label]
    return clipped_normal(mean, std, low, high)


def generate_payroll_dataset(n_workers: int = 500, working_days: int = 22, output_file: str = "synthetic_payroll.csv") -> pd.DataFrame:
    """Generate realistic overlapping synthetic payroll features for GhostGuard ML experiments."""

    workers: list[dict] = []
    shared_devices = [random_device() for _ in range(12)]
    shared_bank_accounts = [fake_account() for _ in range(8)]
    for index in range(n_workers):
        label = generate_worker_type()
        role_name = random.choice(list(ROLES.keys()))
        role = ROLES[role_name]
        gross_salary = role["salary"]

        days_present_ratio = feature_value(label, "days_present_ratio")
        days_present = int(round(days_present_ratio * working_days))
        days_absent = max(0, working_days - days_present)
        if label == "VERIFIED":
            device_shared_count = random.choice([0, 0, 0, 1, 1, 2])
            impossible_travel_count = random.choice([0, 0, 0, 0, 1])
        elif label == "SUSPICIOUS":
            device_shared_count = random.choice([0, 1, 1, 2, 2, 3])
            impossible_travel_count = random.choice([0, 0, 1, 1, 2])
        else:
            device_shared_count = random.choice([1, 2, 2, 3, 4, 5])
            impossible_travel_count = random.choice([0, 1, 1, 2, 3, 4])

        deduction_ratio = feature_value(label, "deduction_ratio")
        total_deductions = gross_salary * deduction_ratio
        pension_deduct = round(total_deductions * random.uniform(0.45, 0.70), 2)
        health_deduct = round(total_deductions * random.uniform(0.10, 0.35), 2)
        other_deductions = round(max(0, total_deductions - pension_deduct - health_deduct), 2)
        device_id = random.choice(shared_devices) if device_shared_count >= 2 else random_device()
        bank_account = random.choice(shared_bank_accounts) if label == "FLAGGED" and random.random() < 0.7 else fake_account()

        workers.append(
            {
                "worker_id": f"W{index + 1:05d}",
                "worker_name": fake_name(),
                "role_name": role_name,
                "work_type": role["work_type"],
                "gross_salary": gross_salary,
                "pension_deduct": pension_deduct,
                "health_deduct": health_deduct,
                "other_deductions": other_deductions,
                "working_days": working_days,
                "days_present": days_present,
                "days_absent": days_absent,
                "days_present_ratio": round(days_present / working_days, 3),
                "checkin_time_std_dev": feature_value(label, "checkin_time_std_dev"),
                "gps_boundary_score": feature_value(label, "gps_boundary_score"),
                "device_shared_count": device_shared_count,
                "impossible_travel_count": impossible_travel_count,
                "peer_checkin_correlation": feature_value(label, "peer_checkin_correlation"),
                "bank_change_velocity": feature_value(label, "bank_change_velocity"),
                "completeness_score": feature_value(label, "completeness_score"),
                "deduction_ratio": round(deduction_ratio, 3),
                "login_to_checkin_gap": feature_value(label, "login_to_checkin_gap"),
                "device_id": device_id,
                "bank_account": bank_account,
                "verdict_label": label,
                "is_ghost": 1 if label == "FLAGGED" else 0,
            }
        )
    df = pd.DataFrame(workers).sample(frac=1, random_state=42).reset_index(drop=True)
    df.to_csv(output_file, index=False)
    return df


def train_synthetic_model(df: pd.DataFrame) -> dict:
    """Train an Isolation Forest on synthetic data and return simple diagnostics."""

    scaler = StandardScaler()
    x_scaled = scaler.fit_transform(df[FEATURE_COLUMNS].fillna(0.0))
    model = IsolationForest(contamination=0.10, n_estimators=200, random_state=42, max_samples="auto")
    predictions = model.fit_predict(x_scaled)
    predicted_ghost = (predictions == -1).astype(int)
    report = classification_report(df["is_ghost"], predicted_ghost, output_dict=True, zero_division=0)
    return {"rows": len(df), "class_distribution": df["verdict_label"].value_counts().to_dict(), "classification_report": report}


if __name__ == "__main__":
    output = Path("synthetic_payroll.csv")
    dataset = generate_payroll_dataset(n_workers=500, working_days=22, output_file=str(output))
    diagnostics = train_synthetic_model(dataset)
    print(diagnostics)
