import os
from typing import List, Optional, Type

import requests
from httpx import AsyncClient
from langchain.tools import BaseTool
from pydantic import BaseModel, Field, model_validator

_httpx_client: Optional[AsyncClient] = None
if _httpx_client is None:
    _httpx_client = AsyncClient(base_url="https://api.vultr.com/v2", timeout=30.0)


class _ListRegionsToolInput(BaseModel):
    """Input for list regions tool"""

    tool_input: str = Field("", description="An empty string")


class ListRegionsTool(BaseTool):
    """Tool to list all regions where instances can be deployed."""

    name: str = "list_regions"
    description: str = (
        "List all Vultr regions (datacenter locations). Returns region id, city, country, and availability. "
        "Call this first to choose where to deploy; use the region id in create_bare_metal_instance. "
        "Bare metal plans are not available in every region—check plan availability for the chosen region."
    )
    args_schema: Type[_ListRegionsToolInput] = _ListRegionsToolInput

    def _run(self, tool_input: str) -> str:
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

    async def _arun(self, tool_input: str) -> str:
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


class _CreateBareMetalInstanceToolInput(BaseModel):
    """Input for create bare metal instance tool"""

    region: str = Field(
        ...,
        description="Vultr region id (e.g. ewr, lax, ams). Get valid ids from list_regions.",
    )
    plan: str = Field(
        ...,
        description="Bare metal plan id. Get valid ids from list_bare_metal_plans; ensure the plan is available in the chosen region.",
    )
    script_id: Optional[str] = Field(
        None, description="The Startup Script id to use for this instance"
    )
    enable_ipv6: Optional[bool] = Field(None, description="Enable IPv6")
    sshkey_id: Optional[List[str]] = Field(
        None,
        description="SSH key id(s) from list_ssh_keys or ensure_ssh_key to install on the instance for SSH access.",
    )
    user_data: Optional[str] = Field(
        None,
        description="The user-supplied, base64 encoded user data for this Instance",
    )
    label: Optional[str] = Field(
        None,
        description="Short label for the instance (e.g. 'web-server-1') to identify it in the dashboard.",
    )
    activation_email: Optional[bool] = Field(
        None, description="Notify by email after deployment (default: false)"
    )
    hostname: Optional[str] = Field(
        None,
        description="Hostname to set on the instance (e.g. 'my-server.example.com').",
    )
    tag: Optional[str] = Field(
        None, description="Deprecated: Use tags instead. The user-supplied tag"
    )
    reserved_ipv4: Optional[str] = Field(
        None, description="The Reserved IP id for this instance"
    )
    os_id: Optional[int] = Field(
        None,
        description="Operating system id from list_os (e.g. Ubuntu, Debian). Use this for a plain OS; do not combine with app_id/image_id.",
    )
    snapshot_id: Optional[str] = Field(
        None,
        description="Snapshot id to restore from. Use when the user wants to clone an existing snapshot.",
    )
    app_id: Optional[int] = Field(
        None,
        description="Application id from list_applications for one-click/marketplace apps. Use app_id or image_id, not both with os_id.",
    )
    image_id: Optional[str] = Field(
        None,
        description="Application image_id from list_applications (used with some marketplace apps). Use app_id or image_id as required by the app.",
    )
    ipxe_chain_url: Optional[str] = Field(
        None,
        description="The URL location of the iPXE chainloader. If used, os_id must be set to 159",
    )
    persistent_pxe: Optional[bool] = Field(
        None, description="Enable persistent PXE (default: false)"
    )
    attach_vpc2: Optional[List[str]] = Field(
        None,
        description="Deprecated: An array of VPC IDs to attach to this Bare Metal Instance",
    )
    detach_vpc2: Optional[List[str]] = Field(
        None,
        description="Deprecated: An array of VPC IDs to detach from this Bare Metal Instance",
    )
    enable_vpc2: Optional[bool] = Field(
        None,
        description="Deprecated: If true, VPC 2.0 support will be added to the new server",
    )
    tags: Optional[List[str]] = Field(
        None,
        description="Tags for organizing instances (e.g. ['production', 'web']).",
    )
    user_scheme: Optional[str] = Field(
        None,
        description="Linux-only: The user scheme used for logging into this instance (root or limited)",
    )
    mdisk_mode: Optional[str] = Field(
        None,
        description="The RAID configuration used for the disks on this instance (raid1, jbod, or none)",
    )
    app_variables: Optional[dict] = Field(
        None,
        description="The app variable inputs for configuring the marketplace app (name/value pairs)",
    )

    @model_validator(mode="after")
    def require_deployment_method(self) -> "_CreateBareMetalInstanceToolInput":
        if not any([self.os_id, self.snapshot_id, self.app_id, self.image_id]):
            raise ValueError(
                "At least one of os_id, snapshot_id, app_id, or image_id must be provided"
            )
        return self


