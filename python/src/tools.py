from httpx import AsyncClient
import requests
import os
from typing import Optional

from langchain.tools import BaseTool
from pydantic import BaseModel, Field

_httpx_client: Optional[AsyncClient] = None
if _httpx_client is None:
    _httpx_client = AsyncClient(base_url="https://api.vultr.com/v2", timeout=30.0)


class _ListRegionsToolInput(BaseModel):
    """Input for list regions tool"""

    tool_input: str = Field("", description="An empty string")


class ListRegionsTool(BaseTool):
    """Tool to list all regions"""

    name: str = "list_regions"
    description: str = "List all the regions available for Vultr"
    args_schema: _ListRegionsToolInput = _ListRegionsToolInput

    def _run(self, query: str) -> str:
        """Run the tool"""
        try:
            response = requests.get(
                "https://api.vultr.com/v2/regions",
                headers={"Authorization": f"Bearer {os.getenv('VULTR_API_KEY')}"},
            )
            response.raise_for_status()
            data = response.json()
            regions = data["regions"]
            return regions
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Error listing regions: {e}")

    async def _arun(self, query: str) -> str:
        """Run the tool asynchronously"""

        try:
            response = await _httpx_client.get(
                "/regions",
                headers={"Authorization": f"Bearer {os.getenv('VULTR_API_KEY')}"},
            )
            response.raise_for_status()
            data = response.json()
            regions = data["regions"]
            return regions
        except AsyncClient.exceptions.RequestException as e:
            raise ValueError(f"Error listing regions: {e}")
