from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from Auth.Config import ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, SECRET_KEY
from jose import JWTError, jwt

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token

def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        return payload
    
    except JWTError as e:
        print(f"Token verification failed: {e}")
        return None
    
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict[str, Any]:
    """
    Dependency that verifies the JWT token from the Authorization header 
    and returns the decoded user payload. Raises HTTPException on failure.
    """
    token = credentials.credentials
    user_payload = verify_access_token(token)
    
    if user_payload is None:
        # Raise 401 Unauthorized if token is missing, expired, or invalid
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user_payload