class CreateBareMetalInstanceTool(BaseTool):
    """Tool to create a bare metal server (dedicated hardware) on Vultr."""

    name: str = "create_bare_metal_instance"
    description: str = (
        "Deploy a new bare metal instance. Required: region (from list_regions), plan (from list_bare_metal_plans), "
        "and exactly one deployment method: os_id (from list_os for a plain OS), or app_id/image_id (from list_applications "
        "for one-click apps), or snapshot_id (to restore from snapshot). Optional: sshkey_id (from list_ssh_keys or ensure_ssh_key), "
        "label, hostname, enable_ipv6, tags. Always resolve ids from the list_* tools before calling this."
    )
    args_schema: Type[_CreateBareMetalInstanceToolInput] = _CreateBareMetalInstanceToolInput

    def _run(
        self,
        region: str,
        plan: str,
        script_id: Optional[str] = None,
        enable_ipv6: Optional[bool] = None,
        sshkey_id: Optional[List[str]] = None,
        user_data: Optional[str] = None,
        label: Optional[str] = None,
        activation_email: Optional[bool] = None,
        hostname: Optional[str] = None,
        tag: Optional[str] = None,
        reserved_ipv4: Optional[str] = None,
        os_id: Optional[int] = None,
        snapshot_id: Optional[str] = None,
        app_id: Optional[int] = None,
        image_id: Optional[str] = None,
        ipxe_chain_url: Optional[str] = None,
        persistent_pxe: Optional[bool] = None,
        attach_vpc2: Optional[List[str]] = None,
        detach_vpc2: Optional[List[str]] = None,
        enable_vpc2: Optional[bool] = None,
        tags: Optional[List[str]] = None,
        user_scheme: Optional[str] = None,
        mdisk_mode: Optional[str] = None,
        app_variables: Optional[dict] = None,
    ) -> str:
        """Run the tool"""
        try:
            input_model = _CreateBareMetalInstanceToolInput(
                region=region,
                plan=plan,
                script_id=script_id,
                enable_ipv6=enable_ipv6,
                sshkey_id=sshkey_id,
                user_data=user_data,
                label=label,
                activation_email=activation_email,
                hostname=hostname,
                tag=tag,
                reserved_ipv4=reserved_ipv4,
                os_id=os_id,
                snapshot_id=snapshot_id,
                app_id=app_id,
                image_id=image_id,
                ipxe_chain_url=ipxe_chain_url,
                persistent_pxe=persistent_pxe,
                attach_vpc2=attach_vpc2,
                detach_vpc2=detach_vpc2,
                enable_vpc2=enable_vpc2,
                tags=tags,
                user_scheme=user_scheme,
                mdisk_mode=mdisk_mode,
                app_variables=app_variables,
            )
            payload = input_model.model_dump(exclude_none=True)

            response = requests.post(
                "https://api.vultr.com/v2/bare-metals",
                headers={
                    "Authorization": f"Bearer {os.getenv('VULTR_API_KEY')}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Error creating bare metal instance: {e}")

    async def _arun(
        self,
        region: str,
        plan: str,
        script_id: Optional[str] = None,
        enable_ipv6: Optional[bool] = None,
        sshkey_id: Optional[List[str]] = None,
        user_data: Optional[str] = None,
        label: Optional[str] = None,
        activation_email: Optional[bool] = None,
        hostname: Optional[str] = None,
        tag: Optional[str] = None,
        reserved_ipv4: Optional[str] = None,
        os_id: Optional[int] = None,
        snapshot_id: Optional[str] = None,
        app_id: Optional[int] = None,
        image_id: Optional[str] = None,
        ipxe_chain_url: Optional[str] = None,
        persistent_pxe: Optional[bool] = None,
        attach_vpc2: Optional[List[str]] = None,
        detach_vpc2: Optional[List[str]] = None,
        enable_vpc2: Optional[bool] = None,
        tags: Optional[List[str]] = None,
        user_scheme: Optional[str] = None,
        mdisk_mode: Optional[str] = None,
        app_variables: Optional[dict] = None,
    ) -> str:
        """Run the tool asynchronously"""

        try:
            input_model = _CreateBareMetalInstanceToolInput(
                region=region,
                plan=plan,
                script_id=script_id,
                enable_ipv6=enable_ipv6,
                sshkey_id=sshkey_id,
                user_data=user_data,
                label=label,
                activation_email=activation_email,
                hostname=hostname,
                tag=tag,
                reserved_ipv4=reserved_ipv4,
                os_id=os_id,
                snapshot_id=snapshot_id,
                app_id=app_id,
                image_id=image_id,
                ipxe_chain_url=ipxe_chain_url,
                persistent_pxe=persistent_pxe,
                attach_vpc2=attach_vpc2,
                detach_vpc2=detach_vpc2,
                enable_vpc2=enable_vpc2,
                tags=tags,
                user_scheme=user_scheme,
                mdisk_mode=mdisk_mode,
                app_variables=app_variables,
            )
            payload = input_model.model_dump(exclude_none=True)

            response = await _httpx_client.post(
                "/bare-metals",
                headers={
                    "Authorization": f"Bearer {os.getenv('VULTR_API_KEY')}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data
        except Exception as e:
            raise ValueError(f"Error creating bare metal instance: {e}")


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
    """Tool to list bare metal (dedicated server) plans with specs and pricing."""

    name: str = "list_bare_metal_plans"
    description: str = (
        "List all bare metal plans: CPU, RAM, disk, price, and which regions support each plan. "
        "Use this to pick a plan that matches the user's needs and is available in the chosen region; "
        "use the plan id in create_bare_metal_instance."
    )
    args_schema: Type[_ListBareMetalPlansToolInput] = _ListBareMetalPlansToolInput

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
            plans = data.get("plans_metal", [])
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
    """Tool to list SSH keys already registered in the Vultr account."""

    name: str = "list_ssh_keys"
    description: str = (
        "List SSH keys in the account. Returns id and name for each key. "
        "Use the id(s) as sshkey_id when creating an instance so the user can SSH in."
    )
    args_schema: Type[_ListSshKeysToolInput] = _ListSshKeysToolInput

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
    """Tool to ensure at least one SSH key exists; creates one if the account has none."""

    name: str = "ensure_ssh_key"
    description: str = (
        "If the account has no SSH keys, create one with the given name and public key; otherwise return existing keys. "
        "Use when the user wants SSH access and has provided a public key. Use the returned key id as sshkey_id in create_bare_metal_instance."
    )
    args_schema: Type[_EnsureSshKeyToolInput] = _EnsureSshKeyToolInput

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
    """Tool to list available operating system images (plain OS, no one-click app)."""

    name: str = "list_os"
    description: str = (
        "List OS images (e.g. Ubuntu, Debian, CentOS, Windows) with id and name. "
        "Use when the user wants a plain server with a specific OS; pass the os_id to create_bare_metal_instance. "
        "Do not use for one-click apps—use list_applications and app_id/image_id instead."
    )
    args_schema: Type[_ListOsToolInput] = _ListOsToolInput

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
    """Tool to list one-click and marketplace applications (e.g. Docker, WordPress)."""

    name: str = "list_applications"
    description: str = (
        "List applications (one-click and marketplace) with id, name, and image_id where applicable. "
        "Use when the user wants a preconfigured stack (e.g. Docker, LAMP, WordPress); pass app_id or image_id to create_bare_metal_instance. "
        "Optional type filter: 'marketplace', 'one-click', or 'all'."
    )
    args_schema: Type[_ListApplicationsToolInput] = _ListApplicationsToolInput

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
