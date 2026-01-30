from fastapi import FastAPI
from langfuse.langchain.CallbackHandler import LangchainCallbackHandler
from agent import get_agent
from models import AgentRequest
import uvicorn

app = FastAPI()
_callback_handler = LangchainCallbackHandler()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/agent")
async def agent(request: AgentRequest):
    agent_executor = get_agent()
    output = await agent_executor.ainvoke(
        {"messages": [("user", request.message)]},
        config={
            "configurable": {
                "thread_id": request.thread_id,
            },
            "metadata": {
                "user_id": request.user_id,
                "thread_id": request.thread_id,
                "langfuse_user_id": request.user_id,
                "langfuse_session_id": request.session_id,
                "langfuse_tags": ["VULTR_CHATBOT"],
            },
            "callbacks": [_callback_handler],
        },
    )
    return output

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
