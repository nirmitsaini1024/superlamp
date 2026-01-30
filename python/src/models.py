from pydantic import BaseModel
from typing import Optional

class AgentRequest(BaseModel):
    message: Optional[str] = None
    session_id: Optional[str] = None
    thread_id: Optional[str] = None
    user_id: Optional[str] = None