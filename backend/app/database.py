from functools import lru_cache

from supabase import Client, create_client

from app.config import get_settings


@lru_cache
def get_supabase_auth_client() -> Client:
    """Return a singleton Supabase anon-key client for user auth flows."""

    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


@lru_cache
def get_supabase_db_client() -> Client:
    """Return a singleton Supabase service-role client for server DB work."""

    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_key)


@lru_cache
def get_supabase_admin_client() -> Client:
    """Return a singleton Supabase service-role client for admin auth operations."""

    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_key)


def get_supabase() -> Client:
    """Backward-compatible alias for the service-role database client."""

    return get_supabase_db_client()

