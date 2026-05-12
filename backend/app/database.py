from functools import lru_cache

from supabase import Client, create_client
try:
    from supabase.lib.client_options import ClientOptions
except ImportError:  # pragma: no cover - keeps older supabase-py builds usable.
    ClientOptions = None  # type: ignore[assignment]

from app.config import get_settings


def _create_server_client(url: str, key: str) -> Client:
    """Create a Supabase client that does not persist shared auth sessions."""

    if ClientOptions is None:
        return create_client(url, key)
    return create_client(
        url,
        key,
        options=ClientOptions(auto_refresh_token=False, persist_session=False),
    )


@lru_cache
def get_supabase_auth_client() -> Client:
    """Return a singleton Supabase anon-key client for user auth flows."""

    settings = get_settings()
    return _create_server_client(settings.supabase_url, settings.supabase_anon_key)


@lru_cache
def get_supabase_db_client() -> Client:
    """Return a singleton Supabase service-role client for server DB work."""

    settings = get_settings()
    return _create_server_client(settings.supabase_url, settings.supabase_service_key)


@lru_cache
def get_supabase_admin_client() -> Client:
    """Return a singleton Supabase service-role client for admin auth operations."""

    settings = get_settings()
    return _create_server_client(settings.supabase_url, settings.supabase_service_key)


def get_supabase() -> Client:
    """Backward-compatible alias for the service-role database client."""

    return get_supabase_db_client()

