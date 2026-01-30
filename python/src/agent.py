from typing import Optional, List
import os

from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph.state import CompiledStateGraph
from langchain.tools import BaseTool
from prompt import SYSTEM_PROMPT
from tools import (
    ListRegionsTool,
    ListSshKeysTool,
    EnsureSshKeyTool,
    ListOsTool,
    ListApplicationsTool,
    ListBareMetalPlansTool,
    ListPlansTool,
    ListAvailablePlansInRegionTool,
    ListInstancesTool,
    GetInstanceTool,
    CreateVpsInstanceTool,
    CreateBareMetalInstanceTool,
)
from langchain_tavily import TavilySearch, TavilyCrawl
from dotenv import load_dotenv

load_dotenv()

_checkpoint: Optional[InMemorySaver] = None
_tools: Optional[List[BaseTool]] = None
_agent: Optional[CompiledStateGraph] = None

model = ChatOpenAI(
    model="google/gemini-2.5-flash",
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)


def get_tools():
    global _tools
    if _tools is None:
        _tools = [
            ListRegionsTool(),
            ListSshKeysTool(),
            EnsureSshKeyTool(),
            ListOsTool(),
            ListApplicationsTool(),
            ListBareMetalPlansTool(),
            ListPlansTool(),
            ListAvailablePlansInRegionTool(),
            ListInstancesTool(),
            GetInstanceTool(),
            CreateVpsInstanceTool(),
            CreateBareMetalInstanceTool(),
            TavilySearch(),
            TavilyCrawl(),
        ]
    return _tools


def get_checkpoint():
    global _checkpoint
    if _checkpoint is None: 
        _checkpoint = InMemorySaver()
    return _checkpoint


def get_middleware():
    return None


def get_agent():
    global _agent

    if _agent is None:
        tools = get_tools()
        checkpoint = get_checkpoint()
        _agent = create_agent(
            model=model,
            tools=tools,
            system_prompt=SYSTEM_PROMPT,
            checkpointer=checkpoint,
        )
    return _agent
