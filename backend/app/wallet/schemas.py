from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class WalletOverview(BaseModel):
    balance_ngn: float
    balance_kobo: int
    total_deposited_ngn: float
    total_disbursed_ngn: float
    last_deposit_at: Optional[datetime]
    last_disburse_at: Optional[datetime]
    recent_transactions: List[dict]  # List of wallet transactions
    squad_ledger_balance_ngn: float


class InitiateDepositRequest(BaseModel):
    amount_ngn: float


class InitiateDepositResponse(BaseModel):
    checkout_url: str
    transaction_reference: str
    amount_ngn: float


class WalletTransaction(BaseModel):
    id: str
    company_id: str
    type: str
    amount_kobo: int
    amount_ngn: float
    squad_reference: Optional[str]
    squad_tx_id: Optional[str]
    squad_nip_ref: Optional[str]
    status: str
    description: Optional[str]
    worker_id: Optional[str]
    payroll_run_id: Optional[str]
    failure_reason: Optional[str]
    squad_response: Optional[dict]
    created_at: datetime
    updated_at: datetime


class WalletBalance(BaseModel):
    balance_kobo: int
    balance_ngn: float