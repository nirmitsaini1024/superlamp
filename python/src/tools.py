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


class _ListBareMetalPlansToolInput(BaseModel):
    """Input for list bare metal plans tool"""

    per_page: Optional[str] = Field(
        None,
        description="Number of items requested per page. Default is 100 and Max is 500.",
    )
    cursor: Optional[str] = Field(
        None,
        description="Cursor for paging. See Meta and Pagination.",
    )


class ListBareMetalPlansTool(BaseTool):
    """Tool to list all Bare Metal plans"""

    name: str = "list_bare_metal_plans"
    description: str = "List all Bare Metal plans available for Vultr"
    args_schema: _ListBareMetalPlansToolInput = _ListBareMetalPlansToolInput

    def _run(self, per_page: Optional[str] = None, cursor: Optional[str] = None) -> str:
        """Run the tool"""
        try:
            params = {}
            if per_page:
                params["per_page"] = per_page
            if cursor:
                params["cursor"] = cursor

            response = requests.get(
                "https://api.vultr.com/v2/plans-metal",
                params=params,
                headers={"Authorization": f"Bearer {os.getenv('VULTR_API_KEY')}"},
            )
            response.raise_for_status()
            data = response.json()
            plans = data["plans"]
            return plans
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Error listing bare metal plans: {e}")

    async def _arun(self, per_page: Optional[str] = None, cursor: Optional[str] = None) -> str:
        """Run the tool asynchronously"""

        try:
            params = {}
            if per_page:
                params["per_page"] = per_page
            if cursor:
                params["cursor"] = cursor

            response = await _httpx_client.get(
                "/plans-metal",
                params=params,
                headers={"Authorization": f"Bearer {os.getenv('VULTR_API_KEY')}"},
            )
            response.raise_for_status()
            data = response.json()
            plans = data["plans"]
            return plans
        except AsyncClient.exceptions.RequestException as e:
            raise ValueError(f"Error listing bare metal plans: {e}")


class _ListSshKeysToolInput(BaseModel):
    """Input for list SSH keys tool"""

    per_page: Optional[int] = Field(
        None,
        description="Number of items requested per page. Default is 100 and Max is 500.",
    )
    cursor: Optional[str] = Field(
        None,
        description="Cursor for paging. See Meta and Pagination.",
    )


class ListSshKeysTool(BaseTool):
    """Tool to list all SSH keys"""

    name: str = "list_ssh_keys"
    description: str = "List all SSH keys in the Vultr account"
    args_schema: _ListSshKeysToolInput = _ListSshKeysToolInput

    def _run(self, per_page: Optional[int] = None, cursor: Optional[str] = None) -> str:
        """Run the tool"""
        try:
            params = {}
            if per_page:
                params["per_page"] = per_page
            if cursor:
                params["cursor"] = cursor

            response = requests.get(
                "https://api.vultr.com/v2/ssh-keys",
                params=params,
                headers={"Authorization": f"Bearer {os.getenv('VULTR_API_KEY')}"},
            )
            response.raise_for_status()
            data = response.json()
            ssh_keys = data["ssh_keys"]
            return ssh_keys
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Error listing SSH keys: {e}")

    async def _arun(self, per_page: Optional[int] = None, cursor: Optional[str] = None) -> str:
        """Run the tool asynchronously"""

        try:
            params = {}
            if per_page:
                params["per_page"] = per_page
            if cursor:
                params["cursor"] = cursor

            response = await _httpx_client.get(
                "/ssh-keys",
                params=params,
                headers={"Authorization": f"Bearer {os.getenv('VULTR_API_KEY')}"},
            )
            response.raise_for_status()
            data = response.json()
            ssh_keys = data["ssh_keys"]
            return ssh_keys
        except AsyncClient.exceptions.RequestException as e:
            raise ValueError(f"Error listing SSH keys: {e}")


class _EnsureSshKeyToolInput(BaseModel):
    """Input for ensure SSH key tool"""

    name: str = Field(..., description="The user-supplied name for this SSH Key.")
    ssh_key: str = Field(..., description="The SSH Key.")
    per_page: Optional[int] = Field(
        None,
        description="Number of items requested per page. Default is 100 and Max is 500.",
    )
    cursor: Optional[str] = Field(
        None,
        description="Cursor for paging. See Meta and Pagination.",
    )


