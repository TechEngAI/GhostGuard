from pydantic import BaseModel


class AnalyticsSummary(BaseModel):
    total_workers: int
    total_payroll_runs: int
    total_ghosts_detected: int
    total_excluded_workers: int
    total_salary_saved: float
    total_disbursed: float
    fraud_signal_count: int
    most_common_signal: dict | None = None
