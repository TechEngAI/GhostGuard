from pydantic import BaseModel


class AccountLookupData(BaseModel):
    account_name: str


class AccountLookupResponse(BaseModel):
    data: AccountLookupData

