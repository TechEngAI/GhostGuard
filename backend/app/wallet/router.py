from fastapi import APIRouter, Depends, HTTPException, Request
from app.wallet.service import (
    get_wallet_overview,
    initiate_wallet_deposit,
    handle_squad_webhook,
    get_wallet_transactions,
    get_wallet_balance
)
from app.wallet.schemas import InitiateDepositRequest, InitiateDepositResponse, WalletOverview, WalletTransaction, WalletBalance
from app.dependencies import get_current_admin
from typing import List, Optional

router = APIRouter(prefix="/admin", tags=["wallet"])


@router.get("/wallet", response_model=WalletOverview)
async def get_wallet(admin: dict = Depends(get_current_admin)):
    return await get_wallet_overview(admin["company_id"])


@router.post("/wallet/initiate-deposit", response_model=InitiateDepositResponse)
async def initiate_deposit_endpoint(
    request: InitiateDepositRequest,
    admin: dict = Depends(get_current_admin)
):
    return await initiate_wallet_deposit(request.amount_ngn, admin)


@router.get("/wallet/transactions", response_model=List[WalletTransaction])
async def get_transactions(
    page: int = 1,
    page_size: int = 20,
    type: Optional[str] = None,
    admin: dict = Depends(get_current_admin)
):
    return await get_wallet_transactions(admin["company_id"], page, page_size, type)


@router.get("/wallet/balance", response_model=WalletBalance)
async def get_balance(admin: dict = Depends(get_current_admin)):
    return await get_wallet_balance(admin["company_id"])


# Webhook endpoint - no auth, validate signature
@router.post("/webhooks/squad/payment")
async def squad_payment_webhook(request: Request):
    raw_body = await request.body()
    signature = request.headers.get("x-squad-signature", "")
    try:
        body = await request.json()
    except:
        body = {}
    return await handle_squad_webhook(raw_body, signature, body)