class EnsureSshKeyTool(BaseTool):
    """Tool to ensure an SSH key exists; creates one if none exist"""

    name: str = "ensure_ssh_key"
    description: str = "List SSH keys and create one if the account has none"
    args_schema: _EnsureSshKeyToolInput = _EnsureSshKeyToolInput

    def _run(
        self,
        name: str,
        ssh_key: str,
        per_page: Optional[int] = None,
        cursor: Optional[str] = None,
    ) -> str:
        """Run the tool"""
        try:
            params = {}
            if per_page:
                params["per_page"] = per_page
            if cursor:
                params["cursor"] = cursor

            list_response = requests.get(
                "https://api.vultr.com/v2/ssh-keys",
                params=params,
                headers={"Authorization": f"Bearer {os.getenv('VULTR_API_KEY')}"},
            )
            list_response.raise_for_status()
            list_data = list_response.json()
            ssh_keys = list_data.get("ssh_keys", [])

            if ssh_keys:
                return ssh_keys

            create_response = requests.post(
                "https://api.vultr.com/v2/ssh-keys",
                json={"name": name, "ssh_key": ssh_key},
                headers={"Authorization": f"Bearer {os.getenv('VULTR_API_KEY')}"},
            )
            create_response.raise_for_status()
            create_data = create_response.json()
            return create_data
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Error ensuring SSH key: {e}")

    async def _arun(
        self,
        name: str,
        ssh_key: str,
        per_page: Optional[int] = None,
        cursor: Optional[str] = None,
    ) -> str:
        """Run the tool asynchronously"""

        try:
            params = {}
            if per_page:
                params["per_page"] = per_page
            if cursor:
                params["cursor"] = cursor

            list_response = await _httpx_client.get(
                "/ssh-keys",
                params=params,
                headers={"Authorization": f"Bearer {os.getenv('VULTR_API_KEY')}"},
            )
            list_response.raise_for_status()
            list_data = list_response.json()
            ssh_keys = list_data.get("ssh_keys", [])

            if ssh_keys:
                return ssh_keys

            create_response = await _httpx_client.post(
                "/ssh-keys",
                json={"name": name, "ssh_key": ssh_key},
                headers={"Authorization": f"Bearer {os.getenv('VULTR_API_KEY')}"},
            )
            create_response.raise_for_status()
            create_data = create_response.json()
            return create_data
        except AsyncClient.exceptions.RequestException as e:
            raise ValueError(f"Error ensuring SSH key: {e}")


class _ListOsToolInput(BaseModel):
    """Input for list OS tool"""

    per_page: Optional[int] = Field(
        None,
        description="Number of items requested per page. Default is 100 and Max is 500.",
    )
    cursor: Optional[str] = Field(
        None,
        description="Cursor for paging. See Meta and Pagination.",
    )


class ListOsTool(BaseTool):
    """Tool to list all OS images"""

    name: str = "list_os"
    description: str = "List all OS images available for Vultr"
    args_schema: _ListOsToolInput = _ListOsToolInput

    def _run(self, per_page: Optional[int] = None, cursor: Optional[str] = None) -> str:
        """Run the tool"""
        try:
            params = {}
            if per_page:
                params["per_page"] = per_page
            if cursor:
                params["cursor"] = cursor

            response = requests.get(
                "https://api.vultr.com/v2/os",
                params=params,
                headers={"Authorization": f"Bearer {os.getenv('VULTR_API_KEY')}"},
            )
            response.raise_for_status()
            data = response.json()
            os_list = data["os"]
            return os_list
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Error listing OS images: {e}")

    async def _arun(self, per_page: Optional[int] = None, cursor: Optional[str] = None) -> str:
        """Run the tool asynchronously"""

        try:
            params = {}
            if per_page:
                params["per_page"] = per_page
            if cursor:
                params["cursor"] = cursor

            response = await _httpx_client.get(
                "/os",
                params=params,
                headers={"Authorization": f"Bearer {os.getenv('VULTR_API_KEY')}"},
            )
            response.raise_for_status()
            data = response.json()
            os_list = data["os"]
            return os_list
        except AsyncClient.exceptions.RequestException as e:
            raise ValueError(f"Error listing OS images: {e}")


class _ListApplicationsToolInput(BaseModel):
    """Input for list applications tool"""

    type: Optional[str] = Field(
        None,
        description="Filter the results by type: all, marketplace, or one-click.",
    )
    per_page: Optional[int] = Field(
        None,
        description="Number of items requested per page. Default is 100 and Max is 500.",
    )
    cursor: Optional[str] = Field(
        None,
        description="Cursor for paging. See Meta and Pagination.",
    )


class ListApplicationsTool(BaseTool):
    """Tool to list all applications"""

    name: str = "list_applications"
    description: str = "List all applications available for Vultr"
    args_schema: _ListApplicationsToolInput = _ListApplicationsToolInput

    def _run(
        self,
        type: Optional[str] = None,
        per_page: Optional[int] = None,
        cursor: Optional[str] = None,
    ) -> str:
        """Run the tool"""
        try:
            params = {}
            if type:
                params["type"] = type
            if per_page:
                params["per_page"] = per_page
            if cursor:
                params["cursor"] = cursor

            response = requests.get(
                "https://api.vultr.com/v2/applications",
                params=params,
                headers={"Authorization": f"Bearer {os.getenv('VULTR_API_KEY')}"},
            )
            response.raise_for_status()
            data = response.json()
            applications = data["applications"]
            return applications
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Error listing applications: {e}")

    async def _arun(
        self,
        type: Optional[str] = None,
        per_page: Optional[int] = None,
        cursor: Optional[str] = None,
    ) -> str:
        """Run the tool asynchronously"""

        try:
            params = {}
            if type:
                params["type"] = type
            if per_page:
                params["per_page"] = per_page
            if cursor:
                params["cursor"] = cursor

            response = await _httpx_client.get(
                "/applications",
                params=params,
                headers={"Authorization": f"Bearer {os.getenv('VULTR_API_KEY')}"},
            )
            response.raise_for_status()
            data = response.json()
            applications = data["applications"]
            return applications
        except AsyncClient.exceptions.RequestException as e:
            raise ValueError(f"Error listing applications: {e}")
